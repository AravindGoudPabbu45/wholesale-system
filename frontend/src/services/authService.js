import axios from "axios";

const API = "http://localhost:5000/api";

// Create axios instance
const api = axios.create({
    baseURL: API,
});

// 🔐 Automatically attach token
api.interceptors.request.use((config) => {
    const token = localStorage.getItem("token");

    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
});

// =====================
// AUTH FUNCTIONS
// =====================

export const loginUser = async (data) => {
    const response = await api.post("/auth/login", data);

    localStorage.setItem("token", response.data.token);
    localStorage.setItem("role", response.data.role);

    return response.data;
};

export const registerUser = async (data) => {
    const response = await api.post("/auth/register", data);
    return response.data;
};

export default api;
