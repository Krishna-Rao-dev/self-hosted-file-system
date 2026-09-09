export function errorHandler(error, request, response, next) {
	const status = error.status || 500;
	const code = error.code || "INTERNAL_ERROR";
	const message = status === 500 ? "Internal server error" : error.message;
	response.status(status).json({ error: { message, code } });
}

export function fail(message, status = 400, code = "BAD_REQUEST") {
	const error = new Error(message);
	error.status = status;
	error.code = code;
	return error;
}
