"use client";

import React, { useEffect, useState } from "react";
import { getNews, addNews, deleteNews, updateNewsStatus, editNews } from "@/lib/api";
import { getMockRole } from "@/lib/mockRole";

type NewsItem = {
  id: number;
  content: string;
  created_at?: string;
  status?: boolean;
};

const NEWS_MAX_LENGTH = 200;

export default function NewsPage() {
  const [items, setItems] = useState<NewsItem[]>([]);
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [role, setRole] = useState<"user" | "super" | null>(null);
  const isSuper = role === "super";

  // editing state
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingContent, setEditingContent] = useState<string>("");

  function normalizeNews(n: any): NewsItem {
    const raw = n.status ?? n.approved ?? n.is_approved ?? n.registation_Status;
    let statusBool: boolean | undefined = undefined;

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
      id: Number(n.id),
      content: n.content ?? "",
      created_at: n.created_at,
      status: statusBool,
    };
  }

  function fmtDate(s?: string) {
    if (!s) return "-";
    try {
      const d = new Date(s);
      return d.toLocaleString();
    } catch {
      return s;
    }
  }

  // Remove HTML tags and trim. This is safer than allowing raw HTML in content.
  function stripHtmlTags(input: string) {
    return input.replace(/<[^>]*>/g, "");
  }

  // sanitize and basic validation for news content
  function sanitizeNewsContent(raw: string) {
    // 1) remove tags
    const noTags = stripHtmlTags(raw);
    // 2) normalize whitespace and trim
    const normalized = noTags.replace(/\s+/g, " ").trim();
    return normalized;
  }

  useEffect(() => {
    let mounted = true;

    const r = getMockRole();
    setRole(r ?? "user");

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const data = await getNews();
        const arr = Array.isArray(data) ? data.map(normalizeNews) : [];
        if (mounted) setItems(arr);
      } catch (err) {
        console.error(err);
        if (mounted) setError("Failed to load news.");
      } finally {
        if (mounted) setLoading(false);
      }
    }

    load();
    return () => {
      mounted = false;
    };
  }, []);

  async function handleAdd(e?: React.FormEvent) {
    if (e) e.preventDefault();
    setError(null);

    const cleaned = sanitizeNewsContent(content);

    if (!cleaned) {
      setError("Please enter news content (no special characters).");
      return;
    }

    if (cleaned.length > NEWS_MAX_LENGTH) {
      setError(`News content must be ${NEWS_MAX_LENGTH} characters or less.`);
      return;
    }

    setSaving(true);
    try {
      await addNews(cleaned);
      const data = await getNews();
      setItems(Array.isArray(data) ? data.map(normalizeNews) : []);
      setContent("");
    } catch (err: any) {
      console.error(err);
      setError(err?.message ? String(err.message) : "Failed to add news.");
    } finally {
      setSaving(false);
    }
  }

  async function handleApprove(id: number, currentStatus?: boolean) {
    const confirmText = currentStatus
      ? "This news is already approved. Approve again?"
      : "Approve this news item?";
    if (!confirm(confirmText)) return;

    setError(null);
    try {
      await updateNewsStatus(id);
      const data = await getNews();
      setItems(Array.isArray(data) ? data.map(normalizeNews) : []);
    } catch (err) {
      console.error(err);
      setError("Failed to approve news.");
    }
  }

  async function handleDelete(id: number) {
    if (!confirm("Are you sure you want to delete this news?")) return;
    setError(null);
    try {
      await deleteNews(id);
      setItems((prev) => prev.filter((p) => p.id !== id));
    } catch (err) {
      console.error(err);
      setError("Failed to delete news.");
    }
  }

  // ----- edit flow (validation same as add) -----
  function startEdit(it: NewsItem) {
    setEditingId(it.id);
    setEditingContent(it.content ?? "");
    setError(null);
  }

  function cancelEdit() {
    setEditingId(null);
    setEditingContent("");
    setError(null);
  }

  async function saveEdit(id: number) {
    setError(null);

    const cleaned = sanitizeNewsContent(editingContent);

    if (!cleaned) {
      setError("Please enter news content (no special characters).");
      return;
    }
    if (cleaned.length > NEWS_MAX_LENGTH) {
      setError(`News content must be ${NEWS_MAX_LENGTH} characters or less.`);
      return;
    }

    setSaving(true);
    try {
      // call backend helper; backend should set status=false on edit
      await editNews(id, cleaned);

      // refresh items from server
      const data = await getNews();
      const arr = Array.isArray(data) ? data.map(normalizeNews) : [];
      setItems(arr);

      // Safety: ensure edited item shows pending in UI even if backend forgot
      setItems((prev) => prev.map((p) => (p.id === id ? { ...p, status: false } : p)));

      cancelEdit();
    } catch (err: any) {
      console.error(err);
      setError(err?.message ? String(err.message) : "Failed to update news.");
    } finally {
      setSaving(false);
    }
  }

  // ----- UI -----
  return (
    <section>
      <h2>News</h2>

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

      <form onSubmit={handleAdd} style={{ marginBottom: 20 }}>
        <label style={{ fontWeight: 700, color: "#c22053" }}>
          News Content: <span style={{ color: "red" }}>*</span>
        </label>
        <textarea
          style={{
            width: "100%",
            minHeight: 70,
            maxHeight: "180px",
            overflow: "hidden",
            resize: "vertical",
            marginTop: 8
          }}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={4}
          className="input"
          placeholder="Enter news..."
          maxLength={NEWS_MAX_LENGTH}
        />
        <div style={{ marginTop: 12 }}>
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? "Adding…" : "Add News"}
          </button>
        </div>
      </form>

      {/* List */}
      <div>
        {loading ? (
          <div>Loading news…</div>
        ) : items.length === 0 ? (
          <div style={{ color: "#666" }}>No news found.</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th style={{ width: 80 }}>ID</th>
                <th>Content</th>
                <th style={{ width: 220 }}>Created At</th>
                <th style={{ width: 220 }}>{isSuper ? "Actions" : "Status"}</th>
              </tr>
            </thead>
            <tbody>
              {items.map((it) => (
                <tr key={it.id}>
                  <td>{it.id}</td>
                  <td style={{ whiteSpace: "pre-wrap", maxWidth: 600 }}>
                    {editingId === it.id ? (
                      <div>
                        <textarea
                          value={editingContent}
                          rows={4}
                          style={{
                            width: "100%",
                            minHeight: 70,
                            maxHeight: "180px",
                            overflow: "hidden",
                            resize: "vertical",
                            // scrollbarGutter:"auto"
                          }}
                          onChange={(e) => setEditingContent(e.target.value)}
                          maxLength={NEWS_MAX_LENGTH}
                        />
                        <div style={{ marginTop: 8, display: "flex", gap: 8 }}>
                          <button
                            className="btn btn-primary"
                            onClick={(e) => {
                              e.preventDefault();
                              saveEdit(it.id);
                            }}
                            disabled={saving}
                          >
                            {saving ? "Saving…" : "Save"}
                          </button>
                          <button
                            className="btn"
                            onClick={(e) => {
                              e.preventDefault();
                              cancelEdit();
                            }}
                            style={{ background: "#fff", color: "#c22053" }}
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div>{it.content}</div>
                    )}
                  </td>
                  <td>{fmtDate(it.created_at)}</td>
                  <td>
                    {isSuper ? (
                      it.status ? (
                        <button
                          className="btn"
                          style={{
                            background: "#fff",
                            color: "#c22053",
                            border: "1px solid rgba(194,32,83,0.12)",
                            padding: "6px 10px",
                            borderRadius: 8,
                          }}
                          onClick={() => handleDelete(it.id)}
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
                          onClick={() => handleApprove(it.id, it.status)}
                        >
                          Approve
                        </button>
                      )
                    ) : (
                      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                        <span
                          style={{
                            padding: "6px 10px",
                            borderRadius: 8,
                            background: it.status ? "#e6fff2" : "#fff6f6",
                            color: it.status ? "#0a7a3f" : "#b30000",
                          }}
                        >
                          {it.status ? "Approved" : "Pending"}
                        </span>

                        {editingId === null || editingId === it.id ? (
                          <button
                            className="btn"
                            style={{
                              background: "#fff",
                              color: "#2b2b2b",
                              border: "1px solid rgba(0,0,0,0.06)",
                              padding: "6px 10px",
                              borderRadius: 8,
                            }}
                            onClick={() => startEdit(it)}
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
