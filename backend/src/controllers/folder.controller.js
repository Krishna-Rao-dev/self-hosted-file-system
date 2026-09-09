import * as service from "../services/folder.service.js";

export async function list(request, response, next) {
	try {
		const folders = await service.list(
			request.user.id,
			request.query.parentFolderId || null
		);
		response.json({ folders });
	} catch (error) {
		next(error);
	}
}

export async function get(request, response, next) {
	try {
		const folder = await service.get(request.user.id, request.params.id);
		response.json({ folder });
	} catch (error) {
		next(error);
	}
}

export async function create(request, response, next) {
	try {
		const folder = await service.create(
			request.user.id,
			request.body.name,
			request.body.parentFolderId
		);
		response.status(201).json({ folder });
	} catch (error) {
		next(error);
	}
}

export async function update(request, response, next) {
	try {
		const folder = await service.update(
			request.user.id,
			request.params.id,
			request.body.name,
			request.body.parentFolderId
		);
		response.json({ folder });
	} catch (error) {
		next(error);
	}
}

export async function remove(request, response, next) {
	try {
		await service.remove(request.user.id, request.params.id);
		response.status(204).end();
	} catch (error) {
		next(error);
	}
}

