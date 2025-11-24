"use client";

import React, { useEffect, useState } from "react";
import { getUsers, addUser, uploadUsersCSV, updateUserStatus } from "@/lib/api";
import { getMockRole } from "@/lib/mockRole";

type User = {
    id: number;
    pf_id?: number;
    name?: string;
    department?: string;
    location?: string;
    mobile?: number;
    status?: boolean;
};

export default function UsersPage() {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // role state (from cookie/mock)
    const [role, setRole] = useState<"user" | "super" | null>(null);
    const isSuper = role === "super";

    // single user form state
    const [pfId, setPfId] = useState("");
    const [name, setName] = useState("");
    const [department, setDepartment] = useState("");
    const [location, setLocation] = useState("");
    const [mobile, setMobile] = useState("");

    const [csvFile, setCsvFile] = useState<File | null>(null);
    const [csvUploading, setCsvUploading] = useState(false);
    const [actionLoadingId, setActionLoadingId] = useState<number | null>(null);

    function normalizeItem(item: any): User {
        const raw = item.status;
        let statusBool: boolean | undefined = undefined;

        if (raw === undefined || raw === null) {
            // fallback: if no status field, treat as false (pending)
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
            pf_id: item.pf_id ?? item.pfId ?? item.pfid ?? "",
            name: item.name ?? "",
            department: item.department ?? "",
            location: item.location ?? "",
            mobile: item.mobile ?? "",
            status: statusBool,
        };
    }

    // load users + role
    useEffect(() => {
        let mounted = true;
        const r = getMockRole();
        setRole(r ?? "user");

        async function load() {
            setLoading(true);
            setError(null);
            try {
                const data = await getUsers();
                const arr = Array.isArray(data) ? data.map(normalizeItem) : [];
                if (mounted) setUsers(arr);
            } catch (err) {
                console.error(err);
                if (mounted) setError("Failed to load users.");
            } finally {
                if (mounted) setLoading(false);
            }
        }

        load();
        return () => {
            mounted = false;
        };
    }, []);

    async function handleAddUser(e?: React.FormEvent) {
        if (e) e.preventDefault();
        setError(null);

        if (!name.trim() && !mobile.trim()) {
            setError("Please provide at least a Name or a Mobile Number.");
            return;
        }

        setSaving(true);
        try {
            const payload: Record<string, string> = {};
            if (pfId.trim()) payload.pf_id = pfId.trim();
            if (name.trim()) payload.name = name.trim();
            if (department.trim()) payload.department = department.trim();
            if (location.trim()) payload.location = location.trim();
            if (mobile.trim()) payload.mobile = mobile.trim();

            // backend should default status to false/0
            await addUser(payload);

            const data = await getUsers();
            setUsers(Array.isArray(data) ? data.map(normalizeItem) : []);

            setPfId("");
            setName("");
            setDepartment("");
            setLocation("");
            setMobile("");
        } catch (err: any) {
            console.error(err);
            setError(err?.message || "Failed to add user.");
        } finally {
            setSaving(false);
        }
    }

    async function handleUploadCSV(e?: React.FormEvent) {
        if (e) e.preventDefault();
        if (!csvFile) {
            setError("Please choose a CSV file to upload.");
            return;
        }
        setCsvUploading(true);
        setError(null);
        try {
            await uploadUsersCSV(csvFile);
            const data = await getUsers();
            setUsers(Array.isArray(data) ? data.map(normalizeItem) : []);
            setCsvFile(null);
        } catch (err: any) {
            console.error(err);
            setError(err?.message || "CSV upload failed.");
        } finally {
            setCsvUploading(false);
        }
    }

    async function setStatus(id: number, newStatus: boolean) {
        const confirmText = newStatus ? "Approve this user?" : "Revoke user access?";
        if (!confirm(confirmText)) return;
        setError(null);
        setActionLoadingId(id);
        try {
            await updateUserStatus(id);
            const data = await getUsers();
            setUsers(Array.isArray(data) ? data.map(normalizeItem) : []);
        } catch (err) {
            console.error(err);
            setError("Failed to update status.");
        } finally {
            setActionLoadingId(null);
        }
    }

    return (
        <section>
            <h2>User Management</h2>

            {error && (
                <div style={{ marginBottom: 12, padding: 10, borderRadius: 6, background: "#fff6f6", border: "1px solid #ffcccc", color: "#900" }}>
                    {error}
                </div>
            )}

            {/* ---------- ADD SINGLE USER ---------- */}
            <div style={{ marginBottom: 20 }}>
                <h3 style={{ marginBottom: 8 }}>Add Single User</h3>

                <form
                    onSubmit={handleAddUser}
                    style={{
                        background: "linear-gradient(135deg,#fff,#f9f5fc)",
                        padding: 16,
                        borderRadius: 8,
                        boxShadow: "0 2px 12px rgba(194,32,83,0.06)",
                    }}
                >
                    {/* PF ID: digits only, max length 7 */}
                    <label className="form-label">PF ID:</label>
                    <input
                        className="input"
                        value={pfId}
                        maxLength={7}
                        onChange={(e) => {
                            const val = e.target.value;
                            if (/^\d{0,7}$/.test(val)) setPfId(val);
                        }}
                        placeholder="PF ID"
                    />

                    {/* Name: only letters + spaces, max 20, REQUIRED */}
                    <label className="form-label" style={{ marginTop: 8 }}>
                        Name <span style={{ color: "red" }}>*</span>
                    </label>
                    <input
                        className="input"
                        value={name}
                        maxLength={20}
                        onChange={(e) => {
                            const val = e.target.value;
                            if (/^[A-Za-z ]*$/.test(val)) setName(val);
                        }}
                        placeholder="Name"
                        required
                    />

                    {/* Department */}
                    <label className="form-label" style={{ marginTop: 8 }}>
                        Department:
                    </label>
                    <input
                        className="input"
                        value={department}
                        maxLength={20}
                        onChange={(e) => {
                            const val = e.target.value;
                            if (/^[A-Za-z ]*$/.test(val)) setDepartment(val);
                        }}
                        placeholder="Department"
                    />

                    {/* Location */}
                    <label className="form-label" style={{ marginTop: 8 }}>
                        Location:
                    </label>
                    <input
                        className="input"
                        value={location}
                        maxLength={20}
                        onChange={(e) => {
                            const val = e.target.value;
                            if (/^[A-Za-z ]*$/.test(val)) setLocation(val);
                        }}
                        placeholder="Location"
                    />

                    {/* Mobile Number: digits only, max 10, REQUIRED */}
                    <label className="form-label" style={{ marginTop: 8 }}>
                        Mobile Number <span style={{ color: "red" }}>*</span>
                    </label>
                    <input
                        className="input"
                        value={mobile}
                        maxLength={10}
                        onChange={(e) => {
                            const val = e.target.value;
                            if (/^\d{0,10}$/.test(val)) setMobile(val);
                        }}
                        placeholder="Mobile Number"
                        required
                    />

                    <div style={{ marginTop: 8, color: "#666", fontSize: 12 }}>
                        <span style={{ color: "red" }}>*</span>  <strong>Name</strong> and <strong>Mobile Number</strong> are mandatory.
                        Other fields are optional.
                    </div>

                    <div style={{ marginTop: 12 }}>
                        <button className="btn btn-primary" type="submit" disabled={saving}>
                            {saving ? "Adding…" : "Add User"}
                        </button>
                    </div>
                </form>
            </div>

            {/* ---------- BULK UPLOAD USERS (CSV) ---------- */}
            <div style={{ marginBottom: 24 }}>
                <h3 style={{ marginBottom: 8 }}>Bulk Upload Users (CSV)</h3>
                <form
                    onSubmit={handleUploadCSV}
                    style={{
                        background: "linear-gradient(135deg,#fff,#f9f5fc)",
                        padding: 16,
                        borderRadius: 8,
                        boxShadow: "0 2px 12px rgba(194,32,83,0.06)",
                    }}
                >
                    <label className="form-label">
                        Upload Users CSV <span style={{ color: "red" }}>*</span>
                    </label>
                    <input
                        type="file"
                        accept=".csv,text/csv"
                        onChange={(e) => setCsvFile(e.target.files?.[0] || null)}
                        style={{ marginTop: 8 }}
                        required
                    />
                    <div style={{ marginTop: 12 }}>
                        <button className="btn btn-primary" type="submit" disabled={csvUploading}>
                            {csvUploading ? "Uploading…" : "Upload CSV"}
                        </button>
                    </div>
                    <div style={{ marginTop: 8, color: "#666", fontSize: 12 }}>
                        CSV format: <code>pf_id,name,department,location,mobile</code> <br />
                        Only <strong>.csv</strong> files are allowed.
                    </div>
                </form>
            </div>

            <div>
                <h3 style={{ marginBottom: 8 }}>Registered Users</h3>
                {loading ? (
                    <div>Loading users…</div>
                ) : users.length === 0 ? (
                    <div style={{ color: "#666" }}>No users found.</div>
                ) : (
                    <table>
                        <thead>
                            <tr>
                                <th style={{ width: 40 }}>ID</th>
                                <th>PF ID</th>
                                <th>Name</th>
                                <th>Department</th>
                                <th>Location</th>
                                <th>Mobile</th>
                                <th style={{ width: 180 }}>{isSuper ? "Actions" : "Status"}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.map((u) => (
                                <tr key={u.id}>
                                    <td>{u.id}</td>
                                    <td>{u.pf_id}</td>
                                    <td>{u.name}</td>
                                    <td>{u.department}</td>
                                    <td>{u.location}</td>
                                    <td>{u.mobile}</td>
                                    <td>
                                        {isSuper ? (
                                            <>
                                                {u.status ? (
                                                    <div style={{ display: "flex", gap: 8 }}>
                                                        {/* <span style={{ padding: "6px 10px", borderRadius: 8, background: "#e6fff2", color: "#0a7a3f" }}>Approved</span> */}
                                                        <button
                                                            className="btn"
                                                            style={{ background: "#fff", color: "#c22053" }}
                                                            onClick={() => setStatus(u.id, false)}
                                                            disabled={actionLoadingId === u.id}
                                                        >
                                                            {actionLoadingId === u.id ? "..." : "Delete"}
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <div style={{ display: "flex", gap: 8 }}>
                                                        <button
                                                            className="btn"
                                                            style={{ background: "#fff", color: "#2b2b2b" }}
                                                            onClick={() => setStatus(u.id, true)}
                                                            disabled={actionLoadingId === u.id}
                                                        >
                                                            {actionLoadingId === u.id ? "..." : "Approve"}
                                                        </button>
                                                    </div>
                                                )}
                                            </>
                                        ) : (
                                            <span
                                                style={{
                                                    padding: "6px 10px",
                                                    borderRadius: 8,
                                                    background: u.status ? "#e6fff2" : "#fff6f6",
                                                    color: u.status ? "#0a7a3f" : "#b30000",
                                                }}
                                            >
                                                {u.status ? "Approved" : "Pending"}
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
