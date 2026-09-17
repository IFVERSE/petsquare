"use client";

import { useState, useTransition } from "react";
import { ShieldOff, ShieldCheck } from "lucide-react";
import { setUserStatus } from "@/app/admin/users/actions";

type User = {
  id: string; email: string; full_name: string | null; account_type: string;
  status: string; created_at: string;
};

export default function UsersList({ users }: { users: User[] }) {
  const [rows, setRows] = useState(users);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState<"all" | "pet_owner" | "vendor" | "admin">("all");
  const [pending, startTransition] = useTransition();

  function toggle(id: string, current: string) {
    const next = current === "suspended" ? "active" : "suspended";
    startTransition(async () => {
      const result = await setUserStatus(id, next as "active" | "suspended");
      if (result?.error) { setError(result.error); return; }
      setRows((r) => r.map((u) => (u.id === id ? { ...u, status: next } : u)));
    });
  }

  const visible = filter === "all" ? rows : rows.filter((u) => u.account_type === filter);

  return (
    <div className="mt-6">
      {error && <p role="alert" className="mb-3 text-sm text-coral">{error}</p>}
      <div className="flex flex-wrap gap-2">
        {(["all", "pet_owner", "vendor", "admin"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded-full px-3.5 py-1.5 text-xs font-medium capitalize ${
              filter === f ? "bg-abyss text-white" : "bg-surface border border-paper-dim text-navy/60"
            }`}
          >
            {f.replace("_", " ")}
          </button>
        ))}
      </div>

      <div className="mt-4 overflow-x-auto rounded-2xl bg-surface shadow-[var(--shadow-card)]">
        <table className="admin-card-table admin-users-table w-full min-w-[640px] text-left text-sm">
          <thead className="bg-paper text-xs uppercase tracking-wide text-navy/40">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            {visible.map((u) => (
              <tr key={u.id} className="border-t border-paper-dim">
                <td className="px-4 py-3 text-navy">{u.full_name || "—"}</td>
                <td className="px-4 py-3 text-navy/60">{u.email}</td>
                <td className="px-4 py-3 capitalize text-navy/60">{u.account_type.replace("_", " ")}</td>
                <td className="px-4 py-3">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${u.status === "suspended" ? "bg-coral/10 text-coral" : "bg-sage-light text-sage"}`}>
                    {u.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <button onClick={() => toggle(u.id, u.status)} disabled={pending} className="inline-flex min-h-11 items-center gap-1 text-xs font-medium text-navy/60 hover:text-navy disabled:opacity-50">
                    {u.status === "suspended" ? (
                      <><ShieldCheck className="h-3.5 w-3.5" /> Reactivate</>
                    ) : (
                      <><ShieldOff className="h-3.5 w-3.5" /> Suspend</>
                    )}
                  </button>
                </td>
              </tr>
            ))}
            {visible.length === 0 && (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-navy/40">No users found.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
