import jwt from "jsonwebtoken";
import { query } from "../config/db.js";
import { comparePassword, hashPassword } from "../utils/hash.js";
import { fail } from "../middleware/error.middleware.js";

function safeUser(user) {
	return { id: user.id, email: user.email, storageUsed: Number(user.storage_used), storageLimit: Number(user.storage_limit), createdAt: user.created_at };
}

function token(user) {
	return jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || "7d" });
}

export async function register(email, password) {
	if (!email || !/^\S+@\S+\.\S+$/.test(email) || !password || password.length < 8) throw fail("Valid email and password of at least 8 characters are required");
	const result = await query("SELECT id FROM users WHERE email = $1", [email.toLowerCase()]);
	if (result.rowCount) throw fail("Email is already registered", 409, "EMAIL_EXISTS");
	const created = await query("INSERT INTO users (email, password_hash, storage_limit) VALUES ($1, $2, $3) RETURNING *", [email.toLowerCase(), await hashPassword(password), Number(process.env.DEFAULT_STORAGE_LIMIT || 10737418240)]);
	return safeUser(created.rows[0]);
}

export async function login(email, password) {
	const result = await query("SELECT * FROM users WHERE email = $1", [email?.toLowerCase()]);
	if (!result.rowCount || !(await comparePassword(password || "", result.rows[0].password_hash))) throw fail("Invalid email or password", 401, "INVALID_CREDENTIALS");
	return { token: token(result.rows[0]), user: safeUser(result.rows[0]) };
}

export async function me(id) {
	const result = await query("SELECT * FROM users WHERE id = $1", [id]);
	if (!result.rowCount) throw fail("User not found", 404, "NOT_FOUND");
	return safeUser(result.rows[0]);
}
