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

// Report Service
export const reportService = {
    // Get all reports with optional filters
    getAllReports: async (params?: { status?: string; page?: number; limit?: number }) => {
        return api.get("/api/reports", { params });
    },
    // Get a single report by ID
    getReportById: async (reportId: number) => {
        return api.get(`/api/reports/${reportId}`);
    },
    // Update report status
    updateReportStatus: async (reportId: number, status: string) => {
        return api.patch(`/api/reports/${reportId}/status`, { status });
    },
    // Delete a report
    deleteReport: async (reportId: number) => {
        return api.delete(`/api/reports/${reportId}`);
    }
}

// Contact Service
export const contactService = {
    // Get all contact messages with optional filters
    getAllMessages: async (params?: { status?: string; page?: number; limit?: number }) => {
        return api.get("/api/contact", { params });
    },
    // Get a single message by ID
    getMessageById: async (messageId: number) => {
        return api.get(`/api/contact/${messageId}`);
    },
    // Update message status
    updateMessageStatus: async (messageId: number, status: string) => {
        return api.patch(`/api/contact/${messageId}/status`, { status });
    },
    // Delete a message
    deleteMessage: async (messageId: number) => {
        return api.delete(`/api/contact/${messageId}`);
    }
}