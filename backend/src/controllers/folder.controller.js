import * as service from "../services/folder.service.js";

export async function list(request, response, next) { try { response.json({ folders: await service.list(request.user.id, request.query.parentFolderId || null) }); } catch (error) { next(error); } }
export async function get(request, response, next) { try { response.json({ folder: await service.get(request.user.id, request.params.id) }); } catch (error) { next(error); } }
export async function create(request, response, next) { try { response.status(201).json({ folder: await service.create(request.user.id, request.body.name, request.body.parentFolderId) }); } catch (error) { next(error); } }
export async function update(request, response, next) { try { response.json({ folder: await service.update(request.user.id, request.params.id, request.body.name, request.body.parentFolderId) }); } catch (error) { next(error); } }
export async function remove(request, response, next) { try { await service.remove(request.user.id, request.params.id); response.status(204).end(); } catch (error) { next(error); } }
console.log("Hello World");
