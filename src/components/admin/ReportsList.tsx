"use client";

import { useState, useTransition } from "react";
import { Eye, CheckCircle2, XCircle } from "lucide-react";
import { setReportStatus } from "@/app/admin/reports/actions";

type Report = {
  id: string; target_type: string; target_id: string; reason: string; details: string | null;
  status: string; created_at: string; reporter_email?: string | null;
};

const statusColor: Record<string, string> = {
  pending: "bg-sunshine/20 text-tangerine",
  under_review: "bg-sage-light text-sage",
  resolved: "bg-paper text-navy/50",
  dismissed: "bg-paper text-navy/40",
};

export default function ReportsList({ reports }: { reports: Report[] }) {
  const [rows, setRows] = useState(reports);
  const [pending, startTransition] = useTransition();

  function act(id: string, status: "under_review" | "resolved" | "dismissed") {
    startTransition(async () => {
      await setReportStatus(id, status);
      setRows((r) => r.map((rep) => (rep.id === id ? { ...rep, status } : rep)));
    });
  }

  return (
    <div className="mt-6 space-y-3">
      {rows.map((r) => (
        <div key={r.id} className="rounded-2xl bg-surface p-4 shadow-[var(--shadow-card)]">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-paper px-2 py-0.5 text-xs capitalize text-navy/60">{r.target_type}</span>
                <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusColor[r.status] ?? ""}`}>{r.status.replace("_", " ")}</span>
              </div>
              <p className="mt-1.5 text-sm font-medium text-navy">{r.reason}</p>
              {r.details && <p className="mt-0.5 text-sm text-navy/60">{r.details}</p>}
              <p className="mt-1 text-xs text-navy/40">
                Target ID: <span className="font-data">{r.target_id}</span>
                {r.reporter_email && ` · Reported by ${r.reporter_email}`}
                {" · "}{new Date(r.created_at).toLocaleDateString()}
              </p>
            </div>
            <div className="flex gap-2">
              {r.status === "pending" && (
                <button onClick={() => act(r.id, "under_review")} disabled={pending} className="flex items-center gap-1 rounded-full border border-paper-dim px-3 py-1.5 text-xs font-medium text-navy/60 disabled:opacity-50">
                  <Eye className="h-3.5 w-3.5" /> Review
                </button>
              )}
              {r.status !== "resolved" && (
                <button onClick={() => act(r.id, "resolved")} disabled={pending} className="flex items-center gap-1 rounded-full bg-sage px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50">
                  <CheckCircle2 className="h-3.5 w-3.5" /> Resolve
                </button>
              )}
              {r.status !== "dismissed" && (
                <button onClick={() => act(r.id, "dismissed")} disabled={pending} className="flex items-center gap-1 rounded-full border border-paper-dim px-3 py-1.5 text-xs font-medium text-navy/60 disabled:opacity-50">
                  <XCircle className="h-3.5 w-3.5" /> Dismiss
                </button>
              )}
            </div>
          </div>
        </div>
      ))}
      {rows.length === 0 && <p className="text-sm text-navy/40">No reports filed yet.</p>}
    </div>
  );
}
