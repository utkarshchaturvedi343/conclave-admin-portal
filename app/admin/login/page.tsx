"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { loginForm } from "@/lib/api";

export default function AdminLoginPage() {
  const router = useRouter();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const result = await loginForm(username, password);
      if (result && typeof result === "object" && (result as any).error) {
        setError((result as any).error || "Login failed");
        return;
      }
      router.push("/admin/news");
    } catch (err: any) {
      console.error(err);
      setError("Login failed. Check username/password.");
    } finally {
      setLoading(false);
      setUsername("");
      setPassword("");
    }
  }

  return (
    <div className="login-wrapper">
      <div className="login-card">
        <div className="card-head">
          <img src="/static/sbi_logo.jpg" alt="SBI Logo" />
          <div>
            <h1 style={{ margin: 0, fontSize: 22 }}>Admin Portal — Login</h1>
            <p style={{ margin: "4px 0 0", color: "#666" }}>
              Sign in to manage Agendas, Products, News, Videos & Users
            </p>
          </div>
        </div>

        <form className="login-form" onSubmit={handleSubmit}>
          {error && (
            <div
              style={{
                background: "#ffe6e6",
                border: "1px solid #ff9999",
                padding: "10px",
                borderRadius: "6px",
                color: "#b30000",
                marginBottom: "10px",
              }}
            >
              {error}
            </div>
          )}

          <div className="form-row">
            <label className="form-label" htmlFor="username">Username</label>
            <input
              id="username"
              className="input"
              autoComplete="off"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>

          <div className="form-row">
            <label className="form-label" htmlFor="password">Password</label>
            <input
              id="password"
              className="input"
              autoComplete="off"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <div style={{ marginTop: 6 }}>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
            >
              {loading ? "Signing in…" : "Sign in"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );

}
