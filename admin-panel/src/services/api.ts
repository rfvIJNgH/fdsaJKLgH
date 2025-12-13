import axios from "axios";

// Define base URL for different environments
const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8080";

export const api = axios.create({
    baseURL: BASE_URL,
    headers: {
        "Content-Type": "application/json",
    },
});

// Add a request interceptor
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem("token");
        if (token) {
            config.headers["Authorization"] = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Add a response interceptor
api.interceptors.response.use(
    (response) => response,
    (error) => {
        // Handle 401 Unauthorized errors globally
        if (error.response && error.response.status === 401) {
            localStorage.removeItem("token");
            window.location.href = "/login";
        }
        return Promise.reject(error);
    }
);

//User API services
export const userService = {
    getAllUsers: async () => {
        return api.get("/api/users");
    }
}

//Content Service
export const contentService = {
    //get All Contents with Users
    getAllContentsWithUsers: async () => {
        return api.get("/api/content");
    },
    //Delete Selected Contents
    deleteSelectedContents: async (contentIds: number[]) => {
        return api.post("/api/content/delete", { data: contentIds });
    }
}