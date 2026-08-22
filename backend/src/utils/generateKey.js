import crypto from "node:crypto";

export function generateToken() {
	return crypto.randomBytes(32).toString("hex");
}

export function safeName(name) {
	return name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 180) || "file";
}
