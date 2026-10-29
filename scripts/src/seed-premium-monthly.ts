import { stripeRequest } from "./stripeClient";

const LOOKUP_KEY = "mandarin_garden_premium_monthly";
const PRODUCT_NAME = "Mandarin Garden Premium";
const AMOUNT_USD_CENTS = 999;

type StripePrice = {
  id: string;
  active: boolean;
  currency: string;
  unit_amount: number | null;
  livemode: boolean;
  recurring?: { interval: string } | null;
};

type StripeProduct = {
  id: string;
  name: string;
  metadata: Record<string, string>;
};

async function seedPremiumMonthlyPrice(): Promise<void> {
  const priceQuery = new URLSearchParams();
  priceQuery.append("lookup_keys[]", LOOKUP_KEY);
  priceQuery.set("limit", "10");
  const existingPrices = await stripeRequest<{ data: StripePrice[] }>(
    `/v1/prices?${priceQuery.toString()}`,
  );
  const existingPrice = existingPrices.data[0];

  if (existingPrices.data.length > 1) {
    throw new Error(`More than one Stripe price uses lookup key ${LOOKUP_KEY}.`);
  }

  if (existingPrice) {
    const isExpectedPrice =
      existingPrice.active &&
      existingPrice.currency === "usd" &&
      existingPrice.unit_amount === AMOUNT_USD_CENTS &&
      existingPrice.recurring?.interval === "month";

    if (!isExpectedPrice) {
      throw new Error(
        "The existing monthly price does not match US$9.99/month. Update it in Stripe before retrying.",
      );
    }

    console.info(`Premium monthly price already exists (${existingPrice.id}).`);
    return;
  }

  const productQuery = new URLSearchParams({
    active: "true",
    limit: "100",
  });
  const products = await stripeRequest<{ data: StripeProduct[] }>(
    `/v1/products?${productQuery.toString()}`,
  );
  let product =
    products.data.find((item) => item.metadata.plan === "premium_monthly") ??
    products.data.find((item) => item.name === PRODUCT_NAME);

  if (!product) {
    const form = new URLSearchParams({
      name: PRODUCT_NAME,
      description:
        "Monthly access to all four Mandarin Garden learning levels. Progress unlocks levels in order.",
      "metadata[plan]": "premium_monthly",
    });
    product = await stripeRequest<StripeProduct>("/v1/products", {
      method: "POST",
      form,
      idempotencyKey: "mandarin-garden-premium-product-v1",
    });
  }

  const priceForm = new URLSearchParams({
    product: product.id,
    unit_amount: String(AMOUNT_USD_CENTS),
    currency: "usd",
    "recurring[interval]": "month",
    lookup_key: LOOKUP_KEY,
  });
  const price = await stripeRequest<StripePrice>("/v1/prices", {
    method: "POST",
    form: priceForm,
    idempotencyKey: "mandarin-garden-premium-monthly-usd-999-v1",
  });

  console.info(`Created ${PRODUCT_NAME} monthly price (${price.id}).`);
}

seedPremiumMonthlyPrice().catch((error: unknown) => {
  const message =
    error instanceof Error ? error.message : "Stripe price setup failed.";
  console.error(message);
  process.exitCode = 1;
});
