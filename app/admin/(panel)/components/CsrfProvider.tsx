"use client";

import { useEffect } from "react";
import { loadCsrfToken } from "@/lib/csrf";

export default function CsrfProvider() {
    useEffect(() => {
        loadCsrfToken();
    }, []);

    return null; // nothing to render
}
