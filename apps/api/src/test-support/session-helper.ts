import { randomBytes, randomUUID } from "node:crypto";
import { makeSignature } from "better-auth/crypto";
import type { Db, ObjectId } from "mongodb";

/**
 * Inserts a test user and session into MongoDB using Better Auth's collection
 * schema, then returns the signed cookie header string for use in supertest:
 *
 *   const { cookieHeader } = await createTestSession(db, secret);
 *   await request(app).get("/api/v1/users/me").set("Cookie", cookieHeader);
 *
 * Better Auth's mongo adapter stores documents with _id as a string (the
 * entity's id), not as ObjectId — matching that shape here (DESIGN 10.8).
 */
export async function createTestSession(
  db: Db,
  betterAuthSecret: string,
): Promise<{ userId: string; cookieHeader: string }> {
  const userId = randomUUID().replaceAll("-", "");
  const sessionId = randomUUID().replaceAll("-", "");
  const token = randomBytes(24).toString("hex"); // 48-char hex token

  const now = new Date();
  const expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days

  // Better Auth stores _id as a plain string (not ObjectId) — cast to satisfy types
  await db.collection("user").insertOne({
    _id: userId as unknown as ObjectId,
    name: "Test User",
    email: `test-${userId}@example.com`,
    emailVerified: false,
    createdAt: now,
    updatedAt: now,
  });

  await db.collection("session").insertOne({
    _id: sessionId as unknown as ObjectId,
    token,
    userId,
    expiresAt,
    ipAddress: "",
    userAgent: "",
    createdAt: now,
    updatedAt: now,
  });

  // Signed cookie: "<token>.<HMAC-SHA256 signature>" (matches Better Auth's signCookieValue)
  const signature = await makeSignature(token, betterAuthSecret);
  const cookieHeader = `better-auth.session_token=${token}.${signature}`;

  return { userId, cookieHeader };
}
