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

/** Decode a JWS payload without signature verification (development only). */
function decodeJWSPayload(jws: string): Record<string, unknown> {
  const parts = jws.split(".");
  if (parts.length !== 3) {
    throw new Error("Invalid JWS format");
  }
  const payload = Buffer.from(parts[1], "base64url").toString("utf-8");
  return JSON.parse(payload) as Record<string, unknown>;
}

export const applePurchaseRoutes = new Hono();

applePurchaseRoutes.post("/purchases/apple/verify", async (c) => {
  const user = c.get("user");
  const body = await c.req.json();
  const signedTransaction = body.signedTransaction as string | undefined;

  if (!signedTransaction) {
    return c.json({ error: "signedTransaction is required" }, 400);
  }

  const skipVerification = process.env.APPLE_SKIP_VERIFICATION === "true";

  try {
    let originalTransactionId: string | undefined;

    if (skipVerification) {
      console.warn(
        "[Apple IAP] APPLE_SKIP_VERIFICATION is enabled — skipping signature validation",
      );
      const decoded = decodeJWSPayload(signedTransaction);
      originalTransactionId = decoded.originalTransactionId as
        | string
        | undefined;
    } else {
      const verifier = getVerifier();
      const transaction =
        await verifier.verifyAndDecodeTransaction(signedTransaction);
      originalTransactionId = transaction.originalTransactionId;
    }

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
