"use client";

import React, { useEffect, useState } from "react";
import { getProducts, addProduct, updateProductStatus } from "@/lib/api";
import { getMockRole } from "@/lib/mockRole";

type Product = {
    id: number;
    name?: string;
    image_url?: string;
    attachment_url?: string;
    created_at?: string;
    status?: boolean;
};

export default function ProductsPage() {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // role state (from cookie/mock)
    const [role, setRole] = useState<"user" | "super" | null>(null);
    const isSuper = role === "super";

    // single product form state
    const [name, setName] = useState("");
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [attachmentFile, setAttachmentFile] = useState<File | null>(null);

    const [actionLoadingId, setActionLoadingId] = useState<number | null>(null);

    function normalizeItem(item: any): Product {
        const raw = item.status;
        let statusBool: boolean | undefined = undefined;

        if (raw === undefined || raw === null) {
            statusBool = false; // pending
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
            name: item.name ?? item.product_name ?? "",
            image_url: item.image_url ?? item.image ?? "",
            attachment_url: item.attachment_url ?? item.attachment ?? "",
            created_at: item.created_at ?? item.created ?? "",
            status: statusBool,
        };
    }

    // load products + role
    useEffect(() => {
        let mounted = true;
        const r = getMockRole();
        setRole(r ?? "user");

        async function load() {
            setLoading(true);
            setError(null);
            try {
                const data = await getProducts();
                const arr = Array.isArray(data) ? data.map(normalizeItem) : [];
                if (mounted) setProducts(arr);
            } catch (err) {
                console.error(err);
                if (mounted) setError("Failed to load products.");
            } finally {
                if (mounted) setLoading(false);
            }
        }

        load();
        return () => {
            mounted = false;
        };
    }, []);

    async function handleAddProduct(e?: React.FormEvent) {
        if (e) e.preventDefault();
        setError(null);

        if (!name.trim()) {
            setError("Product Name is required.");
            return;
        }

        if (!imageFile && !attachmentFile) {
            setError("Please choose at least an Image or an Attachment.");
            return;
        }

        setSaving(true);
        try {
            const form = new FormData();
            form.append("name", name.trim());
            if (imageFile) form.append("image", imageFile);
            if (attachmentFile) form.append("attachment", attachmentFile);

            // backend should default status to false/0 (pending)
            await addProduct(form);

            const data = await getProducts();
            setProducts(Array.isArray(data) ? data.map(normalizeItem) : []);

            setName("");
            setImageFile(null);
            setAttachmentFile(null);
        } catch (err: any) {
            console.error(err);
            setError(err?.message || "Failed to add product.");
        } finally {
            setSaving(false);
        }
    }

    // super user toggles status; backend negates current value
    async function setStatus(id: number, newStatus: boolean) {
        const confirmText = newStatus ? "Approve this product?" : "Mark this product as pending?";
        if (!confirm(confirmText)) return;
        setError(null);
        setActionLoadingId(id);
        try {
            await updateProductStatus(id);
            const data = await getProducts();
            setProducts(Array.isArray(data) ? data.map(normalizeItem) : []);
        } catch (err) {
            console.error(err);
            setError("Failed to update status.");
        } finally {
            setActionLoadingId(null);
        }
    }

    function formatDate(value?: string) {
        if (!value) return "-";
        const d = new Date(value);
        if (Number.isNaN(d.getTime())) return value;
        return d.toLocaleDateString();
    }

    return (
        <section>
            <h2>Product Management</h2>

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

            {/* ---------- ADD PRODUCT ---------- */}
            <div style={{ marginBottom: 20 }}>
                <h3 style={{ marginBottom: 8 }}>Add Product</h3>

                <form
                    onSubmit={handleAddProduct}
                    style={{
                        background: "linear-gradient(135deg,#fff,#f9f5fc)",
                        padding: 16,
                        borderRadius: 8,
                        boxShadow: "0 2px 12px rgba(194,32,83,0.06)",
                    }}
                >
                    {/* Product Name */}
                    <label className="form-label">
                        Product Name <span style={{ color: "red" }}>*</span>
                    </label>
                    <input
                        className="input"
                        value={name}
                        maxLength={80}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Product name"
                        required
                    />

                    {/* Product Image */}
                    <label className="form-label" style={{ marginTop: 8 }}>
                        Product Image:
                    </label>
                    <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                        style={{ marginTop: 4 }}
                    />

                    {/* Attachment */}
                    <label className="form-label" style={{ marginTop: 8 }}>
                        Attachment (PDF or Image):
                    </label>
                    <input
                        type="file"
                        accept="application/pdf,image/*"
                        onChange={(e) => setAttachmentFile(e.target.files?.[0] || null)}
                        style={{ marginTop: 4 }}
                    />

                    <div style={{ marginTop: 8, color: "#666", fontSize: 12 }}>
                        You can upload an image, an attachment, or both.
                    </div>

                    <div style={{ marginTop: 12 }}>
                        <button className="btn btn-primary" type="submit" disabled={saving}>
                            {saving ? "Adding…" : "Add Product"}
                        </button>
                    </div>
                </form>
            </div>

            {/* ---------- EXISTING PRODUCTS TABLE ---------- */}
            <div>
                <h3 style={{ marginBottom: 8 }}>Existing Products</h3>
                {loading ? (
                    <div>Loading products…</div>
                ) : products.length === 0 ? (
                    <div style={{ color: "#666" }}>No products found.</div>
                ) : (
                    <table>
                        <thead>
                            <tr>
                                <th style={{ width: 40 }}>ID</th>
                                <th>Name</th>
                                <th>Image</th>
                                <th>Attachment</th>
                                <th>Created</th>
                                <th style={{ width: 180 }}>{isSuper ? "Actions" : "Status"}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {products.map((p) => (
                                <tr key={p.id}>
                                    <td>{p.id}</td>
                                    <td>{p.name}</td>
                                    <td>
                                        {p.image_url ? (
                                            <img
                                                src={p.image_url}
                                                alt={p.name}
                                                style={{
                                                    maxWidth: 80,
                                                    maxHeight: 60,
                                                    objectFit: "cover",
                                                    borderRadius: 6,
                                                }}
                                            />
                                        ) : (
                                            "-"
                                        )}
                                    </td>
                                    <td>
                                        {p.attachment_url ? (
                                            <a
                                                href={p.attachment_url}
                                                target="_blank"
                                                rel="noreferrer"
                                                style={{
                                                    color: "#c22053",
                                                    textDecoration: "underline",
                                                }}
                                            >
                                                {p.attachment_url.toLowerCase().endsWith(".pdf")
                                                    ? "PDF"
                                                    : "View"}
                                            </a>
                                        ) : (
                                            "-"
                                        )}
                                    </td>
                                    <td>{formatDate(p.created_at)}</td>
                                    <td>
                                        {isSuper ? (
                                            <>
                                                {p.status ? (
                                                    <div style={{ display: "flex", gap: 8 }}>
                                                        <span
                                                            style={{
                                                                padding: "6px 10px",
                                                                borderRadius: 8,
                                                                background: "#e6fff2",
                                                                color: "#0a7a3f",
                                                            }}
                                                        >
                                                            Approved
                                                        </span>
                                                        <button
                                                            className="btn"
                                                            style={{ background: "#fff", color: "#c22053" }}
                                                            onClick={() => setStatus(p.id, false)}
                                                            disabled={actionLoadingId === p.id}
                                                        >
                                                            {actionLoadingId === p.id ? "..." : "Delete"}
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <div style={{ display: "flex", gap: 8 }}>
                                                        <button
                                                            className="btn"
                                                            style={{ background: "#fff", color: "#2b2b2b" }}
                                                            onClick={() => setStatus(p.id, true)}
                                                            disabled={actionLoadingId === p.id}
                                                        >
                                                            {actionLoadingId === p.id ? "..." : "Approve"}
                                                        </button>
                                                    </div>
                                                )}
                                            </>
                                        ) : (
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
``
