import * as service from "../services/share.service.js";

export async function create(request, response, next) { try { response.status(201).json(await service.create(request.user.id, request.params.id, request.body.expiresAt)); } catch (error) { next(error); } }
export async function get(request, response, next) { try { response.json(await service.get(request.params.token)); } catch (error) { next(error); } }
export async function remove(request, response, next) { try { await service.remove(request.user.id, request.params.token); response.status(204).end(); } catch (error) { next(error); } }console.log("Hello World");
