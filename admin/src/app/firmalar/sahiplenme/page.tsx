"use client";

import { useEffect, useState } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { StatusBadge } from "@/components/shared/StatusBadge";
import api, { getResponseList } from "@/lib/api";

interface Claim {
  id: string;
  claimerName: string;
  claimerEmail: string;
  claimerPhone: string;
  documentUrl: string | null;
  status: string;
  createdAt: string;
  company?: { name?: string };
}

export default function SahiplenmePage() {
  const [claims, setClaims] = useState<Claim[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [adminNote, setAdminNote] = useState<Record<string, string>>({});

  async function fetchClaims() {
    setLoading(true);
    setError("");
    try {
      const res = await api.get("/admin/companies/claims", { params: { limit: 50 } });
      setClaims(getResponseList<Claim>(res.data));
    } catch {
      setError("Sahiplenme talepleri yüklenemedi.");
      setClaims([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void fetchClaims(); }, []);

  async function processClaim(id: string, status: "approved" | "rejected") {
    await api.patch(`/admin/companies/claims/${id}`, { status, adminNote: adminNote[id] || null });
    await fetchClaims();
  }

  return (
    <AdminLayout>
      <h1 className="text-2xl font-bold text-foreground">Firma Sahiplenme Talepleri</h1>
      {error && <div className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div>}

      <div className="mt-6 space-y-4">
        {loading ? (
          <div className="rounded-xl border border-border bg-card-bg p-8 text-center text-muted">Yükleniyor...</div>
        ) : claims.length === 0 ? (
          <div className="rounded-xl border border-border bg-card-bg p-8 text-center text-muted">Sahiplenme talebi bulunmuyor.</div>
        ) : claims.map((claim) => (
          <div key={claim.id} className="rounded-xl border border-border bg-card-bg p-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <h3 className="font-semibold">{claim.company?.name || "Firma"} için sahiplenme talebi</h3>
                <p className="mt-1 text-sm text-muted">Talep eden: {claim.claimerName} — {claim.claimerEmail}</p>
                <p className="mt-1 text-sm text-muted">Telefon: {claim.claimerPhone}</p>
                {claim.documentUrl && (
                  <a href={claim.documentUrl} target="_blank" rel="noopener noreferrer" className="mt-1 inline-block text-sm text-primary hover:underline">
                    Belgeyi görüntüle
                  </a>
                )}
                <div className="mt-2"><StatusBadge status={claim.status} /></div>
              </div>
              {claim.status === "pending" && (
                <div className="w-full max-w-sm space-y-3">
                  <textarea
                    rows={3}
                    value={adminNote[claim.id] || ""}
                    onChange={(e) => setAdminNote((prev) => ({ ...prev, [claim.id]: e.target.value }))}
                    placeholder="Admin notu (opsiyonel)"
                    className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-primary focus:outline-none"
                  />
                  <div className="flex gap-2">
                    <button onClick={() => processClaim(claim.id, "approved")} className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700">Onayla</button>
                    <button onClick={() => processClaim(claim.id, "rejected")} className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700">Reddet</button>
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </AdminLayout>
  );
}
