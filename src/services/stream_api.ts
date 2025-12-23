import axios from "axios";

// Define base URL for different environments
const BASE_URL = "https://arouzy-v3-stream-server.onrender.com";

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
        console.log(token);
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


// Stream API services
export const streamService = {
    createStream: async (data: {
        roomId: string;
        streamerName: string;
        title: string;
        streamType: "public" | "premium";
        price: number;
    }) => {
        return api.post("/api/streams", data);
    },

    getStreamByRoomId: async (roomId: string) => {
        return api.get(`/api/streams/${roomId}`);
    },

    endStream: async (roomId: string) => {
        return api.post(`/api/streams/${roomId}/end`);
    },

    getActiveStreams: async () => {
        return api.get("/api/streams");
    },
};