import app from "./app";
import { logger } from "./lib/logger";
import { cleanupExpiredLearningChallenges } from "./routes/learning";

const rawPort = process.env["PORT"];

if (!rawPort) {
  throw new Error(
    "PORT environment variable is required but was not provided.",
  );
}

const port = Number(rawPort);
const CHALLENGE_CLEANUP_INTERVAL_MS = 24 * 60 * 60 * 1000;

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

const cleanupChallenges = () => {
  void cleanupExpiredLearningChallenges().catch((err) => {
    logger.error({ err }, "Expired learning challenge cleanup failed");
  });
};
cleanupChallenges();
const challengeCleanupTimer = setInterval(cleanupChallenges, CHALLENGE_CLEANUP_INTERVAL_MS);
challengeCleanupTimer.unref();

app.listen(port, (err) => {
  if (err) {
    logger.error({ err }, "Error listening on port");
    process.exit(1);
  }

  logger.info({ port }, "Server listening");
});
