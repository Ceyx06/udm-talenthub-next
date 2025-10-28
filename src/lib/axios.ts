import axios from "axios";

/**
 
Same-origin API client, sends/receives cookies.
If you ever deploy API on another origin, set baseURL accordingly.*/
export const api = axios.create({
  baseURL: "/",           // relative to same-origin Next API
  withCredentials: true,  // include httpOnly session cookies
  headers: { "Content-Type": "application/json" },
});