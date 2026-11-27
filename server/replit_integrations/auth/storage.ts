import { users, type User, type UpsertUser } from "@shared/models/auth";
import { db } from "../../db";
import { eq } from "drizzle-orm";

export class GoogleAccountConflictError extends Error {
  constructor(message = "El correo ya está asociado a otra identidad de Google") {
    super(message);
    this.name = "GoogleAccountConflictError";
  }
}

export interface GoogleProfileInput {
  sub: string;
  email: string;
  name?: string;
  givenName?: string;
  familyName?: string;
  picture?: string;
}

// Interface for auth storage operations
// (IMPORTANT) These user operations are mandatory for Replit Auth.
export interface IAuthStorage {
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  upsertGoogleUser(profile: GoogleProfileInput): Promise<User>;
}

class AuthStorage implements IAuthStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  /**
   * Asocia o crea un usuario autenticado con Google (email ya verificado).
   * Si existe previamente por `id = sub` o por `email`, preserva su `id` actual para no romper
   * matrículas, perfiles, vínculos familiares ni evaluaciones asociadas.
   */
  async upsertGoogleUser(profile: GoogleProfileInput): Promise<User> {
    const emailNorm = profile.email.trim().toLowerCase();
    const fullName =
      profile.name?.trim() ||
      [profile.givenName?.trim(), profile.familyName?.trim()].filter(Boolean).join(" ") ||
      undefined;

    return await db.transaction(async (tx) => {
      const [porId] = await tx.select().from(users).where(eq(users.id, profile.sub));
      if (porId) {
        const [otroConEmail] = await tx.select().from(users).where(eq(users.email, emailNorm));
        if (otroConEmail && otroConEmail.id !== porId.id) {
          throw new GoogleAccountConflictError("El nuevo correo ya pertenece a otra cuenta");
        }
        const [actualizado] = await tx
          .update(users)
          .set({
            email: emailNorm,
            name: fullName ?? porId.name,
            firstName: profile.givenName ?? porId.firstName,
            lastName: profile.familyName ?? porId.lastName,
            profileImageUrl: profile.picture ?? porId.profileImageUrl,
            provider: "google",
            updatedAt: new Date(),
          })
          .where(eq(users.id, porId.id))
          .returning();
        return actualizado;
      }

      const [porEmail] = await tx.select().from(users).where(eq(users.email, emailNorm));
      if (porEmail) {
        // Si la cuenta ya estaba vinculada a otra identidad Google distinta, rechazar conflicto.
        if (porEmail.provider === "google" && porEmail.id !== profile.sub) {
          throw new GoogleAccountConflictError();
        }
        const [actualizado] = await tx
          .update(users)
          .set({
            email: emailNorm,
            name: fullName ?? porEmail.name,
            firstName: profile.givenName ?? porEmail.firstName,
            lastName: profile.familyName ?? porEmail.lastName,
            profileImageUrl: profile.picture ?? porEmail.profileImageUrl,
            provider: "google",
            updatedAt: new Date(),
          })
          .where(eq(users.id, porEmail.id))
          .returning();
        return actualizado;
      }

      const [creado] = await tx
        .insert(users)
        .values({
          id: profile.sub,
          email: emailNorm,
          name: fullName,
          firstName: profile.givenName,
          lastName: profile.familyName,
          profileImageUrl: profile.picture,
          provider: "google",
        })
        .returning();
      return creado;
    });
  }
}

export const authStorage = new AuthStorage();
