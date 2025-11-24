"use client";

import React, { useEffect, useState } from "react";
import { getNews, addNews, deleteNews, updateNewsStatus } from "@/lib/api";
import { getMockRole } from "@/lib/mockRole";

type NewsItem = {
  id: number;
  content: string;
  created_at?: string;
  status?: boolean;
};

export default function NewsPage() {
  const [items, setItems] = useState<NewsItem[]>([]);
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [role, setRole] = useState<"user" | "super" | null>(null);
  const isSuper = role === "super";

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

  function fmtDate(s?: string) {
    if (!s) return "-";
    try {
      const d = new Date(s);
      return d.toLocaleString();
    } catch {
      return s;
    }
  }

  async function handleAdd(e?: React.FormEvent) {
    if (e) e.preventDefault();
    setError(null);

    if (!content.trim()) {
      setError("Please enter news content.");
      return;
    }

    setSaving(true);
    try {
      await addNews(content.trim());
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

  // super user: delete (hard delete)
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
        <label style={{ fontWeight: 700, color: "#c22053" }}>News Content: <span style={{ color: "red" }}>*</span></label>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={4}
          className="input"
          style={{ marginTop: 8 }}
          placeholder="Enter news..."
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
                  <td style={{ whiteSpace: "pre-wrap" }}>{it.content}</td>
                  <td>{fmtDate(it.created_at)}</td>
                  <td>
                    {isSuper ? (
                      it.status ? (
                        // status === true → only Delete
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
                        // status === false → only Approve
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
                      // NORMAL USER VIEW: only badge
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
