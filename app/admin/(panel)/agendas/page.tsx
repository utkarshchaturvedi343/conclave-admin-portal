"use client";

import React, { useEffect, useState, useRef } from "react";
import {
    API_BASE,
    getAgendas,
    addAgenda,
    deleteAgenda,
    editAgenda,
} from "@/lib/api";
import { getMockRole } from "@/lib/mockRole";

type AgendaItem = {
    id: number;
    title: string;
    description?: string;
    datetime?: string;
    location?: string;
    image_url?: File | null;
    status?: boolean;
};

const TITLE_MAX_LENGTH = 20;
const DESCRIPTION_MAX_LENGTH = 200;
const LOCATION_MAX_LENGTH = 20;

export default function AgendasPage() {
    const imageInputRef = useRef<HTMLInputElement | null>(null);

    const [items, setItems] = useState<AgendaItem[]>([]);

    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [datetime, setDatetime] = useState(""); // yyyy-MM-ddTHH:mm
    const [location, setLocation] = useState("");
    const [imageFile, setImageFile] = useState<File | null>(null);

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [role, setRole] = useState<"user" | "super" | null>(null);
    const isSuper = role === "super";

    const [minDateTime, setMinDateTime] = useState<string>("");

    // editing state
    const [editingId, setEditingId] = useState<number | null>(null);
    const [editingTitle, setEditingTitle] = useState<string>("");
    const [editingDescription, setEditingDescription] = useState<string>("");
    const [editingDateTime, setEditingDateTime] = useState("");
    const [editingLocation, setEditingLocation] = useState<string>("");
    const [editingImageUrl, setEditingImageUrl] = useState<File | null>(null);

    // ---------- helpers ----------

    function normalizeAgenda(a: any): AgendaItem {
        const raw =
            a.status ?? a.approved ?? a.is_approved ?? a.registration_Status;
        let statusBool: boolean;

        if (raw === undefined || raw === null) {
            statusBool = false;
        } else if (typeof raw === "boolean") {
            statusBool = raw;
        } else if (typeof raw === "number") {
            statusBool = raw === 1;
        } else if (typeof raw === "string") {
            const s = raw.trim().toLowerCase();
            statusBool = s === "1" || s === "true";
        } else {
            statusBool = false;
        }

        return {
            id: Number(a.id),
            title: a.title ?? "",
            description: a.description ?? a.desc ?? "",
            datetime: a.datetime ?? a.date_time ?? a.dateTime ?? "",
            location: a.location ?? a.place ?? "",
            image_url: a.image_url ?? a.image ?? null,
            status: statusBool,
        };
    }

    function fmtDateTime(s?: string) {
        if (!s) return "-";
        try {
            const d = new Date(s);
            const date = d.toLocaleDateString();
            const time = d.toLocaleTimeString();
            return `${date} ${time}`;
        } catch {
            return s;
        }
    }

    function formatDateTimeLocal(d: Date) {
        const pad = (n: number) => n.toString().padStart(2, "0");
        const year = d.getFullYear();
        const month = pad(d.getMonth() + 1);
        const day = pad(d.getDate());
        const hours = pad(d.getHours());
        const minutes = pad(d.getMinutes());
        return `${year}-${month}-${day}T${hours}:${minutes}`;
    }

    // strip special characters: only letters, numbers, spaces
    function sanitizeText(value: string) {
        value.trim();
        value.replace(/<[^>]*>/g, "");
        return value.replace(/[^A-Za-z0-9\s]/g, "");
    }

    async function reload() {
        setLoading(true);
        setError(null);
        try {
            const data = await getAgendas();
            const arr = Array.isArray(data) ? data.map(normalizeAgenda) : [];
            setItems(arr);
        } catch (err) {
            console.error(err);
            setError("Failed to load agendas.");
        } finally {
            setLoading(false);
        }
    }

    // ---------- load data & role ----------

    useEffect(() => {
        const r = getMockRole();
        setRole(r ?? "user");

        // set min datetime to current time (no seconds)
        const now = new Date();
        now.setSeconds(0, 0);
        setMinDateTime(formatDateTimeLocal(now));

        reload();
    }, []);

    // ---------- actions ----------

    async function handleAdd(e: React.FormEvent) {
        e.preventDefault();
        setError(null);

        // sanitize again before validating
        const cleanTitle = sanitizeText(title);
        const cleanDesc = sanitizeText(description);
        const cleanLocation = sanitizeText(location);

        if (!cleanTitle.trim()) {
            setError("Please enter title (no special characters).");
            return;
        }
        if (!cleanDesc.trim()) {
            setError("Please enter description (no special characters).");
            return;
        }
        if (!datetime) {
            setError("Please select date & time.");
            return;
        }
        if (!cleanLocation.trim()) {
            setError("Please enter location (no special characters).");
            return;
        }

        // date/time should not be in the past
        try {
            const selected = new Date(datetime);
            const now = new Date();
            if (selected < now) {
                setError("Date & time cannot be in the past.");
                return;
            }
        } catch {
            setError("Invalid date & time.");
            return;
        }

        setSaving(true);
        try {
            const fd = new FormData();
            fd.append("title", cleanTitle.trim());
            fd.append("description", cleanDesc.trim());
            fd.append("datetime", datetime);
            fd.append("location", cleanLocation.trim());
            if (imageFile) fd.append("image", imageFile);

            await addAgenda(fd);
            await reload();

            setTitle("");
            setDescription("");
            setDatetime("");
            setLocation("");
            setImageFile(null);
            if (imageInputRef.current) {
                imageInputRef.current.value = "";
            }
        } catch (err: any) {
            console.error(err);
            setError(
                err?.message ? String(err.message) : "Failed to add agenda."
            );
        } finally {
            setSaving(false);
        }
    }

    // Approve = toggle status using deleteAgenda() (which calls /updateStatus/:id)
    async function handleApprove(id: number, currentStatus?: boolean) {
        const confirmText = currentStatus
            ? "This agenda is already approved. Approve again?"
            : "Approve this agenda?";
        if (!confirm(confirmText)) return;

        setError(null);
        try {
            await deleteAgenda(id); // hits /admin/agendas/updateStatus/:id
            await reload();
        } catch (err) {
            console.error(err);
            setError("Failed to approve agenda.");
        }
    }

    // Delete = call real delete endpoint directly
    async function handleDelete(id: number) {
        if (!confirm("Are you sure you want to delete this agenda?")) return;
        setError(null);
        try {
            const res = await fetch(`${API_BASE}/admin/agendas/delete/${id}`, {
                method: "POST",
                credentials: "include",
                mode: "cors",
            });
            if (!res.ok) {
                const txt = await res.text().catch(() => "");
                throw new Error(txt || "Failed to delete agenda");
            }
            setItems((prev) => prev.filter((a) => a.id !== id));
        } catch (err) {
            console.error(err);
            setError("Failed to delete agenda.");
        }
    }

    // ----- edit flow (validation same as add) -----
    function startEdit(it: AgendaItem) {
        setEditingId(it.id);
        setEditingTitle(it.title ?? "");
        setEditingDescription(it.description ?? "");
        setEditingDateTime(it.datetime ?? "");
        setEditingImageUrl(it.image_url ?? null);
        setEditingLocation(it.location ?? "")
        setError(null);
    }

    function cancelEdit() {
        setEditingId(null);
        setEditingDateTime("");
        setEditingDescription("");
        setEditingImageUrl(null);
        setEditingLocation("");
        setEditingTitle("");
        setError(null);
    }

    async function saveEdit(id: number) {
        setError(null);

        const cleanedDescrition = sanitizeText(editingDescription);
        const cleanedLocation = sanitizeText(editingLocation);
        const cleanedTitle = sanitizeText(editingTitle);

        if (!cleanedDescrition) {
            setError("Please enter Description without any special characters.");
            return;
        }

        if (!cleanedLocation) {
            setError("Please enter Location without any special characters.");
            return;
        }

        if (!cleanedTitle) {
            setError("Please enter Title without any special characters.");
            return;
        }

        if (!editingDateTime) return setError("Date & time required.");

        setSaving(true);
        try {
            const fd = new FormData();
            fd.append("id", String(id));
            fd.append("title", cleanedTitle.trim());
            fd.append("description", cleanedDescrition.trim());
            fd.append("datetime", datetime);
            fd.append("location", cleanedLocation.trim());
            if (editingImageUrl) fd.append("image", editingImageUrl);
            await addAgenda(fd);

            const data = await getAgendas();
            const arr = Array.isArray(data) ? data.map(normalizeAgenda) : [];
            setItems(arr);

            setItems((prev) => prev.map((p) => (p.id === id ? { ...p, status: false } : p)));

            cancelEdit();
        } catch (err: any) {
            console.error(err);
            setError(err?.message ? String(err.message) : "Failed to update Agenda.");
        } finally {
            setSaving(false);
        }
    }

    // ---------- UI ----------

    return (
        <section style={{ padding: "24px 32px" }}>
            <div
                style={{
                    maxWidth: 900,
                    margin: "0 auto",
                    background:
                        "linear-gradient(180deg, rgba(255,255,255,0.9), rgba(255,255,255,0.95))",
                    borderRadius: 18,
                    boxShadow: "0 18px 45px rgba(0,0,0,0.18)",
                    padding: 24,
                }}
            >
                <h2
                    style={{
                        fontSize: 22,
                        marginBottom: 16,
                        fontWeight: 700,
                        color: "#c22053",
                        borderBottom: "2px solid rgba(194,32,83,0.25)",
                        paddingBottom: 8,
                    }}
                >
                    Agendas
                </h2>

                {error && (
                    <div
                        style={{
                            marginBottom: 16,
                            padding: 10,
                            borderRadius: 6,
                            background: "#fff6f6",
                            border: "1px solid #ffcccc",
                            color: "#900",
                        }}
                    >
                        {error}
                    </div>
                )}

                {(
                    <form onSubmit={handleAdd} style={{ marginBottom: 20 }}>
                        <div style={{ marginBottom: 10 }}>
                            <label style={{ fontWeight: 700, color: "#c22053" }}>
                                Title: <span style={{ color: "red" }}>*</span>
                            </label>
                            <input
                                type="text"
                                className="input"
                                style={{ marginTop: 6, width: "100%" }}
                                placeholder="Title"
                                value={title}
                                maxLength={TITLE_MAX_LENGTH}
                                onChange={(e) => setTitle(sanitizeText(e.target.value))}
                            />
                        </div>

                        <div style={{ marginBottom: 10 }}>
                            <label style={{ fontWeight: 700, color: "#c22053", resize: "vertical", maxHeight: "200px" }}>
                                Description: <span style={{ color: "red" }}>*</span>
                            </label>
                            <textarea
                                className="input"
                                style={{
                                    marginTop: 6, width: "100%", minHeight: 70, resize: "vertical", maxHeight: "180px", overflow: "hidden",
                                }}
                                placeholder="Description"
                                value={description}
                                maxLength={DESCRIPTION_MAX_LENGTH}

                                onChange={(e) =>
                                    setDescription(sanitizeText(e.target.value))
                                }
                            />
                        </div>

                        <div style={{ marginBottom: 10 }}>
                            <label style={{ fontWeight: 700, color: "#c22053" }}>
                                Date &amp; Time: <span style={{ color: "red" }}>*</span>
                            </label>
                            <input
                                type="datetime-local"
                                className="input"
                                style={{ marginTop: 6, width: "100%" }}
                                value={datetime}
                                min={minDateTime} // cannot choose before now
                                onChange={(e) => setDatetime(e.target.value)}
                            />
                        </div>

                        <div style={{ marginBottom: 10 }}>
                            <label style={{ fontWeight: 700, color: "#c22053" }}>
                                Location: <span style={{ color: "red" }}>*</span>
                            </label>
                            <input
                                type="text"
                                className="input"
                                style={{ marginTop: 6, width: "100%" }}
                                placeholder="Location"
                                value={location}
                                maxLength={LOCATION_MAX_LENGTH}
                                onChange={(e) =>
                                    setLocation(sanitizeText(e.target.value))
                                }
                            />
                        </div>

                        <div style={{ marginBottom: 14 }}>
                            <label style={{ fontWeight: 700, color: "#c22053" }}>
                                Image:
                            </label>
                            <input
                                ref={imageInputRef}
                                type="file"
                                accept="image/*"
                                style={{ marginTop: 6 }}
                                onChange={(e) => {
                                    const file = e.target.files?.[0] || null;
                                    if (!file) {
                                        setImageFile(null);
                                        return;
                                    }
                                    if (!file.type.startsWith("image/")) {
                                        setError(
                                            "Please select a valid image file (jpg, png, etc.)."
                                        );
                                        setImageFile(null);
                                        e.target.value = ""; // clear input
                                        return;
                                    }
                                    setError("nulls");
                                    setImageFile(file);
                                }}
                            />
                        </div>

                        <button
                            type="submit"
                            className="btn btn-primary"
                            disabled={saving}
                        >
                            {saving ? "Adding…" : "Add Agenda"}
                        </button>
                    </form>
                )}

                {/* Existing agendas */}
                <h3
                    style={{
                        marginTop: isSuper ? 10 : 0,
                        marginBottom: 8,
                        fontWeight: 700,
                        color: "#c22053",
                    }}
                >
                    Existing Agendas
                </h3>

                {loading ? (
                    <div>Loading agendas…</div>
                ) : items.length === 0 ? (
                    <div style={{ color: "#666" }}>No agendas found.</div>
                ) : (
                    <table>
                        <thead>
                            <tr>
                                <th style={{ width: 50 }}>S.No</th>
                                <th style={{ width: 90 }}>Image</th>
                                <th>Title</th>
                                <th style={{ width: 220 }}>Date/Time</th>
                                <th style={{ width: 160 }}>Location</th>
                                <th style={{ width: 140 }}>
                                    {isSuper ? "Actions" : "Status"}
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {items.map((a) => (
                                <tr key={a.id}>
                                    <td>{a.id}</td>
                                    <td>
                                        {editingId === a.id ? (
                                            <div
                                                style={{
                                                    minHeight: "60px",
                                                    minWidth: "100px",
                                                    display: "flex",
                                                    alignItems: "center",
                                                    padding: "6px",
                                                    border: "1px solid #ddd",
                                                    borderRadius: "6px",
                                                    background: "#fafafa",
                                                }}
                                            >
                                                <input
                                                    type="file"
                                                    accept="image/*"
                                                    style={{
                                                        width: "100%",
                                                        padding: "6px",
                                                        cursor: "pointer",
                                                    }}
                                                    onChange={(e) => {
                                                        const file = e.target.files?.[0] || null;
                                                        if (!file) {
                                                            setEditingImageUrl(null);
                                                            return;
                                                        }
                                                        if (!file.type.startsWith("image/")) {
                                                            setError("Please select a valid image file (jpg, png, etc.).");
                                                            setImageFile(null);
                                                            e.target.value = "";
                                                            return;
                                                        }
                                                        setError(null);
                                                        setEditingImageUrl(file);
                                                    }}
                                                />
                                            </div>
                                        ) : a.image_url ? (
                                            <img
                                                src={a.image_url}
                                                alt={a.title}
                                                style={{
                                                    maxHeight: 40,
                                                    maxWidth: 70,
                                                    objectFit: "cover",
                                                    borderRadius: 4,
                                                    border: "1px solid #eee",
                                                }}
                                            />
                                        ) : (
                                            "-"
                                        )}
                                    </td>
                                    <td>
                                        {editingId === a.id ? (
                                            <textarea
                                                style={{
                                                    // resize: "vertical",
                                                    width: "100%",
                                                    minHeight: 70,
                                                    maxHeight: "180px",
                                                    overflow: "hidden",
                                                    minWidth: 100,
                                                    maxWidth: "180px"
                                                }}
                                                rows={4}
                                                value={editingTitle}
                                                maxLength={TITLE_MAX_LENGTH}
                                                onChange={(e) => setEditingTitle(sanitizeText(e.target.value))}
                                            />
                                        ) : (
                                            a.title
                                        )}
                                    </td>
                                    <td>
                                        {editingId === a.id ? (
                                            <input
                                                type="datetime-local"
                                                style={{ width: "100%" }}
                                                value={editingDateTime}
                                                min={minDateTime}
                                                onChange={(e) => setEditingDateTime(e.target.value)}
                                            />
                                        ) : (
                                            fmtDateTime(a.datetime)
                                        )}
                                    </td>
                                    <td>
                                        {editingId === a.id ? (
                                            <input
                                                type="text"
                                                value={editingLocation}
                                                maxLength={LOCATION_MAX_LENGTH}
                                                style={{ width: "100%" }}
                                                onChange={(e) => setEditingLocation(sanitizeText(e.target.value))}
                                            />
                                        ) : (
                                            a.location || "-"
                                        )}
                                    </td>
                                    <td>
                                        {isSuper ? (
                                            a.status ? (
                                                <button
                                                    className="btn"
                                                    style={{
                                                        background: "#fff",
                                                        color: "#c22053",
                                                        border: "1px solid rgba(194,32,83,0.12)",
                                                        padding: "6px 10px",
                                                        borderRadius: 8,
                                                    }}
                                                    onClick={() => handleDelete(a.id)}
                                                >
                                                    Delete
                                                </button>
                                            ) : (
                                                <button
                                                    className="btn"
                                                    style={{
                                                        background: "#fff",
                                                        color: "#2b2b2b",
                                                        border: "1px solid rgba(194,32,83,0.12)",
                                                        padding: "6px 10px",
                                                        borderRadius: 8,
                                                    }}
                                                    onClick={() => handleApprove(a.id, a.status)}
                                                >
                                                    Approve
                                                </button>
                                            )
                                        ) : editingId === a.id ? (
                                            <div style={{ display: "flex", gap: 8 }}>
                                                <button
                                                    className="btn btn-primary"
                                                    onClick={() => saveEdit(a.id)}
                                                    disabled={saving}
                                                >
                                                    {saving ? "Saving…" : "Save"}
                                                </button>

                                                <button
                                                    className="btn"
                                                    onClick={cancelEdit}
                                                    style={{ background: "#fff", color: "#c22053" }}
                                                >
                                                    Cancel
                                                </button>
                                            </div>
                                        ) : (
                                            // <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                                            //     <span
                                            //         style={{
                                            //             padding: "6px 10px",
                                            //             borderRadius: 8,
                                            //             background: a.status ? "#e6fff2" : "#fff6f6",
                                            //             color: a.status ? "#0a7a3f" : "#b30000",
                                            //         }}
                                            //     >
                                            //         {a.status ? "Approved" : "Pending"}
                                            //     </span>

                                            //     <button
                                            //         className="btn"
                                            //         style={{
                                            //             background: "#fff",
                                            //             color: "#2b2b2b",
                                            //             border: "1px solid rgba(0,0,0,0.06)",
                                            //             padding: "6px 10px",
                                            //             borderRadius: 8,
                                            //         }}
                                            //         onClick={() => startEdit(a)}
                                            //     >
                                            //         Edit
                                            //     </button>
                                            // </div>
                                            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                                                <span
                                                    style={{
                                                        padding: "6px 10px",
                                                        borderRadius: 8,
                                                        background: a.status ? "#e6fff2" : "#fff6f6",
                                                        color: a.status ? "#0a7a3f" : "#b30000",
                                                    }}
                                                >
                                                    {a.status ? "Approved" : "Pending"}
                                                </span>

                                                {editingId === null || editingId === a.id ? (
                                                    <button
                                                        className="btn"
                                                        style={{
                                                            background: "#fff",
                                                            color: "#2b2b2b",
                                                            border: "1px solid rgba(0,0,0,0.06)",
                                                            padding: "6px 10px",
                                                            borderRadius: 8,
                                                        }}
                                                        onClick={() => startEdit(a)}
                                                    >
                                                        Edit
                                                    </button>
                                                ) : null}
                                            </div>
                                        )}
                                    </td>

                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </section>
    );
}
