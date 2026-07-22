import crypto from "crypto";
import dbConnect from "@/lib/db";
import User from "@/models/User";

/**
 * Shared helpers for the authentication stack.
 * Used by NextAuth (auth.ts) and the mobile JWT API routes so that
 * Google sign-in behaves identically everywhere.
 */

/** The single secret used by NextAuth and the mobile JWT endpoints. */
export function getAuthSecret(): string {
  const secret = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET;
  if (!secret) {
    throw new Error(
      "Missing AUTH_SECRET (or NEXTAUTH_SECRET) environment variable"
    );
  }
  return secret;
}

/** Generate a unique-looking referral code derived from the user's name. */
export function generateReferralCode(name: string): string {
  const prefix = (name || "USR")
    .substring(0, 3)
    .toUpperCase()
    .replace(/[^A-Z]/g, "X");
  const random = crypto.randomBytes(3).toString("hex").toUpperCase();
  return `${prefix}${random}`;
}

/** Case-insensitive email lookup (emails are stored lowercase). */
export async function findUserByEmail(email: string) {
  await dbConnect();
  const normalized = email.toLowerCase().trim();
  return User.findOne({
    email: { $regex: new RegExp(`^${normalized}$`, "i") },
  });
}

export interface GoogleProfileInput {
  email?: string | null;
  name?: string | null;
  picture?: string | null;
}

/**
 * Find or create a user from a verified Google profile.
 * - Creates the account (with referral code) on first sign-in.
 * - Promotes shadow guest accounts to full accounts.
 * - Keeps name / image / emailVerified in sync on subsequent sign-ins.
 */
export async function findOrCreateGoogleUser(profile: GoogleProfileInput) {
  const email = (profile.email || "").toLowerCase().trim();
  if (!email) return null;

  await dbConnect();
  let dbUser = await User.findOne({
    email: { $regex: new RegExp(`^${email}$`, "i") },
  });

  if (!dbUser) {
    dbUser = await User.create({
      email,
      name: profile.name || email.split("@")[0],
      image: profile.picture || "",
      role: "user",
      emailVerified: new Date(), // verified by Google
      referralCode: generateReferralCode(profile.name || email),
    });
    return dbUser;
  }

  let changed = false;
  if (profile.name && dbUser.name !== profile.name) {
    dbUser.name = profile.name;
    changed = true;
  }
  if (profile.picture && dbUser.image !== profile.picture) {
    dbUser.image = profile.picture;
    changed = true;
  }
  if (!dbUser.emailVerified) {
    dbUser.emailVerified = new Date();
    changed = true;
  }
  if (!dbUser.referralCode) {
    dbUser.referralCode = generateReferralCode(dbUser.name || email);
    changed = true;
  }
  if (dbUser.isGuest) {
    dbUser.isGuest = false;
    changed = true;
  }
  if (changed) await dbUser.save();

  return dbUser;
}

/** Shape returned to clients / embedded into NextAuth user objects. */
export function serializeAuthUser(user: {
  _id: unknown;
  email?: string | null;
  name?: string | null;
  image?: string | null;
  role?: string | null;
  referralCode?: string | null;
  emailVerified?: Date | null;
}) {
  return {
    id: String(user._id),
    email: user.email ?? "",
    name: user.name ?? "",
    image: user.image ?? "",
    role: user.role ?? "user",
    referralCode: user.referralCode ?? undefined,
    emailVerified: user.emailVerified ?? undefined,
  };
}
