import axios from "axios";
import { useAuthStore } from "@/stores/auth-store";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "";

export const apiClient = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        "Content-Type": "application/json",
    },
});

// Request Interceptor to add Access Token and Active Tenant
apiClient.interceptors.request.use(
    (config) => {
        const state = useAuthStore.getState();
        const token = state.accessToken;
        const tenantId = state.activeTenantId;

        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }

        if (tenantId) {
            // Backend expects X-Tenant-Id for tenant-scoped endpoints where applicable
            config.headers["X-Tenant-Id"] = tenantId;
        }

        return config;
    },
    (error) => Promise.reject(error)
);

// Response Interceptor for Token Refresh
apiClient.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        // If error is 401 and we haven't already retried
        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;

            const state = useAuthStore.getState();
            const refreshToken = state.refreshToken;

            if (refreshToken) {
                try {
                    // Note: using raw axios to avoid interceptor infinite loops
                    const { data } = await axios.post(`${API_BASE_URL}/auth/refresh`, {
                        refresh_token: refreshToken,
                    });

                    // Update store with new tokens
                    state.setTokens(data.access_token, data.refresh_token);

                    // Retry the original request
                    originalRequest.headers.Authorization = `Bearer ${data.access_token}`;
                    return apiClient(originalRequest);
                } catch (refreshError) {
                    // If refresh fails, log out the user
                    state.logout();

                    // Optionally redirect to login outside of react context:
                    if (typeof window !== "undefined") {
                        window.location.href = "/login";
                    }
                    return Promise.reject(refreshError);
                }
            } else {
                // No refresh token available, logout
                state.logout();
                if (typeof window !== "undefined") {
                    window.location.href = "/login";
                }
            }
        }

        return Promise.reject(error);
    }
);
