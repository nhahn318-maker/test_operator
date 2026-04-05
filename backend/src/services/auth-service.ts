import bcrypt from "bcryptjs";
import { createHash, randomBytes } from "node:crypto";
import { randomUUID } from "node:crypto";

import { conflictError, unauthenticatedError } from "../common/errors";
import { SESSION_TTL_MS } from "../common/http";
import { InMemoryStore } from "../store/in-memory-store";
import { PublicUser, User } from "../types";

const hashSessionToken = (token: string) => createHash("sha256").update(token).digest("hex");

export class AuthService {
  constructor(private readonly store: InMemoryStore) {}

  async register(input: { email: string; password: string; displayName?: string }) {
    const existing = this.store.findUserByEmail(input.email);
    if (existing) {
      throw conflictError([{ field: "email", issue: "Already registered." }], "An account with this email already exists.");
    }

    const now = new Date().toISOString();
    const passwordHash = await bcrypt.hash(input.password, 10);
    const user = this.store.createUser({
      id: randomUUID(),
      email: input.email,
      passwordHash,
      displayName: input.displayName ?? null,
      createdAt: now,
    });

    return this.createSessionForUser(user);
  }

  async login(input: { email: string; password: string }) {
    const user = this.store.findUserByEmail(input.email);
    if (!user) {
      throw unauthenticatedError();
    }

    const passwordMatches = await bcrypt.compare(input.password, user.passwordHash);
    if (!passwordMatches) {
      throw unauthenticatedError();
    }

    return this.createSessionForUser(user);
  }

  getUserBySessionToken(rawToken: string) {
    const tokenHash = hashSessionToken(rawToken);
    const session = this.store.findSessionByTokenHash(tokenHash);
    if (!session || session.revokedAt || new Date(session.expiresAt).getTime() <= Date.now()) {
      return null;
    }

    return this.store.findUserById(session.userId);
  }

  revokeSession(rawToken: string) {
    const tokenHash = hashSessionToken(rawToken);
    const session = this.store.findSessionByTokenHash(tokenHash);
    if (!session || session.revokedAt) {
      throw unauthenticatedError();
    }

    this.store.revokeSession(session.id, new Date().toISOString());
  }

  toPublicUser(user: User): PublicUser {
    return {
      id: user.id,
      email: user.email,
      displayName: user.displayName,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  private createSessionForUser(user: User) {
    const rawToken = randomBytes(32).toString("hex");
    const now = new Date();
    const session = this.store.createSession({
      id: randomUUID(),
      userId: user.id,
      tokenHash: hashSessionToken(rawToken),
      createdAt: now.toISOString(),
      expiresAt: new Date(now.getTime() + SESSION_TTL_MS).toISOString(),
      revokedAt: null,
    });

    return {
      session,
      rawToken,
      user: this.toPublicUser(user),
    };
  }
}
