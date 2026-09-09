import { query } from "../config/db.js";
import { fail } from "../middleware/error.middleware.js";

export async function list(userId, parentId = null) {
	const result = await query(
		"SELECT * FROM folders WHERE user_id = $1 " +
		"AND parent_folder_id IS NOT DISTINCT FROM $2 ORDER BY name",
		[userId, parentId]
	);
	return result.rows;
}

export async function get(userId, id) {
	const result = await query(
		"SELECT * FROM folders WHERE id = $1 AND user_id = $2",
		[id, userId]
	);
	if (!result.rowCount) {
		throw fail("Folder not found", 404, "NOT_FOUND");
	}
	return result.rows[0];
}

export async function create(userId, name, parentId = null) {
	if (!name?.trim()) {
		throw fail("Folder name is required");
	}
	if (parentId) {
		await get(userId, parentId);
	}

	const result = await query(
		"INSERT INTO folders (user_id, name, parent_folder_id) " +
		"VALUES ($1, $2, $3) RETURNING *",
		[userId, name.trim(), parentId]
	);
	return result.rows[0];
}

export async function update(userId, id, name, parentId) {
	await get(userId, id);
	if (parentId) {
		await get(userId, parentId);
	}

	const result = await query(
		"UPDATE folders SET name = COALESCE($1, name), " +
		"parent_folder_id = COALESCE($2, parent_folder_id) " +
		"WHERE id = $3 AND user_id = $4 RETURNING *",
		[name?.trim() || null, parentId || null, id, userId]
	);
	return result.rows[0];
}

export async function remove(userId, id) {
	await get(userId, id);
	await query("DELETE FROM folders WHERE id = $1 AND user_id = $2", [id, userId]);
}
