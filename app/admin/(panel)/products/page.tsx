"use client";

import React, { useEffect, useState, useRef } from "react";
import {
    getProducts,
    addProduct,
    updateProductStatus,
    deleteVideo,
    editProduct,
} from "@/lib/api";
import { getMockRole } from "@/lib/mockRole";

type ProductItem = {
    id: number;
    name: string;
    image_url?: string | null;
    attachment_url?: string | null;
    created_at?: string;
    status?: boolean;
};

export default function ProductsPage() {
    const imageInputRef = useRef<HTMLInputElement | null>(null);
    const attachmentInputRef = useRef<HTMLInputElement | null>(null);

    const [items, setItems] = useState<ProductItem[]>([]);
    const [name, setName] = useState("");
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [attachmentFile, setAttachmentFile] =
        useState<File | null>(null);

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Editing states
    const [editingId, setEditingId] = useState<number | null>(null);
    const [editingName, setEditingName] = useState("");
    const [editingImageFile, setEditingImageFile] = useState<File | null>(null);
    const [editingAttachmentFile, setEditingAttachmentFile] = useState<File | null>(null);

    const [role, setRole] = useState<"user" | "super" | null>(null);
    const isSuper = role === "super";

    function normalizeProduct(p: any): ProductItem {
        const raw =
            p.status ?? p.approved ?? p.is_approved ?? p.registration_Status;
        let statusBool: boolean | undefined;

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
            id: Number(p.id),
            name: p.name ?? p.product_name ?? "",
            image_url: p.image_url ?? p.image ?? p.product_image ?? null,
            attachment_url:
                p.attachment_url ?? p.attachment ?? p.file_url ?? p.document ?? null,
            created_at: p.created_at ?? p.createdAt,
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

    async function reload() {
        setLoading(true);
        setError(null);
        try {
            const data = await getProducts();
            const arr = Array.isArray(data) ? data.map(normalizeProduct) : [];
            setItems(arr);
        } catch (err) {
            console.error(err);
            setError("Failed to load products.");
        } finally {
            setLoading(false);
        }
    }

    // ---------- load data & role ----------

    useEffect(() => {
        const r = getMockRole();
        setRole(r ?? "user");
        reload();
    }, []);

    // ---------- actions ----------

    async function handleAdd(e: React.FormEvent) {
        e.preventDefault();
        setError(null);

        if (!name.trim()) {
            setError("Please enter product name.");
            return;
        }
        if (!imageFile) {
            setError("Please select a product image.");
            return;
        }
        if (!attachmentFile) {
            setError("Please select an attachment.");
            return;
        }

        setSaving(true);
        try {
            const fd = new FormData();
            fd.append("name", name.trim());
            fd.append("image", imageFile);
            fd.append("attachment", attachmentFile);

            await addProduct(fd);
            await reload();

            setName("");
            setImageFile(null);
            setAttachmentFile(null);
            if (imageInputRef.current) {
                imageInputRef.current.value = "";
            }
            if (attachmentInputRef.current) {
                attachmentInputRef.current.value = "";
            }
        } catch (err: any) {
            console.error(err);
            setError(err?.message ? String(err.message) : "Failed to add product.");
        } finally {
            setSaving(false);
        }
    }

    async function handleApprove(id: number, currentStatus?: boolean) {
        const confirmText = currentStatus
            ? "This product is already approved. Approve again?"
            : "Approve this product?";
        if (!confirm(confirmText)) return;

        setError(null);
        try {
            await updateProductStatus(id);
            await reload();
        } catch (err) {
            console.error(err);
            setError("Failed to approve product.");
        }
    }

    async function handleDelete(id: number) {
        if (!confirm("Are you sure you want to delete this product?")) return;
        setError(null);
        try {
            await deleteVideo(id); // real delete (mocked below)
            setItems((prev) => prev.filter((p) => p.id !== id));
        } catch (err) {
            console.error(err);
            setError("Failed to delete product.");
        }
    }

    function startEdit(p: ProductItem) {
        setEditingId(p.id);
        setEditingName(p.name);
        setEditingImageFile(imageFile);
        setEditingAttachmentFile(attachmentFile);
        setError(null);
    }

    function cancelEdit() {
        setEditingId(null);
        setEditingName("");
        setEditingImageFile(null);
        setEditingAttachmentFile(null);
        setError(null);
    }

    async function saveEdit(id: number) {
        if (!editingName.trim()) {
            setError("Product name is required.");
            return;
        }

        if (!editingAttachmentFile) {
            setError("Attachment File can not be empty.");
            return;
        }

        if (!editingImageFile) {
            setError("Image File can not be empty.");
            return;
        }

        setSaving(true);
        try {
            const fd = new FormData();
            fd.append("name", editingName.trim());
            if (editingImageFile) fd.append("image", editingImageFile);
            if (editingAttachmentFile) fd.append("attachment", editingAttachmentFile);

            await editProduct(id, fd);

            await reload();

            // Set product as pending after edit
            setItems((prev) =>
                prev.map((p) =>
                    p.id === id ? { ...p, status: false } : p
                )
            );

            cancelEdit();
        } catch (err: any) {
            console.error(err);
            setError("Failed to save product.");
        } finally {
            setSaving(false);
        }
    }

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
                    Bank Products
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
                        <div style={{ marginBottom: 12 }}>
                            <label style={{ fontWeight: 700, color: "#c22053" }}>
                                PRODUCT NAME: <span style={{ color: "red" }}>*</span>
                            </label>
                            <input
                                type="text"
                                className="input"
                                style={{ marginTop: 6, width: "100%" }}
                                placeholder="Product Name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                            />
                        </div>

                        <div style={{ marginBottom: 12 }}>
                            <label style={{ fontWeight: 700, color: "#c22053" }}>
                                PRODUCT IMAGE: <span style={{ color: "red" }}>*</span>
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
                                    setError(null);
                                    setImageFile(file);
                                }}
                            />
                        </div>

                        <div style={{ marginBottom: 16 }}>
                            <label style={{ fontWeight: 700, color: "#c22053" }}>
                                ATTACHMENT (PDF OR IMAGE):{" "}
                                <span style={{ color: "red" }}>*</span>
                            </label>
                            <input
                                ref={attachmentInputRef}
                                type="file"
                                accept="application/pdf,image/*"
                                style={{ marginTop: 6 }}
                                onChange={(e) => {
                                    const file = e.target.files?.[0] || null;
                                    if (!file) {
                                        setAttachmentFile(null);
                                        return;
                                    }
                                    // allow PDFs or any image/* type
                                    if (!(file.type === "application/pdf" || file.type.startsWith("image/"))) {
                                        setError(
                                            "Please select a valid PDF or image file (pdf, jpg, png, etc.)."
                                        );
                                        setAttachmentFile(null);
                                        e.target.value = ""; // clear input
                                        return;
                                    }
                                    setError(null);
                                    setAttachmentFile(file);
                                }}
                            />
                        </div>

                        <button
                            type="submit"
                            className="btn btn-primary"
                            disabled={saving}
                        >
                            {saving ? "Adding…" : "Add Product"}
                        </button>
                    </form>
                )}

                <h3
                    style={{
                        marginTop: isSuper ? 10 : 0,
                        marginBottom: 8,
                        fontWeight: 700,
                        color: "#c22053",
                    }}
                >
                    Existing Products
                </h3>

                {loading ? (
                    <div>Loading products…</div>
                ) : items.length === 0 ? (
                    <div style={{ color: "#666" }}>No products found.</div>
                ) : (
                    <table>
                        <thead>
                            <tr>
                                <th style={{ width: 60 }}>ID</th>
                                <th>NAME</th>
                                <th style={{ width: 120 }}>IMAGE</th>
                                <th style={{ width: 140 }}>ATTACHMENT</th>
                                <th style={{ width: 200 }}>CREATED</th>
                                <th style={{ width: 140 }}>
                                    {isSuper ? "ACTIONS" : "STATUS"}
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {items.map((p) => (
                                <tr key={p.id}>
                                    <td>{p.id}</td>
                                    {/* <td>{p.name}</td> */}
                                    <td>
                                        {editingId === p.id ? (
                                            <input
                                                type="text"
                                                value={editingName}
                                                maxLength={20}
                                                style={{ width: "100%" }}
                                                onChange={(e) => setEditingName(e.target.value)}
                                            />
                                        ) : (
                                            p.name || "-"
                                        )}
                                    </td>
                                    <td>
                                        {/* <input
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
                                                setError(null);
                                                setImageFile(file);
                                            }}
                                        /> */}
                                        {editingId === p.id ? (
                                            <div
                                                style={{
                                                    minHeight: "10px",
                                                    display: "flex",
                                                    alignItems: "center",
                                                    padding: "6px",
                                                    border: "1px solid #ddd",
                                                    borderRadius: "6px",
                                                    background: "#fafafa",
                                                    minWidth: 100,
                                                    maxWidth: 100
                                                }}
                                            >
                                                <input
                                                    type="file"
                                                    accept="image/*"
                                                    style={{ width: "100%", padding: 6 }}
                                                    onChange={(e) => {
                                                        const file = e.target.files?.[0] || null;
                                                        setEditingImageFile(file);
                                                        if (!file) {
                                                            setEditingImageFile(null);
                                                            return;
                                                        }
                                                        if (!file.type.startsWith("image/")) {
                                                            setError("Please select a valid image file (jpg, png, etc.).");
                                                            setEditingImageFile(null);
                                                            e.target.value = "";
                                                            return;
                                                        }
                                                        setError(null);
                                                        setEditingImageFile(file);
                                                    }}
                                                />
                                            </div>
                                        ) : p.image_url ? (
                                            <img
                                                src={p.image_url}
                                                alt={p.name}
                                                style={{ maxHeight: 40, maxWidth: 80, objectFit: "contain" }}
                                            />
                                        ) : (
                                            "-"
                                        )}
                                    </td>
                                    <td>
                                        {editingId === p.id ? (
                                            <div
                                                style={{
                                                    minHeight: "10px",
                                                    display: "flex",
                                                    alignItems: "center",
                                                    padding: "6px",
                                                    border: "1px solid #ddd",
                                                    borderRadius: "6px",
                                                    background: "#fafafa",
                                                    minWidth: 100,
                                                    maxWidth: 100
                                                }}
                                            >
                                                <input
                                                    type="file"
                                                    accept="application/pdf,image/*"
                                                    style={{ width: "100%", padding: 6 }}
                                                    onChange={(e) =>
                                                        setEditingAttachmentFile(e.target.files?.[0] || null)
                                                    }
                                                />
                                            </div>
                                        ) : p.attachment_url ? (
                                            <a href={p.attachment_url} target="_blank" rel="noreferrer">
                                                View
                                            </a>
                                        ) : (
                                            "-"
                                        )}
                                    </td>

                                    <td>{fmtDate(p.created_at)}</td>
                                    <td>
                                        {isSuper ? (
                                            p.status ? (
                                                // APPROVED → show Delete
                                                <button
                                                    className="btn"
                                                    style={{
                                                        background: "#fff",
                                                        color: "#c22053",
                                                        border:
                                                            "1px solid rgba(194,32,83,0.12)",
                                                        padding: "6px 10px",
                                                        borderRadius: 8,
                                                    }}
                                                    onClick={() => handleDelete(p.id)}
                                                >
                                                    Delete
                                                </button>
                                            ) : (
                                                // PENDING → show Approve
                                                <button
                                                    className="btn"
                                                    style={{
                                                        background: "#fff",
                                                        color: "#2b2b2b",
                                                        border:
                                                            "1px solid rgba(194,32,83,0.12)",
                                                        padding: "6px 10px",
                                                        borderRadius: 8,
                                                    }}
                                                    onClick={() =>
                                                        handleApprove(p.id, p.status)
                                                    }
                                                >
                                                    Approve
                                                </button>
                                            )
                                        ) : editingId === p.id ? (
                                            <div style={{ display: "flex", gap: 8 }}>
                                                <button
                                                    className="btn btn-primary"
                                                    onClick={() => saveEdit(p.id)}
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
                                            // Normal user
                                            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                                                <span
                                                    style={{
                                                        padding: "6px 10px",
                                                        borderRadius: 8,
                                                        background: p.status ? "#e6fff2" : "#fff6f6",
                                                        color: p.status ? "#0a7a3f" : "#b30000",
                                                    }}
                                                >
                                                    {p.status ? "Approved" : "Pending"}
                                                </span>

                                                {editingId === null || editingId === p.id ? (
                                                    <button
                                                        className="btn"
                                                        style={{
                                                            background: "#fff",
                                                            color: "#2b2b2b",
                                                            border: "1px solid rgba(0,0,0,0.06)",
                                                            padding: "6px 10px",
                                                            borderRadius: 8,
                                                        }}
                                                        onClick={() => startEdit(p)}
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
