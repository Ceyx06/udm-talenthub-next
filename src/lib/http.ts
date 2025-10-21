import axios from "axios";

export const http = axios.create({
  baseURL: "", // same-origin (Next.js API routes)
  headers: { "Content-Type": "application/json" },
});

// Optional: basic interceptor for errors
http.interceptors.response.use(
  (res) => res,
  (err) => {
    console.error("HTTP error:", err?.response?.data || err.message);
    return Promise.reject(err);
  }
);