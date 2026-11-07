import { Router, type IRouter } from "express";
import { LookupTranslationBody, LookupTranslationResponse } from "@workspace/api-zod";

const router: IRouter = Router();
const DAILY_CHARACTER_BUDGET = 4_500;
let budgetDate = "";
let charactersUsedToday = 0;

type MyMemoryResponse = {
  responseStatus?: number | string;
  responseDetails?: string;
  quotaFinished?: boolean | null;
  responseData?: { translatedText?: unknown };
};

function remainingBudget(now = new Date()): number {
  const today = now.toISOString().slice(0, 10);
  if (today !== budgetDate) {
    budgetDate = today;
    charactersUsedToday = 0;
  }
  return DAILY_CHARACTER_BUDGET - charactersUsedToday;
}

function chargeBudget(characters: number) {
  charactersUsedToday += characters;
}

function decodeEntities(text: string): string {
  return text.replace(/&(amp|lt|gt|quot|apos|#39|nbsp);/g, (entity, name: string) => {
    const replacements: Record<string, string> = {
      amp: "&",
      lt: "<",
      gt: ">",
      quot: '"',
      apos: "'",
      "#39": "'",
      nbsp: " ",
    };
    return replacements[name] ?? entity;
  });
}

router.post("/translation/lookup", async (req, res): Promise<void> => {
  res.setHeader("Cache-Control", "no-store");

  const parsed = LookupTranslationBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Enter one word or a short phrase of up to 100 characters." });
    return;
  }

  const text = parsed.data.text.trim();
  if (!text || text.includes("\n") || Buffer.byteLength(text, "utf8") > 500) {
    res.status(400).json({ error: "Enter one word or a short phrase of up to 100 characters." });
    return;
  }

  const characterCount = Array.from(text).length;
  if (characterCount > remainingBudget()) {
    res.status(429).json({ error: "The free daily translation allowance has been reached. Please try again tomorrow." });
    return;
  }

  const chineseCode = parsed.data.script === "zh-Hans" ? "zh-CN" : "zh-TW";
  const isChinese = /\p{Script=Han}/u.test(text);
  const sourceLanguage = isChinese ? chineseCode : "en";
  const targetLanguage = isChinese ? "en" : chineseCode;
  const url = new URL("https://api.mymemory.translated.net/get");
  url.searchParams.set("q", text);
  url.searchParams.set("langpair", `${sourceLanguage}|${targetLanguage}`);

  chargeBudget(characterCount);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8_000);
  let providerResponse: Response;
  try {
    providerResponse = await fetch(url, {
      method: "GET",
      headers: { Accept: "application/json" },
      signal: controller.signal,
    });
  } catch (error) {
    req.log.warn(
      { errorName: error instanceof Error ? error.name : "UnknownError" },
      "Free translation provider request failed",
    );
    res.status(503).json({ error: "Translation is temporarily unavailable. Please try again." });
    return;
  } finally {
    clearTimeout(timeout);
  }

  if (!providerResponse.ok) {
    req.log.warn({ providerStatus: providerResponse.status }, "Free translation provider returned an error");
    res.status(providerResponse.status === 429 ? 429 : 503).json({
      error: providerResponse.status === 429
        ? "The free daily translation allowance has been reached. Please try again tomorrow."
        : "Translation is temporarily unavailable. Please try again.",
    });
    return;
  }

  let result: MyMemoryResponse;
  try {
    result = await providerResponse.json() as MyMemoryResponse;
  } catch {
    req.log.warn("Free translation provider returned invalid JSON");
    res.status(503).json({ error: "Translation is temporarily unavailable. Please try again." });
    return;
  }

  const providerStatus = Number(result.responseStatus);
  if (result.quotaFinished === true || providerStatus === 429) {
    res.status(429).json({ error: "The free daily translation allowance has been reached. Please try again tomorrow." });
    return;
  }
  if (providerStatus !== 200 || typeof result.responseData?.translatedText !== "string") {
    req.log.warn({ providerStatus: Number.isFinite(providerStatus) ? providerStatus : null }, "Free translation provider returned no translation");
    res.status(503).json({ error: "No translation is available right now. Please try again later." });
    return;
  }

  const translatedText = decodeEntities(result.responseData.translatedText).trim();
  if (!translatedText) {
    res.status(503).json({ error: "No translation is available right now. Please try again later." });
    return;
  }

  res.json(LookupTranslationResponse.parse({
    text,
    translatedText,
    sourceLanguage,
    targetLanguage,
  }));
});

export default router;
