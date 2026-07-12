import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

const databaseUrl = process.env.DATABASE_URL;

const globalForDb = globalThis as typeof globalThis & {
  __arenaNextJsPostgresqlPool?: Pool;
};

let pool: Pool | undefined;
let dbInstance: ReturnType<typeof drizzle> | undefined;

function getPool() {
  if (!databaseUrl) {
    throw new Error("DATABASE_URL is required");
  }

  if (!pool) {
    pool =
      globalForDb.__arenaNextJsPostgresqlPool ??
      new Pool({
        connectionString: databaseUrl,
      });

    if (process.env.NODE_ENV !== "production") {
      globalForDb.__arenaNextJsPostgresqlPool = pool;
    }
  }

  return pool;
}

function getDb() {
  if (!dbInstance) {
    dbInstance = drizzle(getPool());
  }

  return dbInstance;
}

export const db = new Proxy(
  {},
  {
    get(_target, prop, receiver) {
      const realDb = getDb();
      const value = Reflect.get(realDb, prop, receiver);
      return typeof value === "function" ? value.bind(realDb) : value;
    },
    set(_target, prop, value, receiver) {
      const realDb = getDb();
      return Reflect.set(realDb, prop, value, receiver);
    },
    has(_target, prop) {
      const realDb = getDb();
      return Reflect.has(realDb, prop);
    },
    ownKeys(_target) {
      const realDb = getDb();
      return Reflect.ownKeys(realDb);
    },
    getOwnPropertyDescriptor(_target, prop) {
      const realDb = getDb();
      return Reflect.getOwnPropertyDescriptor(realDb, prop);
    },
  },
) as ReturnType<typeof drizzle>;
