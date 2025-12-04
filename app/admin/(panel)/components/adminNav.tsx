"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { logout, fetchAdminTabs } from "@/lib/api";

type AdminTab = {
  key: string;
  label: string;
};

export default function AdminNav() {
  const pathname = usePathname();
  const [busy, setBusy] = useState(false);
  const [tabs, setTabs] = useState<AdminTab[]>([]);

  useEffect(() => {
    async function loadTabs() {
      try {
        const data = await fetchAdminTabs(); // backend returns { tabs: [...] }
        setTabs(data.tabs);
      } catch (err) {
        console.error("Failed to fetch tabs:", err);
      }
    }

    loadTabs();
  }, []);

  async function handleLogout() {
    if (!confirm("Are you sure you want to logout?")) return;

    setBusy(true);
    try {
      await logout();
    } finally {
      setBusy(false);
      window.location.href = "/admin/login";
    }
  }

  return (
    <div style={{ display: "flex", width: "100%", alignItems: "center" }}>
      <nav className="admin-nav" style={{ flexGrow: 1 }}>

        {tabs.map((t) => (
          <Link
            key={t.key}
            href={`/admin/${t.key}`}
            className={pathname === `/admin/${t.key}` ? "active" : ""}
          >
            {t.label}
          </Link>
        ))}

      </nav>

      <button onClick={handleLogout} disabled={busy}>
        {busy ? "Logging out…" : "Logout"}
      </button>
    </div>
  );
}
