import axios from "axios";
// import { toast } from "react-toastify";
export const baseURL = import.meta.env.VITE_PUBLIC_BACKEND_DEV_BASE_URL;

export const axiosInstance = axios.create({
  baseURL,
  withCredentials: true,
});

// Reads a JWT out of localStorage whether it was stored as a plain string,
// a JSON-stringified string, or an object like { token: "..." }.
export const getStoredToken = (key: string): string | null => {
  const raw = localStorage.getItem(key);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    if (typeof parsed === "string") return parsed;
    return parsed?.token ?? null;
  } catch {
    return raw;
  }
};

axiosInstance.interceptors.request.use((config: any) => {
  const token = getStoredToken("accesstoken");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ---- Automatic access-token refresh on 401 ----
let isRefreshing = false;
let pendingQueue: Array<{ resolve: (t: string | null) => void; reject: (e: any) => void }> = [];

const flushQueue = (error: any, token: string | null) => {
  pendingQueue.forEach((p) => (error ? p.reject(error) : p.resolve(token)));
  pendingQueue = [];
};

const forceLogout = () => {
  localStorage.removeItem("accesstoken");
  localStorage.removeItem("refreshtoken");
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("hcts-auth-changed"));
    if (window.location.pathname !== "/") window.location.href = "/";
  }
};

axiosInstance.interceptors.response.use(
  (response: any) => response,
  async (error: any) => {
    const original = error?.config;
    const status = error?.response?.status;
    const message = error?.response?.data?.message;
    const url: string = original?.url || "";
    const isAuthEndpoint =
      url.includes("/refresh-token") || url.includes("/login") || url.includes("/logout");

    // On an expired/invalid access token, refresh once and retry the request.
    if (status === 401 && original && !original._retry && !isAuthEndpoint) {
      if (isRefreshing) {
        // A refresh is already in flight — queue this request until it resolves.
        return new Promise<string | null>((resolve, reject) => {
          pendingQueue.push({ resolve, reject });
        }).then((token) => {
          if (token) original.headers.Authorization = `Bearer ${token}`;
          return axiosInstance(original);
        });
      }

      original._retry = true;
      isRefreshing = true;
      try {
        // Lazy import avoids a circular dependency with apis/auth.
        const { refreshToken } = await import("@/apis/auth");
        await refreshToken();
        const newToken = getStoredToken("accesstoken");
        flushQueue(null, newToken);
        if (newToken) original.headers.Authorization = `Bearer ${newToken}`;
        return axiosInstance(original);
      } catch (refreshError) {
        flushQueue(refreshError, null);
        forceLogout();
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    // Surface deactivation and other forbidden errors to the user
    if (status === 403 && message) {
      console.log("errorrrrr", message);
    }

    return Promise.reject(error);
  },
);
