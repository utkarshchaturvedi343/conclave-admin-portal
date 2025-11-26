// app/admin/(panel)/components/session/SessionTimeoutClient.tsx
"use client";
import React from "react";
import { useSessionTimeout } from "./useSessionTimeout";
import SessionTimeoutModal from "./SessionTimeoutModal";

export default function SessionTimeoutClient({
    timeoutMs,
    warningMs,
    keepAliveUrl,
}: {
    timeoutMs?: number;
    warningMs?: number;
    keepAliveUrl?: string | null;
}) {
    const { showWarning, remaining, continueSession, manualLogout } = useSessionTimeout({
        timeoutMs: timeoutMs ?? 1 * 45 * 1000,
        warningMs: warningMs ?? 1 * 20 * 1000,
        // keepAliveUrl: keepAliveUrl ?? "/admin/session/refresh",
        storageKey: "admin-last-activity",
    });

    return (
        <SessionTimeoutModal
            open={showWarning}
            remainingMs={remaining}
            onContinue={continueSession}
            onLogout={manualLogout}
        />
    );
}
