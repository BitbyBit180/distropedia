import { DP_ENV } from "dp/core/config.js";
import { getToken } from "./authApi.js";
import { cached, peek, peekStale, invalidate } from "../utils/apiCache.js";
const API_BASE = DP_ENV.VITE_API_URL || "/api";
const FEED_TTL = 30 * 1e3;
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
const postsKey = ({ channel = "all", sort = "hot", search = "", page = 1, limit = 10 } = {}) => `community:posts:${channel}|${sort}|${search}|${page}|${limit}`;
async function listPosts({ channel = "all", sort = "hot", search = "", page = 1, limit = 10 } = {}) {
  const params = { channel, sort, search, page, limit };
  return cached(postsKey(params), FEED_TTL, async () => {
    const qs = new URLSearchParams({
      channel,
      sort,
      search,
      page: String(page),
      limit: String(limit)
    });
    const json = await request(`/community/posts?${qs.toString()}`);
    return json.data;
  });
}
const peekPosts = (params) => peek(postsKey(params));
const peekStalePosts = (params) => peekStale(postsKey(params));
const peekPost = (id) => peek(`community:post:${encodeURIComponent(id)}`);
const peekStalePost = (id) => peekStale(`community:post:${encodeURIComponent(id)}`);
const peekChannelStats = (channel = "all") => peek(`community:stats:${encodeURIComponent(channel)}`);
const peekStaleChannelStats = (channel = "all") => peekStale(`community:stats:${encodeURIComponent(channel)}`);
async function createPost({ channel, title, body, linkUrl }) {
  const json = await request("/community/posts", {
    method: "POST",
    body: { channel, title, body, linkUrl }
  });
  invalidate("community:posts");
  invalidate("community:stats");
  return json.data;
}
async function getPost(id) {
  const key = `community:post:${encodeURIComponent(id)}`;
  return cached(key, FEED_TTL, async () => {
    const json = await request(`/community/posts/${encodeURIComponent(id)}`);
    return json.data;
  });
}
async function updatePost(id, { title, body, linkUrl } = {}) {
  const json = await request(`/community/posts/${encodeURIComponent(id)}`, {
    method: "PUT",
    body: { title, body, linkUrl }
  });
  invalidate("community:post");
  invalidate("community:posts");
  return json.data;
}
async function deletePost(id) {
  const json = await request(`/community/posts/${encodeURIComponent(id)}`, {
    method: "DELETE"
  });
  invalidate("community:post");
  invalidate("community:posts");
  invalidate("community:stats");
  return json;
}
async function votePost(id, value) {
  const json = await request(`/community/posts/${encodeURIComponent(id)}/vote`, {
    method: "POST",
    body: { value }
  });
  invalidate("community:post");
  return json.data;
}
async function addComment(postId, { body, parentId } = {}) {
  const json = await request(
    `/community/posts/${encodeURIComponent(postId)}/comments`,
    { method: "POST", body: { body, parentId } }
  );
  invalidate("community:post");
  invalidate("community:posts");
  invalidate("community:stats");
  return json.data;
}
async function updateComment(id, body) {
  const json = await request(`/community/comments/${encodeURIComponent(id)}`, {
    method: "PUT",
    body: { body }
  });
  invalidate("community:post");
  return json.data;
}
async function deleteComment(id) {
  const json = await request(`/community/comments/${encodeURIComponent(id)}`, {
    method: "DELETE"
  });
  invalidate("community:post");
  invalidate("community:posts");
  invalidate("community:stats");
  return json;
}
async function voteComment(id, value) {
  const json = await request(`/community/comments/${encodeURIComponent(id)}/vote`, {
    method: "POST",
    body: { value }
  });
  invalidate("community:post");
  return json.data;
}
async function getChannelStats(channel = "all") {
  return cached(`community:stats:${encodeURIComponent(channel)}`, 60 * 1e3, async () => {
    const json = await request(
      `/community/stats?channel=${encodeURIComponent(channel)}`
    );
    return json.data;
  });
}
async function suggestChannel({ title, body }) {
  const json = await request("/community/suggest-channel", {
    method: "POST",
    body: { title, body }
  });
  return json.data;
}
async function createReport({ targetType, targetId, reason, detail }) {
  const json = await request("/community/reports", {
    method: "POST",
    body: { targetType, targetId, reason, detail }
  });
  return json.data;
}
async function getNotifications({ page = 1, limit = 10 } = {}) {
  const json = await request(
    `/community/notifications?page=${page}&limit=${limit}`
  );
  return json.data;
}
async function markNotificationRead(id) {
  const json = await request(`/community/notifications/${encodeURIComponent(id)}/read`, {
    method: "PATCH"
  });
  return json.data;
}
async function markAllNotificationsRead() {
  const json = await request("/community/notifications/read-all", {
    method: "PATCH"
  });
  return json;
}
export {
  addComment,
  createPost,
  createReport,
  deleteComment,
  deletePost,
  getChannelStats,
  getNotifications,
  getPost,
  listPosts,
  markAllNotificationsRead,
  markNotificationRead,
  peekChannelStats,
  peekPost,
  peekPosts,
  peekStaleChannelStats,
  peekStalePost,
  peekStalePosts,
  suggestChannel,
  updateComment,
  updatePost,
  voteComment,
  votePost
};
