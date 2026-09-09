import jwt from "jsonwebtoken";

export function auth(request, response, next) {
	const header = request.headers.authorization || "";
	const token = header.startsWith("Bearer ") ? header.slice(7) : "";
	if (!token) {
		return response.status(401).json({
			error: {
				message: "Authentication required",
				code: "UNAUTHENTICATED"
			}
		});
	}

	try {
		request.user = jwt.verify(token, process.env.JWT_SECRET);
		return next();
	} catch {
		return response.status(401).json({
			error: {
				message: "Invalid or expired token",
				code: "UNAUTHENTICATED"
			}
		});
	}
}
