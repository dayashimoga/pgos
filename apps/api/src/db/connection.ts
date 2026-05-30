// ============================================================
// @pgos/api — Database Connection
// Connect Drizzle ORM to PostgreSQL
// ============================================================

import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema.js';

// Setup connection string from env
const connectionString = process.env.DATABASE_URL || 'postgres://pgos:pgos_dev@localhost:5432/pgos';

logConnection();

function logConnection() {
  const urlObj = new URL(connectionString.replace('postgres-js', 'http')); // temporary hack to parse safely
  console.log(`📡 Connecting to Database: postgres://${urlObj.username}:***@${urlObj.host}${urlObj.pathname}`);
}

// Disable prefetch to support PGBouncer / transaction pooling safely
export const client = postgres(connectionString, { max: 10 });
export const db = drizzle(client, { schema });
export type Database = typeof db;
