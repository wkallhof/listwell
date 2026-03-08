import { Hono } from "hono";
import {
  SignedDataVerifier,
  Environment,
} from "@apple/app-store-server-library";
import { readFileSync } from "fs";
import { join } from "path";
import { addPurchasedCredits, getOrCreateUserCredits } from "../lib/credits";

const CREDITS_PER_PURCHASE = 5;

function loadRootCAs(): Buffer[] {
  const certDir = join(process.cwd(), "certs");
  const certFiles = [
    "AppleIncRootCertificate.cer",
    "AppleRootCA-G2.cer",
    "AppleRootCA-G3.cer",
  ];
  return certFiles.map((file) => readFileSync(join(certDir, file)));
}

let verifierInstance: SignedDataVerifier | null = null;

function getVerifier(): SignedDataVerifier {
  if (verifierInstance) return verifierInstance;

  const rootCAs = loadRootCAs();
  const bundleId = process.env.APPLE_BUNDLE_ID ?? "com.listwell.app";
  const appAppleId = Number(process.env.APPLE_APP_ID ?? "0");
  const isSandbox = process.env.APPLE_ENVIRONMENT !== "Production";

  verifierInstance = new SignedDataVerifier(
    rootCAs,
    true,
    isSandbox ? Environment.SANDBOX : Environment.PRODUCTION,
    bundleId,
    appAppleId,
  );

  return verifierInstance;
}

export const applePurchaseRoutes = new Hono();

applePurchaseRoutes.post("/purchases/apple/verify", async (c) => {
  const user = c.get("user");
  const body = await c.req.json();
  const signedTransaction = body.signedTransaction as string | undefined;

  if (!signedTransaction) {
    return c.json({ error: "signedTransaction is required" }, 400);
  }

  try {
    const verifier = getVerifier();
    const transaction =
      await verifier.verifyAndDecodeTransaction(signedTransaction);

    const originalTransactionId = transaction.originalTransactionId;
    if (!originalTransactionId) {
      return c.json({ error: "Invalid transaction: missing ID" }, 400);
    }

    // Ensure credit record exists
    await getOrCreateUserCredits(user.id);

    const result = await addPurchasedCredits(
      user.id,
      CREDITS_PER_PURCHASE,
      originalTransactionId,
    );

    return c.json({
      success: true,
      balance: result.balance,
      alreadyProcessed: result.alreadyProcessed,
    });
  } catch (error) {
    console.error("Apple purchase verification failed:", error);
    return c.json(
      {
        error: "Transaction verification failed",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      400,
    );
  }
});
