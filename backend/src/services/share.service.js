import { query } from "../config/db.js";
import { fail } from "../middleware/error.middleware.js";
import { generateDownloadUrl } from "./s3.service.js";
import { generateToken } from "../utils/generateKey.js";
import { get as getFile } from "./file.service.js";

export async function create(userId, fileId, expiresAt) { const file = await getFile(userId, fileId); const result = await query("INSERT INTO share_links (file_id, token, expires_at) VALUES ($1, $2, $3) RETURNING token, expires_at", [file.id, generateToken(), expiresAt || null]); return result.rows[0]; }
export async function get(token) { const result = await query("SELECT f.*, s.expires_at FROM share_links s JOIN files f ON f.id = s.file_id WHERE s.token = $1", [token]); if (!result.rowCount || (result.rows[0].expires_at && new Date(result.rows[0].expires_at) < new Date())) throw fail("Share link not found or expired", 404, "NOT_FOUND"); const file = result.rows[0]; return { file: { id: file.id, originalName: file.original_name, size: file.size, mimeType: file.mime_type }, downloadUrl: await generateDownloadUrl(file.s3_key, file.original_name) }; }
export async function remove(userId, token) { const result = await query("DELETE FROM share_links s USING files f WHERE s.file_id = f.id AND s.token = $1 AND f.user_id = $2", [token, userId]); if (!result.rowCount) throw fail("Share link not found", 404, "NOT_FOUND"); }