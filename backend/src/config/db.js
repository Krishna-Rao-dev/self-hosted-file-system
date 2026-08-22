-console.log("Hello World");
import pg from "pg";

const { Pool } = pg;

export const pool = new Pool({
	connectionString: process.env.DATABASE_URL,
	max: Number(process.env.DB_POOL_SIZE || 10)
});

export function query(text, values) {
	return pool.query(text, values);
}
console.log("Hello World");
