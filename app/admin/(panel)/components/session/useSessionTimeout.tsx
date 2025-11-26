// app/admin/(panel)/components/session/useSessionTimeout.tsx
"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { logout } from "@/lib/api"; // existing logout helper

type Options = {
    timeoutMs?: number;
    warningMs?: number;
    checkIntervalMs?: number;
    keepAliveUrl?: string | null;
    storageKey?: string;
};

export function useSessionTimeout(opts: Options = {}) {
    const {
        timeoutMs = 1 * 45 * 1000,
        warningMs = 1 * 20 * 1000,
        checkIntervalMs = 10 * 1000,
        keepAliveUrl = null,
        storageKey = "admin-last-activity",
    } = opts;

    const router = useRouter();
    const [showWarning, setShowWarning] = useState(false);
    const [remaining, setRemaining] = useState<number | null>(null);
    const lastActivityRef = useRef<number>(Date.now());
    const timeoutTimerRef = useRef<number | null>(null);
    const warningTimerRef = useRef<number | null>(null);
    const mountedRef = useRef(false);

    const touch = useCallback((ts = Date.now()) => {
        lastActivityRef.current = ts;
        try {
            localStorage.setItem(storageKey, String(ts));
        } catch { }
    }, [storageKey]);

    const doLogout = useCallback(async () => {
        try {
            await logout().catch(() => { });
        } catch { }
        try {
            localStorage.setItem("session-logged-out", String(Date.now()));
        } catch { }
        router.push("/admin/login");
    }, [router]);

    const callKeepAlive = useCallback(async () => {
        if (!keepAliveUrl) return;
        try {
            await fetch(keepAliveUrl, { method: "POST", credentials: "include", mode: "cors" });
        } catch { }
    }, [keepAliveUrl]);

    const computeRemaining = useCallback(() => {
        return Math.max(0, (lastActivityRef.current + timeoutMs) - Date.now());
    }, [timeoutMs]);

    const resetTimers = useCallback(() => {
        if (warningTimerRef.current) {
            window.clearTimeout(warningTimerRef.current);
            warningTimerRef.current = null;
        }
        if (timeoutTimerRef.current) {
            window.clearTimeout(timeoutTimerRef.current);
            timeoutTimerRef.current = null;
        }

        const remainingMs = computeRemaining();
        setShowWarning(false);
        setRemaining(remainingMs);

        const warnIn = remainingMs - warningMs;
        if (warnIn > 0) {
            warningTimerRef.current = window.setTimeout(() => {
                setShowWarning(true);
            }, warnIn);
        } else {
            setShowWarning(true);
        }

        timeoutTimerRef.current = window.setTimeout(() => {
            setShowWarning(false);
            doLogout();
        }, remainingMs);
    }, [computeRemaining, doLogout, warningMs]);

    const activityHandler = useCallback(() => {
        touch();
        setShowWarning(false);
        setRemaining(timeoutMs);
        callKeepAlive().catch(() => { });
    }, [callKeepAlive, timeoutMs, touch]);

    useEffect(() => {
        const onStorage = (ev: StorageEvent) => {
            if (ev.key === storageKey && ev.newValue) {
                const ts = Number(ev.newValue || Date.now());
                lastActivityRef.current = ts;
                resetTimers();
            } else if (ev.key === "session-logged-out") {
                router.push("/admin/login");
            }
        };
        window.addEventListener("storage", onStorage);
        return () => window.removeEventListener("storage", onStorage);
    }, [resetTimers, router, storageKey]);

    useEffect(() => {
        if (mountedRef.current) return;
        mountedRef.current = true;

        try {
            const stored = localStorage.getItem(storageKey);
            if (stored) lastActivityRef.current = Number(stored);
        } catch { }

        const events = ["mousemove", "mousedown", "keydown", "touchstart", "scroll", "visibilitychange"];
        const handler = () => {
            if (document.visibilityState === "hidden") return;
            activityHandler();
        };

        events.forEach((ev) => window.addEventListener(ev, handler, { passive: true }));
        const interval = window.setInterval(() => {
            setRemaining(computeRemaining());
        }, checkIntervalMs);

        touch();
        resetTimers();

        return () => {
            events.forEach((ev) => window.removeEventListener(ev, handler));
            clearInterval(interval);
            if (warningTimerRef.current) window.clearTimeout(warningTimerRef.current);
            if (timeoutTimerRef.current) window.clearTimeout(timeoutTimerRef.current);
        };
    }, [activityHandler, checkIntervalMs, computeRemaining, resetTimers, touch, storageKey]);

    const continueSession = useCallback(async () => {
        touch();
        await callKeepAlive();
        resetTimers();
    }, [callKeepAlive, resetTimers, touch]);

    const manualLogout = useCallback(async () => {
        await doLogout();
    }, [doLogout]);

    return {
        showWarning,
        remaining,
        continueSession,
        manualLogout,
    };
}
