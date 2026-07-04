import React, { useEffect, useState } from "react";
import API from "../api/api";
import DashboardLayout from "../components/DashboardLayout";
import { TimetableWeekGrid, HolidayCalendar } from "../components/TimetableWidgets";
import { getStoredUser } from "../utils/auth";
import { getAdminNav } from "../utils/adminNav";
import { isSuperAdmin } from "../utils/roles";
import { BATCH_PROGRAMS, DAY_NAMES, HOLIDAY_BATCH_OPTIONS } from "../utils/academyClasses";

const staffRole = (user) => (isSuperAdmin(user) ? "superadmin" : "admin");

const EMPTY_SLOT = {
  dayOfWeek: 1,
  startTime: "",
  endTime: "",
  subject: "",
  room: "",
  teacher: "",
};

const EMPTY_HOLIDAY = {
  title: "",
  date: "",
  endDate: "",
  description: "",
  batches: ["all"],
};

export default function AdminTimetable() {
  const user = getStoredUser();
  const [tab, setTab] = useState("timetable");
  const [batchId, setBatchId] = useState(BATCH_PROGRAMS[0].id);
  const [slots, setSlots] = useState([]);
  const [week, setWeek] = useState([]);
  const [batch, setBatch] = useState(null);
  const [slotForm, setSlotForm] = useState(EMPTY_SLOT);
  const [holidays, setHolidays] = useState([]);
  const [holidayForm, setHolidayForm] = useState(EMPTY_HOLIDAY);
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const [holidayYear, setHolidayYear] = useState(new Date().getFullYear());

  const fetchTimetable = (id = batchId) =>
    API.get(`/timetable/${id}`)
      .then((res) => {
        setBatch(res.data.batch);
        setSlots(res.data.slots || []);
        setWeek(res.data.week || []);
      })
      .catch(() => {
        setSlots([]);
        setWeek([]);
      });

  const fetchHolidays = () =>
    API.get("/timetable/holidays", { params: { year: holidayYear } })
      .then((res) => setHolidays(res.data))
      .catch(() => setHolidays([]));

  useEffect(() => {
    fetchTimetable(batchId);
  }, [batchId]);

  useEffect(() => {
    if (tab === "holidays") fetchHolidays();
  }, [tab, holidayYear]);

  const addSlot = () => {
    if (!slotForm.startTime || !slotForm.endTime || !slotForm.subject.trim()) {
      return setMsg("Start time, end time, and subject are required for a slot.");
    }
    setSlots((prev) => [...prev, { ...slotForm, subject: slotForm.subject.trim() }]);
    setSlotForm(EMPTY_SLOT);
    setMsg("");
  };

  const removeSlot = (index) => {
    setSlots((prev) => prev.filter((_, i) => i !== index));
  };

  const saveTimetable = async () => {
    setLoading(true);
    setMsg("");
    try {
      const { data } = await API.put(`/timetable/${batchId}`, { slots });
      setWeek(data.week || []);
      setSlots(data.slots || []);
      setMsg("Timetable saved successfully.");
    } catch (err) {
      setMsg(err.response?.data?.message || "Failed to save timetable");
    } finally {
      setLoading(false);
    }
  };

  const toggleHolidayBatch = (id) => {
    setHolidayForm((prev) => {
      if (id === "all") return { ...prev, batches: ["all"] };
      const withoutAll = prev.batches.filter((b) => b !== "all");
      const next = withoutAll.includes(id)
        ? withoutAll.filter((b) => b !== id)
        : [...withoutAll, id];
      return { ...prev, batches: next.length ? next : ["all"] };
    });
  };

  const saveHoliday = async (e) => {
    e.preventDefault();
    if (!holidayForm.title.trim() || !holidayForm.date) {
      return setMsg("Holiday title and date are required.");
    }
    setLoading(true);
    setMsg("");
    try {
      await API.post("/timetable/holidays", holidayForm);
      setHolidayForm(EMPTY_HOLIDAY);
      setMsg("Holiday added.");
      fetchHolidays();
    } catch (err) {
      setMsg(err.response?.data?.message || "Failed to add holiday");
    } finally {
      setLoading(false);
    }
  };

  const deleteHoliday = async (id) => {
    if (!window.confirm("Delete this holiday?")) return;
    await API.delete(`/timetable/holidays/${id}`);
    fetchHolidays();
  };

  const selectedBatch = BATCH_PROGRAMS.find((b) => b.id === batchId);

  return (
    <DashboardLayout user={user} role={staffRole(user)} navItems={getAdminNav(user)}>
      <div className="tt-admin-page">
        <header className="tt-page-header">
          <div>
            <p className="section-eyebrow">TIMETABLE MANAGEMENT</p>
            <h1>Batch Timetable & Holidays</h1>
            <p className="tt-page-sub">Manage weekly schedules for each batch and publish the holiday calendar.</p>
          </div>
        </header>

        <div className="content-tabs">
          <button type="button" className={`content-tab ${tab === "timetable" ? "active" : ""}`} onClick={() => setTab("timetable")}>
            📅 Batch Timetable
          </button>
          <button type="button" className={`content-tab ${tab === "holidays" ? "active" : ""}`} onClick={() => setTab("holidays")}>
            🎉 Holiday Calendar
          </button>
        </div>

        {msg && <div className="auth-alert auth-alert-error" style={{ marginBottom: 16 }}>{msg}</div>}

        {tab === "timetable" && (
          <>
            <div className="tt-batch-tabs">
              {BATCH_PROGRAMS.map((b) => (
                <button
                  key={b.id}
                  type="button"
                  className={`tt-batch-tab tt-batch-tab-${b.theme} ${batchId === b.id ? "active" : ""}`}
                  onClick={() => setBatchId(b.id)}
                >
                  <span>{b.icon}</span>
                  <strong>{b.title}</strong>
                  <small>{b.timing}</small>
                </button>
              ))}
            </div>

            {selectedBatch && (
              <div className={`tt-batch-banner tt-theme-${selectedBatch.theme}`}>
                <strong>{selectedBatch.icon} {selectedBatch.title}</strong>
                <span>{selectedBatch.eyebrow} · {selectedBatch.timing} · Mon–Sat</span>
              </div>
            )}

            <div className="tt-admin-grid">
              <div className="tt-form-card">
                <h3>Add Class Slot</h3>
                <div className="tt-form-grid">
                  <label>
                    Day
                    <select value={slotForm.dayOfWeek} onChange={(e) => setSlotForm({ ...slotForm, dayOfWeek: Number(e.target.value) })}>
                      {DAY_NAMES.map((d, i) => (
                        <option key={d} value={i + 1}>{d}</option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Start
                    <input type="time" value={slotForm.startTime} onChange={(e) => setSlotForm({ ...slotForm, startTime: e.target.value })} />
                  </label>
                  <label>
                    End
                    <input type="time" value={slotForm.endTime} onChange={(e) => setSlotForm({ ...slotForm, endTime: e.target.value })} />
                  </label>
                  <label>
                    Subject
                    <input value={slotForm.subject} onChange={(e) => setSlotForm({ ...slotForm, subject: e.target.value })} placeholder="e.g. Physics" />
                  </label>
                  <label>
                    Teacher
                    <input value={slotForm.teacher} onChange={(e) => setSlotForm({ ...slotForm, teacher: e.target.value })} placeholder="Optional" />
                  </label>
                  <label>
                    Room
                    <input value={slotForm.room} onChange={(e) => setSlotForm({ ...slotForm, room: e.target.value })} placeholder="Optional" />
                  </label>
                </div>
                <button type="button" className="btn btn-outline" onClick={addSlot}>+ Add Slot</button>
              </div>

              <div className="tt-slots-list-card">
                <h3>Current Slots ({slots.length})</h3>
                {slots.length === 0 ? (
                  <p className="tt-muted">No slots yet. Add classes above.</p>
                ) : (
                  <ul className="tt-slots-list">
                    {slots.map((s, i) => (
                      <li key={`${s.dayOfWeek}-${s.startTime}-${i}`}>
                        <span>{DAY_NAMES[s.dayOfWeek - 1]} · {s.startTime}–{s.endTime}</span>
                        <strong>{s.subject}</strong>
                        <button type="button" className="tt-remove-btn" onClick={() => removeSlot(i)}>✕</button>
                      </li>
                    ))}
                  </ul>
                )}
                <button type="button" className="btn btn-primary" onClick={saveTimetable} disabled={loading}>
                  {loading ? "Saving..." : "Save Timetable"}
                </button>
              </div>
            </div>

            <div className="tt-preview-section">
              <h2 className="tt-preview-title">Preview</h2>
              <TimetableWeekGrid week={week} batch={batch || selectedBatch} />
            </div>
          </>
        )}

        {tab === "holidays" && (
          <div className="tt-holiday-admin">
            <form className="tt-form-card tt-holiday-form" onSubmit={saveHoliday}>
              <h3>Add Holiday</h3>
              <div className="tt-form-grid">
                <label className="tt-form-full">
                  Title
                  <input value={holidayForm.title} onChange={(e) => setHolidayForm({ ...holidayForm, title: e.target.value })} placeholder="e.g. Diwali Holiday" required />
                </label>
                <label>
                  Start Date
                  <input type="date" value={holidayForm.date} onChange={(e) => setHolidayForm({ ...holidayForm, date: e.target.value })} required />
                </label>
                <label>
                  End Date
                  <input type="date" value={holidayForm.endDate} onChange={(e) => setHolidayForm({ ...holidayForm, endDate: e.target.value })} />
                </label>
                <label className="tt-form-full">
                  Description
                  <input value={holidayForm.description} onChange={(e) => setHolidayForm({ ...holidayForm, description: e.target.value })} placeholder="Optional note for students" />
                </label>
              </div>
              <div className="tt-holiday-batches">
                <span>Applies to:</span>
                {HOLIDAY_BATCH_OPTIONS.map((b) => (
                  <label key={b.id} className="tt-batch-check">
                    <input
                      type="checkbox"
                      checked={holidayForm.batches.includes(b.id)}
                      onChange={() => toggleHolidayBatch(b.id)}
                    />
                    {b.label}
                  </label>
                ))}
              </div>
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? "Adding..." : "Add Holiday"}
              </button>
            </form>

            <div className="tt-holiday-list-wrap">
              <div className="tt-holiday-list-head">
                <h3>Holiday Calendar {holidayYear}</h3>
                <select value={holidayYear} onChange={(e) => setHolidayYear(Number(e.target.value))}>
                  {[holidayYear - 1, holidayYear, holidayYear + 1].map((y) => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>
              <HolidayCalendar holidays={holidays} showBatch />
              <ul className="tt-holiday-admin-actions">
                {holidays.map((h) => (
                  <li key={h._id}>
                    <span>{new Date(h.date).toLocaleDateString("en-IN")} — {h.title}</span>
                    <button type="button" className="tt-remove-btn" onClick={() => deleteHoliday(h._id)}>Delete</button>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
