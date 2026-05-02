import axios from "axios";

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:4000/api",
});

API.interceptors.request.use((req) => {
  const token = localStorage.getItem("token");
  if (token) {
    req.headers.Authorization = `Bearer ${token}`;
  }
  return req;
});

export const apiLogin = (data) => API.post("/auth/login", data);
export const apiSignup = (data) => API.post("/auth/signup", data);

export const getProjects = () => API.get("/projects");
export const createProject = (data) => API.post("/projects", data);
export const updateProject = (id, data) => API.patch(`/projects/${id}`, data);
export const deleteProject = (id) => API.delete(`/projects/${id}`);

export const getTasks = (params) => API.get("/tasks", { params });
export const createTask = (data) => API.post("/tasks", data);
export const updateTask = (id, data) => API.patch(`/tasks/${id}`, data);
export const deleteTask = (id) => API.delete(`/tasks/${id}`);

export const getUsers = () => API.get("/users");

export default API;
