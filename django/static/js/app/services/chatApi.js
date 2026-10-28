import { DP_ENV } from "dp/core/config.js";
import { getToken } from "./authApi.js";
import { cached, peek, peekStale, invalidate } from "../utils/apiCache.js";
const API_BASE = DP_ENV.VITE_API_URL || "/api";
const CHAT_TTL = 30 * 1e3;
async function request(path, { method = "GET", body } = {}) {
  const headers = {};
  if (body !== void 0) headers["Content-Type"] = "application/json";
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;
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
async function listChats() {
  return cached("chat:list", CHAT_TTL, async () => {
    const json = await request("/chat");
    return json.data || [];
  });
}
const peekChatList = () => peek("chat:list");
const peekChat = (id) => peek(`chat:${encodeURIComponent(id)}`);
const peekStaleChatList = () => peekStale("chat:list");
const peekStaleChat = (id) => peekStale(`chat:${encodeURIComponent(id)}`);
async function createChat() {
  const json = await request("/chat", { method: "POST" });
  invalidate("chat:list");
  return json.data;
}
async function getChat(id) {
  const key = `chat:${encodeURIComponent(id)}`;
  return cached(key, CHAT_TTL, async () => {
    const json = await request(`/chat/${encodeURIComponent(id)}`);
    return json.data;
  });
}
async function renameChat(id, title) {
  const json = await request(`/chat/${encodeURIComponent(id)}/rename`, {
    method: "PUT",
    body: { title }
  });
  invalidate("chat:list");
  invalidate(`chat:${encodeURIComponent(id)}`);
  return json.data;
}
async function deleteChat(id) {
  const json = await request(`/chat/${encodeURIComponent(id)}`, {
    method: "DELETE"
  });
  invalidate("chat:list");
  invalidate(`chat:${encodeURIComponent(id)}`);
  return json;
}
async function sendMessage(chatId, content) {
  const json = await request(`/chat/${encodeURIComponent(chatId)}/messages`, {
    method: "POST",
    body: { content }
  });
  invalidate("chat:list");
  invalidate(`chat:${encodeURIComponent(chatId)}`);
  return json.data;
}
async function sendMessageStream(chatId, content, { onToken, onStage, signal } = {}) {
  const token = getToken();
  const headers = { "Content-Type": "application/json", Accept: "text/event-stream" };
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(
    `${API_BASE}/chat/${encodeURIComponent(chatId)}/messages/stream`,
    { method: "POST", headers, body: JSON.stringify({ content }), signal }
  );
  if (!res.ok || !res.body) {
    let message = `Request failed (${res.status})`;
    try {
      const json = await res.json();
      message = json?.message || message;
    } catch {
    }
    const err = new Error(message);
    err.status = res.status;
    throw err;
  }
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let doneData = null;
  const dispatch = (event, data) => {
    if (event === "token") onToken?.(data?.text || "");
    else if (event === "stage") onStage?.(data?.stage);
    else if (event === "done") doneData = data;
    else if (event === "error") throw new Error(data?.message || "Stream failed");
  };
  const feed = (chunk) => {
    buffer += chunk;
    const frames = buffer.split("\n\n");
    buffer = frames.pop();
    for (const frame of frames) {
      let event = "message";
      const dataLines = [];
      for (const line of frame.split("\n")) {
        if (line.startsWith("event:")) event = line.slice(6).trim();
        else if (line.startsWith("data:")) dataLines.push(line.slice(5).trim());
      }
      if (dataLines.length === 0) continue;
      try {
        dispatch(event, JSON.parse(dataLines.join("\n")));
      } catch {
      }
    }
  };
  try {
    for (; ; ) {
      const { done, value } = await reader.read();
      if (done) break;
      feed(decoder.decode(value, { stream: true }));
    }
    feed(decoder.decode());
  } finally {
    try {
      reader.releaseLock();
    } catch {
    }
  }
  if (!doneData) throw new Error("Stream ended unexpectedly. Please try again.");
  return doneData;
}
export {
  createChat,
  deleteChat,
  getChat,
  listChats,
  peekChat,
  peekChatList,
  peekStaleChat,
  peekStaleChatList,
  renameChat,
  sendMessage,
  sendMessageStream
};
