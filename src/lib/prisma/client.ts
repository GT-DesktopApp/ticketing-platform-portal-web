import { PrismaClient } from "@prisma/client";

/**
 * Prisma Client Singleton for Next.js.
 *
 * Problem this solves:
 * In development, Next.js hot-reloads modules on every change. A naive
 * `new PrismaClient()` at module scope would create a brand-new client (and a
 * new database connection pool) on every reload, quickly exhausting Neon's
 * connection limit and throwing "too many connections".
 *
 * Solution:
 * Cache the client on the Node.js `globalThis` object, which survives module
 * reloads in dev. In production we always create exactly one instance per
 * server process, so the global cache is bypassed.
 *
 * This is the officially recommended pattern from the Prisma + Next.js docs.
 */

const prismaClientSingleton = () => {
  return new PrismaClient({
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
  });
};

type PrismaClientSingleton = ReturnType<typeof prismaClientSingleton>;

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClientSingleton | undefined;
};

export const prisma = globalForPrisma.prisma ?? prismaClientSingleton();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
