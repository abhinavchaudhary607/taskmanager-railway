const fs = require('fs');

let content = fs.readFileSync('d:/taskmanager railway/client/src/App.jsx', 'utf8');

// 1. Add API import
content = content.replace('import { useState, useEffect, createContext, useContext } from "react";', 
'import { useState, useEffect, createContext, useContext } from "react";\nimport * as api from "./api";');

// 2. Replace LoginPage submit
const loginSubmitOld = `  const submit = () => {
    setError("");
    if (mode === "login") {
      const u = data.users.find(u => u.email === email && u.password === password);
      if (!u) { setError("Invalid email or password"); return; }
      onLogin(u);
    } else {
      if (!name.trim() || !email.trim() || !password.trim()) { setError("All fields required"); return; }
      if (data.users.find(u => u.email === email)) { setError("Email already in use"); return; }
      const newUser = {
        id: "u" + uid(), name, email, password, role: "member",
        avatar: avatarColors[Math.floor(Math.random() * avatarColors.length)],
        initials: name.split(" ").map(w => w[0]).join("").slice(0,2).toUpperCase()
      };
      onLogin(newUser, newUser);
    }
  };`;

const loginSubmitNew = `  const submit = async () => {
    setError("");
    try {
      if (mode === "login") {
        const res = await api.apiLogin({ email, password });
        localStorage.setItem("token", res.data.token);
        onLogin(res.data.user);
      } else {
        if (!name.trim() || !email.trim() || !password.trim()) { setError("All fields required"); return; }
        const res = await api.apiSignup({ name, email, password });
        localStorage.setItem("token", res.data.token);
        onLogin(res.data.user, res.data.user);
      }
    } catch (err) {
      setError(err.response?.data?.error || "An error occurred");
    }
  };`;
content = content.replace(loginSubmitOld, loginSubmitNew);

// 3. Replace App Main Component state and logic
const appStartOld = `export default function App() {
  const initial = seed();
  const [data, setData] = useState(initial);
  const [currentUser, setCurrentUser] = useState(null);
  const [page, setPage] = useState("dashboard");
  const [modal, setModal] = useState(null); // {type, payload}
  const [selectedProject, setSelectedProject] = useState(null);

  const handleLogin = (user, newUser) => {
    if (newUser) {
      setData(d => ({ ...d, users: [...d.users, newUser] }));
    }
    setCurrentUser(user);
  };`;

const appStartNew = `export default function App() {
  const [data, setData] = useState({ users: [], projects: [], tasks: [] });
  const [currentUser, setCurrentUser] = useState(null);
  const [page, setPage] = useState("dashboard");
  const [modal, setModal] = useState(null);
  const [selectedProject, setSelectedProject] = useState(null);

  const fetchData = async () => {
    try {
      const [pRes, tRes, uRes] = await Promise.all([
        api.getProjects(),
        api.getTasks(),
        api.getUsers().catch(() => ({ data: [] })) // users might be admin only
      ]);
      setData({ projects: pRes.data, tasks: tRes.data, users: uRes.data || [] });
    } catch (e) {
      console.error(e);
    }
  };

  const handleLogin = (user) => {
    setCurrentUser(user);
    fetchData();
  };
  
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      // In a real app, verify token or get /me. For demo, just log out if no user object.
    }
  }, []);`;
content = content.replace(appStartOld, appStartNew);

// 4. Replace save handlers and delete handler in handleAction
const deleteOld = `    else if (type === "delete-task") {
      if (window.confirm("Delete this task?")) {
        setData(d => ({ ...d, tasks: d.tasks.filter(t => t.id !== payload.id) }));
      }
    }`;
const deleteNew = `    else if (type === "delete-task") {
      if (window.confirm("Delete this task?")) {
        api.deleteTask(payload.id).then(() => fetchData());
      }
    }`;
content = content.replace(deleteOld, deleteNew);

const saveProjectOld = `  const saveProject = (formData) => {
    const isEdit = modal.payload?.id;
    if (isEdit) {
      setData(d => ({ ...d, projects: d.projects.map(p => p.id === modal.payload.id ? { ...p, ...formData } : p) }));
      if (selectedProject?.id === modal.payload.id) setSelectedProject(p => ({ ...p, ...formData }));
    } else {
      const np = { id: "p" + uid(), ownerId: currentUser.id, createdAt: today(), ...formData };
      setData(d => ({ ...d, projects: [...d.projects, np] }));
    }
    setModal(null);
  };`;
const saveProjectNew = `  const saveProject = async (formData) => {
    const isEdit = modal.payload?.id;
    try {
      if (isEdit) {
        await api.updateProject(modal.payload.id, formData);
        if (selectedProject?.id === modal.payload.id) setSelectedProject(p => ({ ...p, ...formData }));
      } else {
        await api.createProject(formData);
      }
      fetchData();
      setModal(null);
    } catch (e) { alert("Error saving project"); }
  };`;
content = content.replace(saveProjectOld, saveProjectNew);

const saveTaskOld = `  const saveTask = (formData) => {
    const isEdit = modal.payload?.id;
    if (isEdit) {
      setData(d => ({ ...d, tasks: d.tasks.map(t => t.id === modal.payload.id ? { ...t, ...formData } : t) }));
    } else {
      const nt = { id: "t" + uid(), createdAt: today(), ...formData };
      setData(d => ({ ...d, tasks: [...d.tasks, nt] }));
    }
    setModal(null);
  };`;
const saveTaskNew = `  const saveTask = async (formData) => {
    const isEdit = modal.payload?.id;
    try {
      if (isEdit) {
        await api.updateTask(modal.payload.id, formData);
      } else {
        await api.createTask(formData);
      }
      fetchData();
      setModal(null);
    } catch (e) { alert("Error saving task"); }
  };`;
content = content.replace(saveTaskOld, saveTaskNew);

// Sign Out handling
const signOutOld = `onClick={() => setCurrentUser(null)}`;
const signOutNew = `onClick={() => { localStorage.removeItem("token"); setCurrentUser(null); }}`;
content = content.replace(signOutOld, signOutNew);

fs.writeFileSync('d:/taskmanager railway/client/src/App.jsx', content);
console.log("App.jsx refactored.");
