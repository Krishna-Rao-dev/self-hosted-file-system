import * as service from "../services/file.service.js";

export async function uploadUrl(request, response, next) {
	try {
		const upload = await service.createUpload(request.user.id, request.body);
		response.status(201).json(upload);
	} catch (error) {
		next(error);
	}
}

export async function complete(request, response, next) {
	try {
		const file = await service.complete(request.user.id, request.body.fileId);
		response.json({ file });
	} catch (error) {
		next(error);
	}
}

export async function list(request, response, next) {
	try {
		const files = await service.list(
			request.user.id,
			request.query.all === "true" ? null : request.query.folderId,
			request.query.search,
			Number(request.query.page || 1),
			request.query.all === "true"
		);
		response.json({ files });
	} catch (error) {
		next(error);
	}
}

export async function get(request, response, next) {
	try {
		const file = await service.get(request.user.id, request.params.id);
		response.json({ file });
	} catch (error) {
		next(error);
	}
}

export async function download(request, response, next) {
	try {
		response.json(await service.download(request.user.id, request.params.id));
	} catch (error) {
		next(error);
	}
}

export async function update(request, response, next) {
	try {
		const file = await service.update(
			request.user.id,
			request.params.id,
			request.body
		);
		response.json({ file });
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
