import axios from "axios";

// Environment-specific API URL (can be enhanced with import.meta.env for Vite if needed)
// For now, defaulting to localhost:8000 as per backend config
const API_URL = "http://localhost:8000/api";

const api = axios.create({
    baseURL: API_URL,
    headers: {
        "Content-Type": "application/json",
    },
});

export const getEmails = async () => {
    const response = await api.get("/emails");
    return response.data;
};

export const addEmail = async (email: string) => {
    const response = await api.post("/emails", { email });
    return response.data;
};

export default api;
