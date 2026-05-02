import { useState, useEffect, createContext, useContext } from "react";
import * as api from "./api";

// ── Palette & globals ─────────────────────────────────────────────────────────
const G = {
  bg: "#0b0d11",
  surface: "#13161d",
  card: "#1a1e27",
  border: "#252a36",
  accent: "#4f8ef7",
  accentDim: "#1e3463",
  green: "#22c55e",
  amber: "#f59e0b",
  red: "#ef4444",
  purple: "#a78bfa",
  text: "#e8eaf0",
  muted: "#6b7280",
};

const css = `
  @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;600&family=Syne:wght@400;600;700;800&display=swap');
  *{box-sizing:border-box;margin:0;padding:0}
  body{background:${G.bg};color:${G.text};font-family:'Syne',sans-serif;min-height:100vh}
  ::-webkit-scrollbar{width:6px}::-webkit-scrollbar-track{background:${G.bg}}::-webkit-scrollbar-thumb{background:${G.border};border-radius:3px}
  input,select,textarea{font-family:'Syne',sans-serif}
  @keyframes fadeUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
  @keyframes pulse{0%,100%{opacity:1}50%{opacity:.5}}
  @keyframes spin{to{transform:rotate(360deg)}}
  .fade-up{animation:fadeUp .35s ease both}
  .card{background:${G.card};border:1px solid ${G.border};border-radius:14px;padding:24px}
  .btn{display:inline-flex;align-items:center;gap:8px;padding:9px 18px;border-radius:8px;font-family:'Syne',sans-serif;font-weight:600;font-size:14px;cursor:pointer;border:none;transition:all .18s}
  .btn-primary{background:${G.accent};color:#fff}.btn-primary:hover{background:#3b7ef6;transform:translateY(-1px)}
  .btn-ghost{background:transparent;color:${G.muted};border:1px solid ${G.border}}.btn-ghost:hover{color:${G.text};border-color:${G.accent}}
  .btn-danger{background:#2a1214;color:${G.red};border:1px solid #4a1a1c}.btn-danger:hover{background:#3a1416}
  .btn-sm{padding:5px 12px;font-size:12px}
  .input{width:100%;background:${G.surface};border:1px solid ${G.border};color:${G.text};padding:10px 14px;border-radius:8px;font-size:14px;outline:none;transition:border .18s}
  .input:focus{border-color:${G.accent}}
  .badge{display:inline-flex;align-items:center;padding:3px 10px;border-radius:20px;font-size:11px;font-weight:600;font-family:'JetBrains Mono',monospace}
  .tag-todo{background:#1e2533;color:#7a8499}
  .tag-progress{background:#1e2d4a;color:${G.accent}}
  .tag-done{background:#0f2a1a;color:${G.green}}
  .tag-overdue{background:#2a0f0f;color:${G.red}}
  .tag-admin{background:#2a1f3d;color:${G.purple}}
  .tag-member{background:#1a2030;color:${G.muted}}
  .modal-overlay{position:fixed;inset:0;background:rgba(0,0,0,.7);backdrop-filter:blur(4px);display:flex;align-items:center;justify-content:center;z-index:100;padding:16px}
  .modal{background:${G.card};border:1px solid ${G.border};border-radius:18px;padding:28px;width:100%;max-width:480px;animation:fadeUp .25s ease}
  .sidebar{width:220px;min-height:100vh;background:${G.surface};border-right:1px solid ${G.border};padding:24px 0;display:flex;flex-direction:column}
  .nav-item{display:flex;align-items:center;gap:10px;padding:10px 20px;cursor:pointer;font-size:14px;font-weight:600;color:${G.muted};border-left:3px solid transparent;transition:all .15s}
  .nav-item:hover{color:${G.text};background:rgba(79,142,247,.06)}
  .nav-item.active{color:${G.accent};background:rgba(79,142,247,.1);border-left-color:${G.accent}}
  .progress-bar{height:6px;background:${G.border};border-radius:3px;overflow:hidden}
  .progress-fill{height:100%;background:linear-gradient(90deg,${G.accent},${G.purple});border-radius:3px;transition:width .4s ease}
  label{font-size:13px;font-weight:600;color:${G.muted};display:block;margin-bottom:6px}
  .grid2{display:grid;grid-template-columns:1fr 1fr;gap:16px}
  .stat-card{background:${G.card};border:1px solid ${G.border};border-radius:14px;padding:20px}
  .avatar{width:32px;height:32px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;flex-shrink:0}
  select.input option{background:${G.card}}
  .chip{display:inline-flex;align-items:center;gap:4px;background:${G.accentDim};color:${G.accent};padding:2px 8px;border-radius:4px;font-size:11px;font-weight:600;font-family:'JetBrains Mono',monospace}
`;

// ── Seed Data ─────────────────────────────────────────────────────────────────
const seed = () => {
  const users = [
    { id: "u1", name: "Alice Chen", email: "alice@dev.io", password: "pass123", role: "admin", avatar: "#4f8ef7", initials: "AC" },
    { id: "u2", name: "Bob Martinez", email: "bob@dev.io", password: "pass123", role: "member", avatar: "#22c55e", initials: "BM" },
    { id: "u3", name: "Carol Singh", email: "carol@dev.io", password: "pass123", role: "member", avatar: "#a78bfa", initials: "CS" },
    { id: "u4", name: "Dan Lee", email: "dan@dev.io", password: "pass123", role: "member", avatar: "#f59e0b", initials: "DL" },
  ];
  const projects = [
    { id: "p1", name: "Website Redesign", description: "Full overhaul of the marketing site", ownerId: "u1", members: ["u1","u2","u3"], color: "#4f8ef7", createdAt: "2025-04-01" },
    { id: "p2", name: "Mobile App v2", description: "React Native rebuild with new features", ownerId: "u1", members: ["u1","u3","u4"], color: "#a78bfa", createdAt: "2025-04-10" },
  ];
  const tasks = [
    { id: "t1", title: "Design system audit", description: "Audit existing components and identify gaps", projectId: "p1", assigneeId: "u2", status: "done", priority: "high", due: "2025-04-20", createdAt: "2025-04-02" },
    { id: "t2", title: "Hero section redesign", description: "Create 3 variants for A/B testing", projectId: "p1", assigneeId: "u3", status: "in-progress", priority: "high", due: "2025-05-10", createdAt: "2025-04-05" },
    { id: "t3", title: "Navigation refactor", description: "Improve mobile nav UX", projectId: "p1", assigneeId: "u2", status: "todo", priority: "medium", due: "2025-05-15", createdAt: "2025-04-06" },
    { id: "t4", title: "SEO meta tags", description: "Add proper OG and Twitter cards", projectId: "p1", assigneeId: "u1", status: "todo", priority: "low", due: "2025-04-28", createdAt: "2025-04-07" },
    { id: "t5", title: "Auth flow screens", description: "Login, signup, forgot password", projectId: "p2", assigneeId: "u3", status: "done", priority: "high", due: "2025-04-18", createdAt: "2025-04-11" },
    { id: "t6", title: "Push notifications", description: "Integrate Firebase Cloud Messaging", projectId: "p2", assigneeId: "u4", status: "in-progress", priority: "high", due: "2025-05-20", createdAt: "2025-04-12" },
    { id: "t7", title: "Offline mode", description: "Cache critical data with AsyncStorage", projectId: "p2", assigneeId: "u4", status: "todo", priority: "medium", due: "2025-04-15", createdAt: "2025-04-13" },
  ];
  return { users, projects, tasks };
};

// ── Auth Context ──────────────────────────────────────────────────────────────
const AuthCtx = createContext(null);
const useAuth = () => useContext(AuthCtx);

// ── App Context ───────────────────────────────────────────────────────────────
const AppCtx = createContext(null);
const useApp = () => useContext(AppCtx);

// ── Helpers ───────────────────────────────────────────────────────────────────
const uid = () => Math.random().toString(36).slice(2, 9);
const today = () => new Date().toISOString().slice(0, 10);
const isOverdue = (task) => task.status !== "done" && task.due && task.due < today();
const statusLabel = { todo: "To Do", "in-progress": "In Progress", done: "Done" };
const priorityColor = { high: G.red, medium: G.amber, low: G.green };
const avatarColors = ["#4f8ef7","#22c55e","#a78bfa","#f59e0b","#ef4444","#06b6d4","#ec4899"];

function Avatar({ user, size = 32 }) {
  return (
    <div className="avatar" style={{ width: size, height: size, background: user?.avatar || "#4f8ef7", fontSize: size * 0.37 }}>
      {user?.initials || "?"}
    </div>
  );
}

function Badge({ status, overdue }) {
  if (overdue) return <span className="badge tag-overdue">Overdue</span>;
  if (status === "todo") return <span className="badge tag-todo">To Do</span>;
  if (status === "in-progress") return <span className="badge tag-progress">In Progress</span>;
  if (status === "done") return <span className="badge tag-done">Done</span>;
  return null;
}

// ── Login Page ────────────────────────────────────────────────────────────────
function LoginPage({ onLogin, data }) {
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("alice@dev.io");
  const [password, setPassword] = useState("pass123");
  const [name, setName] = useState("");
  const [error, setError] = useState("");

  const submit = async () => {
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
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: G.bg, padding: 16 }}>
      <style>{css}</style>
      <div style={{ width: "100%", maxWidth: 420 }} className="fade-up">
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
            <div style={{ width: 36, height: 36, background: G.accent, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>⬡</div>
            <span style={{ fontSize: 22, fontWeight: 800, letterSpacing: "-0.5px" }}>TaskForge</span>
          </div>
          <p style={{ color: G.muted, fontSize: 14 }}>Team-first project management</p>
        </div>

        <div className="card">
          {/* Tabs */}
          <div style={{ display: "flex", gap: 4, background: G.surface, padding: 4, borderRadius: 10, marginBottom: 24 }}>
            {["login","signup"].map(m => (
              <button key={m} onClick={() => { setMode(m); setError(""); }}
                style={{ flex:1, padding:"8px 0", borderRadius:8, border:"none", cursor:"pointer", fontFamily:"'Syne',sans-serif", fontWeight:600, fontSize:13,
                  background: mode===m ? G.card : "transparent", color: mode===m ? G.text : G.muted, transition:"all .15s" }}>
                {m === "login" ? "Sign In" : "Sign Up"}
              </button>
            ))}
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {mode === "signup" && (
              <div>
                <label>Full Name</label>
                <input className="input" value={name} onChange={e => setName(e.target.value)} placeholder="Carol Singh" />
              </div>
            )}
            <div>
              <label>Email</label>
              <input className="input" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@team.io" />
            </div>
            <div>
              <label>Password</label>
              <input className="input" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" />
            </div>
            {error && <p style={{ color: G.red, fontSize: 13 }}>⚠ {error}</p>}
            <button className="btn btn-primary" style={{ width: "100%", justifyContent: "center", padding: "12px 0", marginTop: 4 }} onClick={submit}>
              {mode === "login" ? "Sign In →" : "Create Account →"}
            </button>
          </div>
        </div>

        {/* Demo hint */}
        <div style={{ marginTop: 16, padding: 14, background: G.surface, borderRadius: 10, border: `1px solid ${G.border}` }}>
          <p style={{ fontSize: 12, color: G.muted, marginBottom: 8, fontWeight: 600 }}>DEMO ACCOUNTS</p>
          {[{ label: "Admin", email: "alice@dev.io" }, { label: "Member", email: "bob@dev.io" }].map(d => (
            <div key={d.email} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
              <span style={{ fontSize: 12, color: G.muted }}>{d.label} — {d.email}</span>
              <button className="btn btn-ghost btn-sm" onClick={() => { setEmail(d.email); setPassword("pass123"); setMode("login"); }}>Use</button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Modals ────────────────────────────────────────────────────────────────────
function Modal({ title, onClose, children }) {
  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 22 }}>
          <h3 style={{ fontWeight: 700, fontSize: 18 }}>{title}</h3>
          <button onClick={onClose} style={{ background: "none", border: "none", color: G.muted, fontSize: 20, cursor: "pointer", lineHeight: 1 }}>×</button>
        </div>
        {children}
      </div>
    </div>
  );
}

function ProjectModal({ project, onSave, onClose, users }) {
  const [name, setName] = useState(project?.name || "");
  const [desc, setDesc] = useState(project?.description || "");
  const [members, setMembers] = useState(project?.members || []);
  const [color, setColor] = useState(project?.color || G.accent);

  const toggleMember = id => setMembers(m => m.includes(id) ? m.filter(x => x !== id) : [...m, id]);
  const save = () => {
    if (!name.trim()) return;
    onSave({ name, description: desc, members, color });
  };

  return (
    <Modal title={project ? "Edit Project" : "New Project"} onClose={onClose}>
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <div><label>Project Name</label><input className="input" value={name} onChange={e => setName(e.target.value)} placeholder="Marketing Campaign" /></div>
        <div><label>Description</label><textarea className="input" value={desc} onChange={e => setDesc(e.target.value)} rows={2} placeholder="What's this project about?" style={{ resize: "vertical" }} /></div>
        <div>
          <label>Color</label>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {["#4f8ef7","#22c55e","#a78bfa","#f59e0b","#ef4444","#06b6d4","#ec4899"].map(c => (
              <div key={c} onClick={() => setColor(c)} style={{ width: 28, height: 28, borderRadius: "50%", background: c, cursor: "pointer", border: color === c ? `3px solid white` : "3px solid transparent", transition: "border .15s" }} />
            ))}
          </div>
        </div>
        <div>
          <label>Team Members</label>
          <div style={{ display: "flex", flexDirection: "column", gap: 8, maxHeight: 160, overflowY: "auto" }}>
            {users.map(u => (
              <div key={u.id} onClick={() => toggleMember(u.id)} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", borderRadius: 8, cursor: "pointer", background: members.includes(u.id) ? G.accentDim : G.surface, border: `1px solid ${members.includes(u.id) ? G.accent : G.border}`, transition: "all .15s" }}>
                <Avatar user={u} size={28} />
                <span style={{ fontSize: 14, flex: 1 }}>{u.name}</span>
                <span className={`badge tag-${u.role}`}>{u.role}</span>
                {members.includes(u.id) && <span style={{ color: G.accent }}>✓</span>}
              </div>
            ))}
          </div>
        </div>
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 4 }}>
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={save}>Save Project</button>
        </div>
      </div>
    </Modal>
  );
}

function TaskModal({ task, projectId, projects, users, currentUser, onSave, onClose }) {
  const [title, setTitle] = useState(task?.title || "");
  const [desc, setDesc] = useState(task?.description || "");
  const [pId, setPId] = useState(task?.projectId || projectId || projects[0]?.id || "");
  const [assigneeId, setAssigneeId] = useState(task?.assigneeId || currentUser.id);
  const [status, setStatus] = useState(task?.status || "todo");
  const [priority, setPriority] = useState(task?.priority || "medium");
  const [due, setDue] = useState(task?.due || "");

  const proj = projects.find(p => p.id === pId);
  const projUsers = users.filter(u => proj?.members?.includes(u.id));

  const save = () => {
    if (!title.trim()) return;
    onSave({ title, description: desc, projectId: pId, assigneeId, status, priority, due });
  };

  return (
    <Modal title={task ? "Edit Task" : "New Task"} onClose={onClose}>
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <div><label>Task Title</label><input className="input" value={title} onChange={e => setTitle(e.target.value)} placeholder="Implement feature X" /></div>
        <div><label>Description</label><textarea className="input" value={desc} onChange={e => setDesc(e.target.value)} rows={2} style={{ resize: "vertical" }} placeholder="Optional details..." /></div>
        <div className="grid2">
          <div>
            <label>Project</label>
            <select className="input" value={pId} onChange={e => setPId(e.target.value)}>
              {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <div>
            <label>Assignee</label>
            <select className="input" value={assigneeId} onChange={e => setAssigneeId(e.target.value)}>
              {(projUsers.length ? projUsers : users).map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
            </select>
          </div>
        </div>
        <div className="grid2">
          <div>
            <label>Status</label>
            <select className="input" value={status} onChange={e => setStatus(e.target.value)}>
              <option value="todo">To Do</option>
              <option value="in-progress">In Progress</option>
              <option value="done">Done</option>
            </select>
          </div>
          <div>
            <label>Priority</label>
            <select className="input" value={priority} onChange={e => setPriority(e.target.value)}>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>
        </div>
        <div><label>Due Date</label><input className="input" type="date" value={due} onChange={e => setDue(e.target.value)} /></div>
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 4 }}>
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={save}>Save Task</button>
        </div>
      </div>
    </Modal>
  );
}

// ── Dashboard ─────────────────────────────────────────────────────────────────
function Dashboard({ data, currentUser, onAction }) {
  const myTasks = data.tasks.filter(t => t.assigneeId === currentUser.id);
  const overdue = data.tasks.filter(t => isOverdue(t));
  const done = data.tasks.filter(t => t.status === "done");
  const inProgress = data.tasks.filter(t => t.status === "in-progress");

  const stats = [
    { label: "Total Projects", value: data.projects.length, color: G.accent, icon: "⬡" },
    { label: "My Tasks", value: myTasks.length, color: G.purple, icon: "◈" },
    { label: "In Progress", value: inProgress.length, color: G.amber, icon: "◉" },
    { label: "Overdue", value: overdue.length, color: G.red, icon: "◎" },
  ];

  const recent = [...data.tasks].sort((a,b)=>b.createdAt.localeCompare(a.createdAt)).slice(0, 5);

  return (
    <div className="fade-up">
      <div style={{ marginBottom: 28 }}>
        <h2 style={{ fontSize: 24, fontWeight: 800, marginBottom: 4 }}>
          Good {new Date().getHours() < 12 ? "morning" : new Date().getHours() < 18 ? "afternoon" : "evening"}, {currentUser.name.split(" ")[0]} 👋
        </h2>
        <p style={{ color: G.muted, fontSize: 14 }}>Here's what's happening across your projects</p>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))", gap: 14, marginBottom: 28 }}>
        {stats.map(s => (
          <div key={s.label} className="stat-card">
            <div style={{ fontSize: 22, marginBottom: 8 }}>{s.icon}</div>
            <div style={{ fontSize: 32, fontWeight: 800, color: s.color, fontFamily: "'JetBrains Mono'" }}>{s.value}</div>
            <div style={{ fontSize: 13, color: G.muted, marginTop: 2 }}>{s.label}</div>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 24 }}>
        {/* Project Progress */}
        <div className="card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
            <h3 style={{ fontWeight: 700, fontSize: 15 }}>Project Progress</h3>
            {currentUser.role === "admin" && (
              <button className="btn btn-primary btn-sm" onClick={() => onAction("new-project")}>+ Project</button>
            )}
          </div>
          {data.projects.length === 0 && <p style={{ color: G.muted, fontSize: 13 }}>No projects yet</p>}
          {data.projects.map(p => {
            const pTasks = data.tasks.filter(t => t.projectId === p.id);
            const pDone = pTasks.filter(t => t.status === "done").length;
            const pct = pTasks.length ? Math.round((pDone / pTasks.length) * 100) : 0;
            return (
              <div key={p.id} style={{ marginBottom: 16, cursor: "pointer" }} onClick={() => onAction("view-project", p)}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ width: 10, height: 10, borderRadius: "50%", background: p.color }} />
                    <span style={{ fontSize: 13, fontWeight: 600 }}>{p.name}</span>
                  </div>
                  <span style={{ fontSize: 12, color: G.muted, fontFamily: "'JetBrains Mono'" }}>{pct}%</span>
                </div>
                <div className="progress-bar"><div className="progress-fill" style={{ width: `${pct}%`, background: p.color }} /></div>
                <p style={{ fontSize: 11, color: G.muted, marginTop: 4 }}>{pDone}/{pTasks.length} tasks</p>
              </div>
            );
          })}
        </div>

        {/* Overdue Tasks */}
        <div className="card">
          <h3 style={{ fontWeight: 700, fontSize: 15, marginBottom: 18 }}>⚠ Overdue Tasks</h3>
          {overdue.length === 0 && <p style={{ color: G.green, fontSize: 13 }}>🎉 No overdue tasks!</p>}
          {overdue.slice(0, 5).map(t => {
            const proj = data.projects.find(p => p.id === t.projectId);
            const assignee = data.users.find(u => u.id === t.assigneeId);
            return (
              <div key={t.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 0", borderBottom: `1px solid ${G.border}` }}>
                <div style={{ width: 3, height: 36, borderRadius: 2, background: G.red, flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 13, fontWeight: 600, marginBottom: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.title}</p>
                  <p style={{ fontSize: 11, color: G.muted }}>{proj?.name} • Due {t.due}</p>
                </div>
                <Avatar user={assignee} size={26} />
              </div>
            );
          })}
        </div>
      </div>

      {/* Recent Tasks */}
      <div className="card">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
          <h3 style={{ fontWeight: 700, fontSize: 15 }}>Recent Tasks</h3>
          <button className="btn btn-primary btn-sm" onClick={() => onAction("new-task")}>+ Task</button>
        </div>
        <TaskTable tasks={recent} data={data} currentUser={currentUser} onAction={onAction} />
      </div>
    </div>
  );
}

// ── Task Table ────────────────────────────────────────────────────────────────
function TaskTable({ tasks, data, currentUser, onAction, compact }) {
  if (!tasks.length) return <p style={{ color: G.muted, fontSize: 13, padding: "12px 0" }}>No tasks found.</p>;
  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ borderBottom: `1px solid ${G.border}` }}>
            {["Task", "Project", "Assignee", "Priority", "Status", "Due", ""].map(h => (
              <th key={h} style={{ textAlign: "left", padding: "8px 10px", fontSize: 11, color: G.muted, fontWeight: 600, whiteSpace: "nowrap" }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {tasks.map(t => {
            const proj = data.projects.find(p => p.id === t.projectId);
            const assignee = data.users.find(u => u.id === t.assigneeId);
            const od = isOverdue(t);
            const canEdit = currentUser.role === "admin" || t.assigneeId === currentUser.id;
            return (
              <tr key={t.id} style={{ borderBottom: `1px solid ${G.border}`, transition: "background .12s" }}
                onMouseEnter={e => e.currentTarget.style.background = G.surface}
                onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                <td style={{ padding: "12px 10px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ width: 3, height: 28, borderRadius: 2, background: priorityColor[t.priority], flexShrink: 0 }} />
                    <span style={{ fontSize: 13, fontWeight: 600, maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.title}</span>
                  </div>
                </td>
                <td style={{ padding: "12px 10px" }}>
                  {proj && <span className="chip" style={{ background: proj.color + "22", color: proj.color }}>{proj.name}</span>}
                </td>
                <td style={{ padding: "12px 10px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <Avatar user={assignee} size={24} />
                    <span style={{ fontSize: 12, color: G.muted }}>{assignee?.name?.split(" ")[0]}</span>
                  </div>
                </td>
                <td style={{ padding: "12px 10px" }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: priorityColor[t.priority], fontFamily: "'JetBrains Mono'" }}>{t.priority.toUpperCase()}</span>
                </td>
                <td style={{ padding: "12px 10px" }}><Badge status={t.status} overdue={od} /></td>
                <td style={{ padding: "12px 10px" }}>
                  <span style={{ fontSize: 12, color: od ? G.red : G.muted, fontFamily: "'JetBrains Mono'" }}>{t.due || "—"}</span>
                </td>
                <td style={{ padding: "12px 10px" }}>
                  {canEdit && (
                    <div style={{ display: "flex", gap: 6 }}>
                      <button className="btn btn-ghost btn-sm" onClick={() => onAction("edit-task", t)}>Edit</button>
                      {currentUser.role === "admin" && (
                        <button className="btn btn-danger btn-sm" onClick={() => onAction("delete-task", t)}>✕</button>
                      )}
                    </div>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ── Projects View ─────────────────────────────────────────────────────────────
function ProjectsView({ data, currentUser, onAction }) {
  const [search, setSearch] = useState("");
  const filtered = data.projects.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) &&
    (currentUser.role === "admin" || p.members.includes(currentUser.id))
  );

  return (
    <div className="fade-up">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 2 }}>Projects</h2>
          <p style={{ color: G.muted, fontSize: 13 }}>{filtered.length} project{filtered.length !== 1 ? "s" : ""}</p>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <input className="input" style={{ width: 200 }} value={search} onChange={e => setSearch(e.target.value)} placeholder="🔍 Search..." />
          {currentUser.role === "admin" && (
            <button className="btn btn-primary" onClick={() => onAction("new-project")}>+ New Project</button>
          )}
        </div>
      </div>
      {filtered.length === 0 && <div className="card" style={{ textAlign: "center", padding: 48, color: G.muted }}>No projects found</div>}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(300px,1fr))", gap: 16 }}>
        {filtered.map(p => {
          const pTasks = data.tasks.filter(t => t.projectId === p.id);
          const pDone = pTasks.filter(t => t.status === "done").length;
          const pct = pTasks.length ? Math.round((pDone / pTasks.length) * 100) : 0;
          const pOverdue = pTasks.filter(t => isOverdue(t)).length;
          const pMembers = data.users.filter(u => p.members.includes(u.id));
          const owner = data.users.find(u => u.id === p.ownerId);
          return (
            <div key={p.id} className="card" style={{ cursor: "pointer", transition: "border .18s", borderTop: `3px solid ${p.color}` }}
              onClick={() => onAction("view-project", p)}
              onMouseEnter={e => e.currentTarget.style.borderColor = p.color}
              onMouseLeave={e => e.currentTarget.style.borderColor = G.border}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
                <div>
                  <h3 style={{ fontWeight: 700, fontSize: 16, marginBottom: 4 }}>{p.name}</h3>
                  <p style={{ color: G.muted, fontSize: 12, lineHeight: 1.5 }}>{p.description}</p>
                </div>
                {currentUser.role === "admin" && (
                  <button className="btn btn-ghost btn-sm" style={{ flexShrink: 0, marginLeft: 8 }}
                    onClick={e => { e.stopPropagation(); onAction("edit-project", p); }}>⋯</button>
                )}
              </div>
              <div className="progress-bar" style={{ marginBottom: 6 }}>
                <div className="progress-fill" style={{ width: `${pct}%`, background: p.color }} />
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
                <span style={{ fontSize: 11, color: G.muted }}>{pDone}/{pTasks.length} tasks done</span>
                <span style={{ fontSize: 11, fontFamily: "'JetBrains Mono'", color: p.color }}>{pct}%</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ display: "flex" }}>
                  {pMembers.slice(0, 4).map((u, i) => (
                    <div key={u.id} style={{ marginLeft: i ? -8 : 0, zIndex: 4 - i }}>
                      <Avatar user={u} size={28} />
                    </div>
                  ))}
                  {pMembers.length > 4 && <div className="avatar" style={{ width: 28, height: 28, background: G.border, fontSize: 10, marginLeft: -8 }}>+{pMembers.length - 4}</div>}
                </div>
                {pOverdue > 0 && <span style={{ fontSize: 11, color: G.red, fontWeight: 600 }}>⚠ {pOverdue} overdue</span>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Project Detail ────────────────────────────────────────────────────────────
function ProjectDetail({ project, data, currentUser, onAction, onBack }) {
  const [statusFilter, setStatusFilter] = useState("all");
  const [view, setView] = useState("table");
  const tasks = data.tasks.filter(t => t.projectId === project.id &&
    (statusFilter === "all" || (statusFilter === "overdue" ? isOverdue(t) : t.status === statusFilter))
  );
  const members = data.users.filter(u => project.members.includes(u.id));
  const total = data.tasks.filter(t => t.projectId === project.id);
  const done = total.filter(t => t.status === "done").length;
  const pct = total.length ? Math.round((done / total.length) * 100) : 0;

  return (
    <div className="fade-up">
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
        <button className="btn btn-ghost btn-sm" onClick={onBack}>← Back</button>
        <div style={{ width: 14, height: 14, borderRadius: "50%", background: project.color }} />
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 800 }}>{project.name}</h2>
          <p style={{ color: G.muted, fontSize: 12 }}>{project.description}</p>
        </div>
        <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
          {currentUser.role === "admin" && (
            <button className="btn btn-ghost btn-sm" onClick={() => onAction("edit-project", project)}>Edit Project</button>
          )}
          <button className="btn btn-primary btn-sm" onClick={() => onAction("new-task", project.id)}>+ Task</button>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr auto", gap: 14, marginBottom: 24 }}>
        {[
          { label: "Total Tasks", value: total.length },
          { label: "Completed", value: done, color: G.green },
          { label: "Overdue", value: total.filter(t => isOverdue(t)).length, color: G.red },
        ].map(s => (
          <div key={s.label} className="stat-card">
            <div style={{ fontSize: 26, fontWeight: 800, color: s.color || G.text, fontFamily: "'JetBrains Mono'" }}>{s.value}</div>
            <div style={{ fontSize: 12, color: G.muted }}>{s.label}</div>
          </div>
        ))}
        <div className="stat-card" style={{ display: "flex", flexDirection: "column", justifyContent: "center", minWidth: 120 }}>
          <div style={{ fontSize: 22, fontWeight: 800, color: project.color, fontFamily: "'JetBrains Mono'", marginBottom: 6 }}>{pct}%</div>
          <div className="progress-bar"><div className="progress-fill" style={{ width: `${pct}%`, background: project.color }} /></div>
        </div>
      </div>

      <div style={{ display: "flex", gap: 14, marginBottom: 24 }}>
        {/* Tasks */}
        <div className="card" style={{ flex: 1 }}>
          <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
            {["all","todo","in-progress","done","overdue"].map(s => (
              <button key={s} className={`btn btn-sm ${statusFilter === s ? "btn-primary" : "btn-ghost"}`}
                onClick={() => setStatusFilter(s)}>
                {s === "all" ? "All" : s === "in-progress" ? "In Progress" : s.charAt(0).toUpperCase() + s.slice(1)}
              </button>
            ))}
          </div>
          <TaskTable tasks={tasks} data={data} currentUser={currentUser} onAction={onAction} />
        </div>

        {/* Members */}
        <div className="card" style={{ width: 220, flexShrink: 0 }}>
          <h4 style={{ fontWeight: 700, fontSize: 13, marginBottom: 14, color: G.muted }}>TEAM</h4>
          {members.map(u => {
            const uTasks = data.tasks.filter(t => t.projectId === project.id && t.assigneeId === u.id);
            const uDone = uTasks.filter(t => t.status === "done").length;
            return (
              <div key={u.id} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
                <Avatar user={u} />
                <div>
                  <p style={{ fontSize: 13, fontWeight: 600 }}>{u.name}</p>
                  <p style={{ fontSize: 11, color: G.muted }}>{uDone}/{uTasks.length} done</p>
                </div>
                <span className={`badge tag-${u.role}`} style={{ marginLeft: "auto" }}>{u.role}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ── My Tasks View ─────────────────────────────────────────────────────────────
function MyTasksView({ data, currentUser, onAction }) {
  const [statusFilter, setStatusFilter] = useState("all");
  const tasks = data.tasks.filter(t =>
    t.assigneeId === currentUser.id &&
    (statusFilter === "all" || (statusFilter === "overdue" ? isOverdue(t) : t.status === statusFilter))
  );

  return (
    <div className="fade-up">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 2 }}>My Tasks</h2>
          <p style={{ color: G.muted, fontSize: 13 }}>{tasks.length} task{tasks.length !== 1 ? "s" : ""} assigned to you</p>
        </div>
        <button className="btn btn-primary" onClick={() => onAction("new-task")}>+ New Task</button>
      </div>
      <div className="card">
        <div style={{ display: "flex", gap: 8, marginBottom: 18, flexWrap: "wrap" }}>
          {["all","todo","in-progress","done","overdue"].map(s => (
            <button key={s} className={`btn btn-sm ${statusFilter === s ? "btn-primary" : "btn-ghost"}`}
              onClick={() => setStatusFilter(s)}>
              {s === "all" ? "All" : s === "in-progress" ? "In Progress" : s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
        <TaskTable tasks={tasks} data={data} currentUser={currentUser} onAction={onAction} />
      </div>
    </div>
  );
}

// ── All Tasks (Admin) ─────────────────────────────────────────────────────────
function AllTasksView({ data, currentUser, onAction }) {
  const [statusFilter, setStatusFilter] = useState("all");
  const [projectFilter, setProjectFilter] = useState("all");

  const tasks = data.tasks.filter(t =>
    (projectFilter === "all" || t.projectId === projectFilter) &&
    (statusFilter === "all" || (statusFilter === "overdue" ? isOverdue(t) : t.status === statusFilter))
  );

  return (
    <div className="fade-up">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 2 }}>All Tasks</h2>
          <p style={{ color: G.muted, fontSize: 13 }}>{tasks.length} task{tasks.length !== 1 ? "s" : ""}</p>
        </div>
        <button className="btn btn-primary" onClick={() => onAction("new-task")}>+ New Task</button>
      </div>
      <div className="card">
        <div style={{ display: "flex", gap: 10, marginBottom: 18, flexWrap: "wrap" }}>
          <select className="input" style={{ width: 180 }} value={projectFilter} onChange={e => setProjectFilter(e.target.value)}>
            <option value="all">All Projects</option>
            {data.projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          {["all","todo","in-progress","done","overdue"].map(s => (
            <button key={s} className={`btn btn-sm ${statusFilter === s ? "btn-primary" : "btn-ghost"}`}
              onClick={() => setStatusFilter(s)}>
              {s === "all" ? "All" : s === "in-progress" ? "In Progress" : s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
        <TaskTable tasks={tasks} data={data} currentUser={currentUser} onAction={onAction} />
      </div>
    </div>
  );
}

// ── Team (Admin) ──────────────────────────────────────────────────────────────
function TeamView({ data, currentUser }) {
  if (currentUser.role !== "admin") {
    return <div className="card fade-up" style={{ textAlign: "center", padding: 48, color: G.muted }}>
      <p style={{ fontSize: 32, marginBottom: 12 }}>🔒</p>
      <p>Only admins can view the full team list.</p>
    </div>;
  }

  return (
    <div className="fade-up">
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 2 }}>Team</h2>
        <p style={{ color: G.muted, fontSize: 13 }}>{data.users.length} members</p>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(260px,1fr))", gap: 16 }}>
        {data.users.map(u => {
          const uTasks = data.tasks.filter(t => t.assigneeId === u.id);
          const uDone = uTasks.filter(t => t.status === "done").length;
          const uOverdue = uTasks.filter(t => isOverdue(t)).length;
          const uProjects = data.projects.filter(p => p.members.includes(u.id));
          return (
            <div key={u.id} className="card">
              <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 16 }}>
                <Avatar user={u} size={44} />
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2 }}>
                    <p style={{ fontWeight: 700, fontSize: 15 }}>{u.name}</p>
                    {u.id === currentUser.id && <span className="chip">You</span>}
                  </div>
                  <p style={{ color: G.muted, fontSize: 12 }}>{u.email}</p>
                </div>
                <span className={`badge tag-${u.role}`} style={{ marginLeft: "auto" }}>{u.role}</span>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 14 }}>
                {[{ label: "Tasks", value: uTasks.length }, { label: "Done", value: uDone, color: G.green }, { label: "Overdue", value: uOverdue, color: uOverdue ? G.red : G.muted }].map(s => (
                  <div key={s.label} style={{ textAlign: "center", padding: "8px", background: G.surface, borderRadius: 8 }}>
                    <div style={{ fontSize: 20, fontWeight: 800, color: s.color || G.text, fontFamily: "'JetBrains Mono'" }}>{s.value}</div>
                    <div style={{ fontSize: 10, color: G.muted }}>{s.label}</div>
                  </div>
                ))}
              </div>
              <div>
                <p style={{ fontSize: 11, color: G.muted, marginBottom: 6 }}>PROJECTS</p>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {uProjects.map(p => <span key={p.id} className="chip" style={{ background: p.color + "22", color: p.color }}>{p.name}</span>)}
                  {!uProjects.length && <span style={{ fontSize: 12, color: G.muted }}>None</span>}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Main App ──────────────────────────────────────────────────────────────────
export default function App() {
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
  }, []);

  const handleAction = (type, payload) => {
    if (type === "new-project") setModal({ type: "project", payload: null });
    else if (type === "edit-project") setModal({ type: "project", payload });
    else if (type === "new-task") setModal({ type: "task", payload: typeof payload === "string" ? { projectId: payload } : null });
    else if (type === "edit-task") setModal({ type: "task", payload });
    else if (type === "delete-task") {
      if (window.confirm("Delete this task?")) {
        api.deleteTask(payload.id).then(() => fetchData());
      }
    } else if (type === "view-project") {
      setSelectedProject(payload);
      setPage("project-detail");
    }
  };

  const saveProject = async (formData) => {
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
  };

  const saveTask = async (formData) => {
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
  };

  if (!currentUser) return <LoginPage onLogin={handleLogin} data={data} />;

  const navItems = [
    { id: "dashboard", label: "Dashboard", icon: "◈" },
    { id: "projects", label: "Projects", icon: "⬡" },
    { id: "my-tasks", label: "My Tasks", icon: "◎" },
    ...(currentUser.role === "admin" ? [{ id: "all-tasks", label: "All Tasks", icon: "≡" }] : []),
    { id: "team", label: "Team", icon: "◉" },
  ];

  const renderPage = () => {
    if (page === "project-detail" && selectedProject) {
      const liveProject = data.projects.find(p => p.id === selectedProject.id);
      if (!liveProject) { setPage("projects"); return null; }
      return <ProjectDetail project={liveProject} data={data} currentUser={currentUser} onAction={handleAction} onBack={() => { setPage("projects"); setSelectedProject(null); }} />;
    }
    switch (page) {
      case "dashboard": return <Dashboard data={data} currentUser={currentUser} onAction={handleAction} />;
      case "projects": return <ProjectsView data={data} currentUser={currentUser} onAction={handleAction} />;
      case "my-tasks": return <MyTasksView data={data} currentUser={currentUser} onAction={handleAction} />;
      case "all-tasks": return <AllTasksView data={data} currentUser={currentUser} onAction={handleAction} />;
      case "team": return <TeamView data={data} currentUser={currentUser} />;
      default: return null;
    }
  };

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: G.bg }}>
      <style>{css}</style>

      {/* Sidebar */}
      <aside className="sidebar">
        <div style={{ padding: "0 20px 24px", borderBottom: `1px solid ${G.border}` }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 30, height: 30, background: G.accent, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>⬡</div>
            <span style={{ fontWeight: 800, fontSize: 16 }}>TaskForge</span>
          </div>
        </div>

        <nav style={{ flex: 1, padding: "16px 0" }}>
          {navItems.map(n => (
            <div key={n.id} className={`nav-item ${(page === n.id || (page === "project-detail" && n.id === "projects")) ? "active" : ""}`}
              onClick={() => { setPage(n.id); setSelectedProject(null); }}>
              <span style={{ fontSize: 16, width: 20, textAlign: "center" }}>{n.icon}</span>
              {n.label}
            </div>
          ))}
        </nav>

        {/* User */}
        <div style={{ padding: "16px 20px", borderTop: `1px solid ${G.border}` }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
            <Avatar user={currentUser} />
            <div style={{ minWidth: 0 }}>
              <p style={{ fontSize: 13, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{currentUser.name}</p>
              <span className={`badge tag-${currentUser.role}`}>{currentUser.role}</span>
            </div>
          </div>
          <button className="btn btn-ghost btn-sm" style={{ width: "100%", justifyContent: "center" }} onClick={() => { localStorage.removeItem("token"); setCurrentUser(null); }}>
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main */}
      <main style={{ flex: 1, padding: 28, overflowY: "auto", maxHeight: "100vh" }}>
        {renderPage()}
      </main>

      {/* Modals */}
      {modal?.type === "project" && (
        <ProjectModal
          project={modal.payload}
          users={data.users}
          onSave={saveProject}
          onClose={() => setModal(null)}
        />
      )}
      {modal?.type === "task" && (
        <TaskModal
          task={modal.payload?.id ? modal.payload : null}
          projectId={modal.payload?.projectId || selectedProject?.id}
          projects={data.projects.filter(p => currentUser.role === "admin" || p.members.includes(currentUser.id))}
          users={data.users}
          currentUser={currentUser}
          onSave={saveTask}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  );
}
