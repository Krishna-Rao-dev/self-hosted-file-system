import { query } from "../config/db.js";
import { fail } from "../middleware/error.middleware.js";
import { deleteObject } from "./s3.service.js";

export async function list(userId, parentId = null, search) {
	const values = [userId, parentId];
	let searchClause = "";
	if (search?.trim()) {
		values.push(`%${search.trim()}%`);
		searchClause = ` AND name ILIKE $${values.length}`;
	}

	const result = await query(
		"SELECT * FROM folders WHERE user_id = $1 " +
		`AND parent_folder_id IS NOT DISTINCT FROM $2${searchClause} ORDER BY name`,
		values
	);
	return result.rows;
}

export async function listAll(userId, search) {
	const values = [userId];
	let searchClause = "";
	if (search?.trim()) {
		values.push(`%${search.trim()}%`);
		searchClause = ` AND name ILIKE $${values.length}`;
	}

	const result = await query(
		`SELECT * FROM folders WHERE user_id = $1${searchClause} ORDER BY name`,
		values
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
	const files = await query(
		"WITH RECURSIVE folder_tree AS (" +
		"SELECT id FROM folders WHERE id = $1 AND user_id = $2 " +
		"UNION ALL " +
		"SELECT folders.id FROM folders " +
		"JOIN folder_tree ON folders.parent_folder_id = folder_tree.id" +
		") SELECT files.s3_key, files.size, files.completed FROM files " +
		"JOIN folder_tree ON files.folder_id = folder_tree.id " +
		"WHERE files.user_id = $2",
		[id, userId]
	);

	await Promise.all(files.rows.map((file) => deleteObject(file.s3_key)));
	const completedSize = files.rows.reduce(
		(total, file) => total + (file.completed ? Number(file.size) : 0),
		0
	);

	await query("BEGIN");
	try {
		await query("DELETE FROM folders WHERE id = $1 AND user_id = $2", [id, userId]);
		await query(
			"UPDATE users SET storage_used = GREATEST(storage_used - $1, 0) WHERE id = $2",
			[completedSize, userId]
		);
		await query("COMMIT");
	} catch (error) {
		await query("ROLLBACK");
		throw error;
	}
}
