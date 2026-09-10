const base = import.meta.env.VITE_API_URL || "http://localhost:4000/api";

async function request(path, options = {}) {
  const response = await fetch(`${base}${path}`, {
    ...options,
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
  });
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.error?.message || "Request failed");
  }
  return response.status === 204 ? null : response.json();
}

export function authRequest(path, token, options = {}) { return request(path, { ...options, headers: { Authorization: `Bearer ${token}`, ...(options.headers || {}) } }); }
export const api = { request, authRequest };