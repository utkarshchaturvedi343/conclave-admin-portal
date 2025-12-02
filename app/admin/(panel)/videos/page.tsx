"use client";

import React, { useEffect, useState } from "react";
import { getVideos, addVideo, updateVideoStatus } from "@/lib/api";
import { getMockRole } from "@/lib/mockRole";

type Video = {
    id: number;
    title?: string;
    caption?: string;
    url?: string;
    status?: boolean;
};

export default function VideosPage() {
    const [videos, setVideos] = useState<Video[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [role, setRole] = useState<"user" | "super" | null>(null);
    const isSuper = role === "super";

    const [title, setTitle] = useState("");
    const [caption, setCaption] = useState("");
    const [url, setUrl] = useState<File | null>(null);

    const [actionLoadingId, setActionLoadingId] = useState<number | null>(null);

    // Editing states
    const [editingId, setEditingId] = useState<number | null>(null);
    const [editingTitle, setEditingTitle] = useState("");
    const [editingCaption, setEditingCaption] = useState("");
    const [editingUrl, setEditingUrl] = useState<File | null>(null);

    function normalizeItem(item: any): Video {
        const raw = item.status;
        let statusBool: boolean | undefined = undefined;

        if (raw === undefined || raw === null) {
            statusBool = false;
        } else if (typeof raw === "boolean") {
            statusBool = raw;
        } else if (typeof raw === "number") {
            statusBool = raw === 1;
        } else if (typeof raw === "string") {
            const s = raw.trim();
            if (s === "1" || s.toLowerCase() === "true") statusBool = true;
            else statusBool = false;
        } else {
            statusBool = false;
        }

        return {
            id: Number(item.id),
            title: item.title ?? "",
            caption: item.caption ?? item.description ?? item.category ?? "",
            url: item.url ?? item.video_url ?? item.video ?? "",
            status: statusBool,
        };
    }

    // load videos + role (same pattern as UsersPage)
    useEffect(() => {
        let mounted = true;
        const r = getMockRole();
        setRole(r ?? "user");

        async function load() {
            setLoading(true);
            setError(null);
            try {
                const data = await getVideos();
                const arr = Array.isArray(data) ? data.map(normalizeItem) : [];
                if (mounted) setVideos(arr);
            } catch (err) {
                console.error(err);
                if (mounted) setError("Failed to load videos.");
            } finally {
                if (mounted) setLoading(false);
            }
        }

        load();
        return () => {
            mounted = false;
        };
    }, []);

    async function handleAddVideo(e?: React.FormEvent) {
        if (e) e.preventDefault();
        setError(null);

        if (!title.trim() || !url || !caption.trim()) {
            setError("Please fill in all the details.");
            return;
        }

        setSaving(true);
        try {
            await addVideo({
                title: title.trim(),
                category: caption.trim() || undefined,
                url: url,
            });

            const data = await getVideos();
            setVideos(Array.isArray(data) ? data.map(normalizeItem) : []);

            setTitle("");
            setCaption("");
            setUrl(null);
        } catch (err: any) {
            console.error(err);
            setError(err?.message || "Failed to add video.");
        } finally {
            setSaving(false);
        }
    }

    async function setStatus(id: number, newStatus: boolean) {
        const confirmText = newStatus ? "Approve this video?" : "Are you sure you want to delete this video?";
        if (!confirm(confirmText)) return;
        setError(null);
        setActionLoadingId(id);
        try {
            await updateVideoStatus(id);
            const data = await getVideos();
            setVideos(Array.isArray(data) ? data.map(normalizeItem) : []);
        } catch (err) {
            console.error(err);
            setError("Failed to update video status.");
        } finally {
            setActionLoadingId(null);
        }
    }

    function startEdit(v: Video) {
        setEditingId(v.id);
        setEditingTitle(v.title || "");
        setEditingCaption(v.caption || "");
        setEditingUrl(null); // no file yet
        setError(null);
    }

    function cancelEdit() {
        setEditingId(null);
        setEditingTitle("");
        setEditingCaption("");
        setEditingUrl(null);
        setError(null);
    }

    async function saveEdit(id: number) {
        if (!editingTitle.trim() || !editingCaption.trim()) {
            setError("Please fill all required fields.");
            return;
        }

        setSaving(true);
        try {
            const payload: any = {
                id,
                title: editingTitle.trim(),
                category: editingCaption.trim(),
            };
            if (editingUrl instanceof File) {
                payload.url = editingUrl;
            }
            await addVideo(payload);

            // Reload list
            const data = await getVideos();
            setVideos(Array.isArray(data) ? data.map(normalizeItem) : []);

            cancelEdit();
        } catch (err: any) {
            console.error(err);
            setError("Failed to update video.");
        } finally {
            setSaving(false);
        }
    }

    return (
        <section>
            <h2>Video Management</h2>

            {error && (
                <div
                    style={{
                        marginBottom: 12,
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

            {/* ---------- ADD SINGLE VIDEO ---------- */}
            <div style={{ marginBottom: 20 }}>

                <form
                    onSubmit={handleAddVideo}
                    style={{
                        background: "linear-gradient(135deg,#fff,#f9f5fc)",
                        padding: 16,
                        borderRadius: 8,
                        boxShadow: "0 2px 12px rgba(194,32,83,0.06)",
                    }}
                >
                    {/* Title */}
                    <label className="form-label">
                        Video Title <span style={{ color: "red" }}>*</span>
                    </label>
                    <input
                        className="input"
                        value={title}
                        maxLength={80}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="Enter video title"
                        required
                    />

                    {/* Caption */}
                    <label className="form-label" style={{ marginTop: 8 }}>
                        Video Caption: <span style={{ color: "red" }}>*</span>
                    </label>
                    <textarea
                        className="input"
                        value={caption}
                        maxLength={200}
                        onChange={(e) => setCaption(e.target.value)}
                        placeholder="Enter video caption/description"
                        required
                        rows={3}
                    />

                    {/* URL */}
                    <label className="form-label" style={{ marginTop: 8 }}>
                        Video URL <span style={{ color: "red" }}>*</span>
                    </label>
                    {/* <input
                        className="input"
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                        placeholder="Paste video URL"
                        required
                    /> */}
                    <input
                        type="file"
                        accept="video/*"
                        style={{ marginTop: 6 }}
                        onChange={(e) => {
                            const file = e.target.files?.[0] || null;
                            if (!file) {
                                setUrl(null);
                                return;
                            }
                            if (!file.type.startsWith("video/")) {
                                setError(
                                    "Please select a valid video file."
                                );
                                setUrl(null);
                                e.target.value = "";
                                return;
                            }
                            setError(null);
                            setUrl(file);
                        }}
                    />
                    <div style={{ marginTop: 12 }}>
                        <button className="btn btn-primary" type="submit" disabled={saving}>
                            {saving ? "Adding…" : "Add Video"}
                        </button>
                    </div>
                </form>
            </div>

            {/* ---------- VIDEOS TABLE ---------- */}
            <div>
                <h3 style={{ marginBottom: 8 }}>Uploaded Videos</h3>
                {loading ? (
                    <div>Loading videos…</div>
                ) : videos.length === 0 ? (
                    <div style={{ color: "#666" }}>No videos found.</div>
                ) : (
                    <table>
                        <thead>
                            <tr>
                                <th style={{ width: 40 }}>ID</th>
                                <th>Title</th>
                                <th>Caption</th>
                                <th>Video</th>
                                <th style={{ width: 180 }}>{isSuper ? "Actions" : "Status"}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {videos.map((v) => (
                                <tr key={v.id}>
                                    <td>{v.id}</td>
                                    {/* <td>{v.title}</td> */}
                                    <td>
                                        {editingId === v.id ? (
                                            <input
                                                className="input"
                                                style={{ width: "100%" }}
                                                value={editingTitle}
                                                onChange={(e) => setEditingTitle(e.target.value)}
                                            />
                                        ) : (
                                            v.title
                                        )}
                                    </td>
                                    {/* <td>{v.caption}</td> */}
                                    <td>
                                        {editingId === v.id ? (
                                            <input
                                                className="input"
                                                style={{
                                                    width: "100%",
                                                    resize: "vertical",
                                                    minHeight: 60,
                                                    maxHeight: 200,
                                                }}
                                                value={editingCaption}
                                                onChange={(e) => setEditingCaption(e.target.value)}
                                            />
                                        ) : (
                                            v.caption
                                        )}
                                    </td>
                                    {/* <td>
                                        {v.url ? (
                                            <video
                                                src={v.url}
                                                controls
                                                style={{ maxWidth: 180, borderRadius: 8 }}
                                            />
                                        ) : (
                                            "-"
                                        )}
                                    </td> */}
                                    <td>
                                        {editingId === v.id ? (
                                            <div
                                                style={{
                                                    minHeight: 60,
                                                    padding: 6,
                                                    border: "1px solid #ddd",
                                                    borderRadius: 6,
                                                    background: "#fafafa",
                                                }}
                                            >
                                                <input
                                                    type="file"
                                                    accept="video/*"
                                                    style={{ width: "100%", padding: 6 }}
                                                    onChange={(e) => {
                                                        const file = e.target.files?.[0] || null;
                                                        if (!file) {
                                                            setEditingUrl(null);
                                                            return;
                                                        }
                                                        if (!file.type.startsWith("video/")) {
                                                            setError("Please select a valid video file.");
                                                            setEditingUrl(null);
                                                            e.target.value = "";
                                                            return;
                                                        }
                                                        setError(null);
                                                        setEditingUrl(file);
                                                    }}
                                                />
                                            </div>
                                        ) : v.url ? (
                                            <video
                                                src={v.url}
                                                controls
                                                style={{ maxWidth: 180, borderRadius: 8 }}
                                            />
                                        ) : (
                                            "-"
                                        )}
                                    </td>
                                    <td>
                                        {isSuper ? (
                                            v.status ? (
                                                <button
                                                    className="btn"
                                                    style={{
                                                        background: "#fff",
                                                        color: "#c22053",
                                                        border: "1px solid rgba(194,32,83,0.12)",
                                                        padding: "6px 10px",
                                                        borderRadius: 8,
                                                    }}
                                                    onClick={() => updateVideoStatus(v.id)}
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
                                                    onClick={() => updateVideoStatus(v.id)}
                                                >
                                                    Approve
                                                </button>
                                            )
                                        ) : editingId === v.id ? (
                                            <div style={{ display: "flex", gap: 8 }}>
                                                <button
                                                    className="btn btn-primary"
                                                    onClick={() => saveEdit(v.id)}
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
                                                        background: v.status ? "#e6fff2" : "#fff6f6",
                                                        color: v.status ? "#0a7a3f" : "#b30000",
                                                    }}
                                                >
                                                    {v.status ? "Approved" : "Pending"}
                                                </span>

                                                {editingId === null || editingId === v.id ? (
                                                    <button
                                                        className="btn"
                                                        style={{
                                                            background: "#fff",
                                                            color: "#2b2b2b",
                                                            border: "1px solid rgba(0,0,0,0.06)",
                                                            padding: "6px 10px",
                                                            borderRadius: 8,
                                                        }}
                                                        onClick={() => startEdit(v)}
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
