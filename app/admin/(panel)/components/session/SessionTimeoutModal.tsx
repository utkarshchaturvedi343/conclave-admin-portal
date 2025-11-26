// app/admin/(panel)/components/session/SessionTimeoutModal.tsx
"use client";
import React from "react";

export default function SessionTimeoutModal({
    open,
    remainingMs,
    onContinue,
    onLogout,
}: {
    open: boolean;
    remainingMs: number | null;
    onContinue: () => void;
    onLogout: () => void;
}) {
    if (!open) return null;

    const secs = remainingMs ? Math.ceil(remainingMs / 1000) : null;
    const minutes = secs ? Math.floor(secs / 60) : 0;
    const seconds = secs ? secs % 60 : 0;
    return (
        <div
            role="dialog"
            aria-modal
            style={{
                position: "fixed",
                inset: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                zIndex: 9999,
                background: "rgba(0,0,0,0.45)",
            }}
        >
            <div style={{ width: 420, background: "#fff", padding: 20, borderRadius: 8 }}>
                <h3 style={{ margin: 0 }}>You're about to be signed out</h3>
                <p style={{ marginTop: 8 }}>
                    Due to inactivity, your session will expire in{" "}
                    <strong>{`${minutes}m ${seconds}s`}</strong>. Do you want to continue your session?
                </p>
                <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 12 }}>
                    <button className="btn" onClick={onLogout} style={{ background: "#fff", color: "#c22053" }}>
                        Log out
                    </button>
                    <button className="btn btn-primary" onClick={onContinue}>
                        Continue session
                    </button>
                </div>
            </div>
        </div>
    );
}
