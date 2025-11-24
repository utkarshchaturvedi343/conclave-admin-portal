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

    // role (same pattern as UsersPage)
    const [role, setRole] = useState<"user" | "super" | null>(null);
    const isSuper = role === "super";

    // single video form state
    const [title, setTitle] = useState("");
    const [caption, setCaption] = useState("");
    const [url, setUrl] = useState("");

    const [actionLoadingId, setActionLoadingId] = useState<number | null>(null);

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
            // try multiple possible backend keys for caption
            caption: item.caption ?? item.description ?? item.category ?? "",
            // try multiple possible backend keys for url
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

        if (!title.trim() || !url.trim()) {
            setError("Please provide at least a Video Title and Video URL.");
            return;
        }

        setSaving(true);
        try {
            // API expects: { title, speaker?, category?, url }
            await addVideo({
                title: title.trim(),
                category: caption.trim() || undefined,
                url: url.trim(),
            });

            const data = await getVideos();
            setVideos(Array.isArray(data) ? data.map(normalizeItem) : []);

            setTitle("");
            setCaption("");
            setUrl("");
        } catch (err: any) {
            console.error(err);
            setError(err?.message || "Failed to add video.");
        } finally {
            setSaving(false);
        }
    }

    // super user toggles status; backend negates current value
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
                        rows={3}
                    />

                    {/* URL */}
                    <label className="form-label" style={{ marginTop: 8 }}>
                        Video URL <span style={{ color: "red" }}>*</span>
                    </label>
                    <input
                        className="input"
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                        placeholder="Paste video URL"
                        required
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
                                    <td>{v.title}</td>
                                    <td>{v.caption}</td>
                                    <td>
                                        {v.url ? (
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
                                            <>
                                                {v.status ? (
                                                    <div style={{ display: "flex", gap: 8 }}>
                                                        <button
                                                            className="btn"
                                                            style={{ background: "#fff", color: "#c22053" }}
                                                            onClick={() => setStatus(v.id, false)}
                                                            disabled={actionLoadingId === v.id}
                                                        >
                                                            {actionLoadingId === v.id ? "..." : "Delete"}
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <div style={{ display: "flex", gap: 8 }}>
                                                        <button
                                                            className="btn"
                                                            style={{ background: "#fff", color: "#2b2b2b" }}
                                                            onClick={() => setStatus(v.id, true)}
                                                            disabled={actionLoadingId === v.id}
                                                        >
                                                            {actionLoadingId === v.id ? "..." : "Approve"}
                                                        </button>
                                                    </div>
                                                )}
                                            </>
                                        ) : (
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
