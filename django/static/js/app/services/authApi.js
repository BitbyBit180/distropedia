import { DP_ENV } from "dp/core/config.js";
const API_BASE = DP_ENV.VITE_API_URL || "/api";
const TOKEN_KEY = "dp_token";
const USER_KEY = "dp_user";
function getToken() {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}
function getUser() {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}
function setAuth(token, user) {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    if (user) localStorage.setItem(USER_KEY, JSON.stringify(user));
  } catch {
  }
}
function clearAuth() {
  try {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  } catch {
  }
}
async function request(path, { method = "GET", body, auth = false } = {}) {
  const headers = {};
  if (body !== void 0) headers["Content-Type"] = "application/json";
  const token = getToken();
  if (auth && token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: body !== void 0 ? JSON.stringify(body) : void 0
  });
  let json = null;
  try {
    json = await res.json();
  } catch {
  }
  if (!res.ok || !json || json.success === false) {
    const err = new Error(json?.message || `Request failed (${res.status})`);
    err.status = res.status;
    throw err;
  }
  return json;
}
const GOOGLE_CLIENT_ID = DP_ENV.VITE_GOOGLE_CLIENT_ID || "";
async function register(name, email, password) {
  const json = await request("/auth/register", {
    method: "POST",
    body: { name, email, password }
  });
  return { token: json.token, user: json.data };
}
async function login(email, password) {
  const json = await request("/auth/login", {
    method: "POST",
    body: { email, password }
  });
  return { token: json.token, user: json.data };
}
async function googleLogin(credential) {
  const json = await request("/auth/google", {
    method: "POST",
    body: { credential }
  });
  return { token: json.token, user: json.data };
}
async function me() {
  try {
    const json = await request("/auth/me", { auth: true });
    return json.data || null;
  } catch {
    return null;
  }
}
async function forgotPassword(email) {
  const json = await request("/auth/forgot-password", {
    method: "POST",
    body: { email }
  });
  return json;
}
async function resetPassword(token, password) {
  const json = await request("/auth/reset-password", {
    method: "POST",
    body: { token, password }
  });
  return json;
}
async function verifyResetToken(token) {
  const json = await request("/auth/verify-reset-token", {
    method: "POST",
    body: { token }
  });
  return json;
}
export {
  GOOGLE_CLIENT_ID,
  clearAuth,
  forgotPassword,
  getToken,
  getUser,
  googleLogin,
  login,
  me,
  register,
  resetPassword,
  setAuth,
  verifyResetToken
};
