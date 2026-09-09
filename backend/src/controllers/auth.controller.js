import * as service from "../services/auth.service.js";

export async function register(request, response, next) {
	try {
		const user = await service.register(request.body.email, request.body.password);
		response.status(201).json({ user });
	} catch (error) {
		next(error);
	}
}

export async function login(request, response, next) {
	try {
		response.json(await service.login(request.body.email, request.body.password));
	} catch (error) {
		next(error);
	}
}

export async function me(request, response, next) {
	try {
		const user = await service.me(request.user.id);
		response.json({ user });
	} catch (error) {
		next(error);
	}
}
