import React, { useCallback, useEffect, useState } from "react";
import API from "../api/api";
import DashboardLayout from "../components/DashboardLayout";
import { getStoredUser } from "../utils/auth";
import { getAdminNav } from "../utils/adminNav";
import { isSuperAdmin } from "../utils/roles";

const ROLE_LABELS = {
  student: "Student",
  admin: "Admin",
  superadmin: "Super Admin",
};

const ROLE_FILTERS = [
  { id: "", label: "All Users", icon: "👥" },
  { id: "student", label: "Students", icon: "🎓" },
  { id: "admin", label: "Admins", icon: "⚙️" },
  { id: "superadmin", label: "Super Admins", icon: "👑" },
];

function getInitials(name) {
  return (
    name
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "?"
  );
}

function formatJoined(dateStr) {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  return {
    date: d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }),
    time: d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true }),
  };
}

export default function AdminUsers() {
  const user = getStoredUser();
  const navItems = getAdminNav(user);
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [msg, setMsg] = useState("");
  const [actionId, setActionId] = useState(null);

  const load = useCallback(() => {
    setLoading(true);
    setError("");
    const params = {};
    if (search.trim()) params.search = search.trim();
    if (roleFilter) params.role = roleFilter;

    Promise.all([API.get("/users", { params }), API.get("/users/stats")])
      .then(([usersRes, statsRes]) => {
        setUsers(usersRes.data);
        setStats(statsRes.data);
      })
      .catch((err) => {
        setError(err.response?.data?.message || "Failed to load users");
        setUsers([]);
      })
      .finally(() => setLoading(false));
  }, [search, roleFilter]);

  useEffect(() => {
    load();
  }, [load]);

  const changeRole = async (id, role) => {
    setActionId(id);
    setMsg("");
    try {
      const { data } = await API.patch(`/users/${id}/role`, { role });
      setUsers((prev) => prev.map((u) => (u._id === data._id ? data : u)));
      setMsg(`Updated ${data.name} to ${ROLE_LABELS[data.role]}`);
      const { data: statsData } = await API.get("/users/stats");
      setStats(statsData);
    } catch (err) {
      setMsg(err.response?.data?.message || "Role update failed");
    } finally {
      setActionId(null);
    }
  };

  const deleteUser = async (target) => {
    if (target.role === "superadmin") return;
    const confirmed = window.confirm(`Delete ${target.name} (${target.email})? This cannot be undone.`);
    if (!confirmed) return;

    setActionId(target._id);
    setMsg("");
    try {
      await API.delete(`/users/${target._id}`);
      setUsers((prev) => prev.filter((u) => u._id !== target._id));
      setMsg(`Deleted ${target.name}`);
      const { data: statsData } = await API.get("/users/stats");
      setStats(statsData);
    } catch (err) {
      setMsg(err.response?.data?.message || "Delete failed");
    } finally {
      setActionId(null);
    }
  };

  if (!isSuperAdmin(user)) {
    return null;
  }

  const msgIsError = msg.toLowerCase().includes("fail");

  return (
    <DashboardLayout user={user} role="superadmin" navItems={navItems} wide>
      <div className="dash-hero dash-hero-superadmin">
        <div className="dash-hero-bg" aria-hidden="true" />
        <div className="dash-hero-inner">
          <div className="dash-hero-text">
            <p className="dash-greeting">Super Admin Panel</p>
            <h1>User Management</h1>
            <p className="dash-hero-note">
              View all accounts, promote students to admin, demote admins, or remove users safely.
            </p>
          </div>
          {stats && (
            <div className="dash-stat-cards dash-stat-cards-hero">
              <div className="dash-stat-card">
                <span className="dash-stat-icon">👥</span>
                <div><strong>{stats.total}</strong><span>Total</span></div>
              </div>
              <div className="dash-stat-card">
                <span className="dash-stat-icon">🎓</span>
                <div><strong>{stats.students}</strong><span>Students</span></div>
              </div>
              <div className="dash-stat-card">
                <span className="dash-stat-icon">⚙️</span>
                <div><strong>{stats.admins}</strong><span>Admins</span></div>
              </div>
              <div className="dash-stat-card">
                <span className="dash-stat-icon">👑</span>
                <div><strong>{stats.superadmins}</strong><span>Super</span></div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="users-mgmt-toolbar">
        <div className="users-mgmt-search-wrap">
          <span className="users-mgmt-search-icon" aria-hidden="true">🔍</span>
          <input
            type="search"
            className="users-mgmt-search"
            placeholder="Search by name or email…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <button type="button" className="btn btn-outline users-mgmt-refresh" onClick={load}>
          ↻ Refresh
        </button>
      </div>

      <div className="users-role-tabs" role="tablist" aria-label="Filter by role">
        {ROLE_FILTERS.map((tab) => (
          <button
            key={tab.id || "all"}
            type="button"
            role="tab"
            aria-selected={roleFilter === tab.id}
            className={`users-role-tab ${roleFilter === tab.id ? "active" : ""}`}
            onClick={() => setRoleFilter(tab.id)}
          >
            <span>{tab.icon}</span>
            {tab.label}
            {stats && tab.id === "" && <em>{stats.total}</em>}
            {stats && tab.id === "student" && <em>{stats.students}</em>}
            {stats && tab.id === "admin" && <em>{stats.admins}</em>}
            {stats && tab.id === "superadmin" && <em>{stats.superadmins}</em>}
          </button>
        ))}
      </div>

      {error && (
        <div className="auth-alert auth-alert-error users-mgmt-alert">
          <span>⚠</span> {error}
        </div>
      )}
      {msg && (
        <div className={`auth-alert users-mgmt-alert ${msgIsError ? "auth-alert-error" : "users-mgmt-alert--success"}`}>
          <span>{msgIsError ? "⚠" : "✓"}</span> {msg}
        </div>
      )}

      <div className="users-mgmt-panel">
        <div className="dash-toolbar users-mgmt-panel-head">
          <h2>
            {roleFilter ? ROLE_LABELS[roleFilter] + "s" : "All Users"}
            {!loading && <span className="dash-count"> · {users.length} shown</span>}
          </h2>
        </div>

        {loading ? (
          <div className="users-mgmt-loading">
            <span className="auth-spinner" />
            <p>Loading users…</p>
          </div>
        ) : users.length === 0 ? (
          <div className="empty-state dash-empty users-mgmt-empty">
            <div className="empty-icon">👥</div>
            <h3>No users found</h3>
            <p>Try a different search or filter.</p>
          </div>
        ) : (
          <div className="users-table-wrap">
            <table className="users-table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Role</th>
                  <th>Class</th>
                  <th>Joined at</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => {
                  const isSelf = String(u._id) === String(user._id);
                  const isProtected = u.role === "superadmin";
                  const busy = actionId === u._id;
                  const joined = formatJoined(u.createdAt);

                  return (
                    <tr key={u._id} className={isSelf ? "users-row--self" : ""}>
                      <td>
                        <div className="users-cell-user">
                          <span className={`users-avatar users-avatar--${u.role}`}>{getInitials(u.name)}</span>
                          <div>
                            <strong>
                              {u.name}
                              {isSelf && <span className="users-you-badge">You</span>}
                            </strong>
                            <small>{u.email}</small>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className={`dash-role-badge dash-role-${u.role}`}>
                          {ROLE_LABELS[u.role] || u.role}
                        </span>
                      </td>
                      <td>
                        {u.role === "student" ? (
                          <span className="users-class-pill">{u.className || "—"}</span>
                        ) : (
                          <span className="users-class-na">—</span>
                        )}
                      </td>
                      <td className="users-date">
                        {joined ? (
                          <div className="users-datetime">
                            <span className="users-datetime-date">{joined.date}</span>
                            <span className="users-datetime-time">{joined.time}</span>
                          </div>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td>
                        {!isProtected && !isSelf && (
                          <div className="users-actions">
                            {u.role === "student" && (
                              <button
                                type="button"
                                className="users-action-btn users-action-btn--promote"
                                disabled={busy}
                                onClick={() => changeRole(u._id, "admin")}
                              >
                                {busy ? "…" : "↑ Admin"}
                              </button>
                            )}
                            {u.role === "admin" && (
                              <button
                                type="button"
                                className="users-action-btn users-action-btn--demote"
                                disabled={busy}
                                onClick={() => changeRole(u._id, "student")}
                              >
                                {busy ? "…" : "↓ Student"}
                              </button>
                            )}
                            <button
                              type="button"
                              className="users-action-btn users-action-btn--delete"
                              disabled={busy}
                              onClick={() => deleteUser(u)}
                            >
                              Delete
                            </button>
                          </div>
                        )}
                        {isProtected && <span className="users-protected">🔒 Protected</span>}
                        {isSelf && !isProtected && <span className="users-protected">Your account</span>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="users-privilege-note">
        <span className="users-privilege-icon" aria-hidden="true">👑</span>
        <div>
          <strong>Super Admin privileges</strong>
          <p>
            Only you can manage users, edit UPI payment QR settings, and permanently delete rejected admissions.
            Regular admins cannot access this dashboard.
          </p>
        </div>
      </div>
    </DashboardLayout>
  );
}
