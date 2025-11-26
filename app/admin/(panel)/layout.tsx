"use client";

import React from "react";
import "../../globals.css";
import AdminNav from "./components/adminNav";

import SessionTimeoutClient from "./components/session/SessionTimeoutClient";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <div className="admin-header">
        <div className="admin-header-top">
          <img src="/static/sbi_logo.jpg" alt="SBI Logo" className="admin-logo" />
          <h1>Admin Portal</h1>
        </div>
        <AdminNav />
      </div>

      <main className="admin-main">{children}</main>
      <SessionTimeoutClient
        timeoutMs={1 * 45 * 1000}
        warningMs={1 * 20 * 1000}
      />
    </>
  );
}
