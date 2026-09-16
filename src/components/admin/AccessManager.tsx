"use client";

import { useState, useTransition } from "react";
import { UserPlus, ShieldCheck, ShieldOff } from "lucide-react";
import { inviteAdmin, updateAdminStatus } from "@/app/admin/access/actions";

type Role = { id: number; name: string; label: string };
type AccessRow = { id: string; email: string; status: string; role: Role | null };

export default function AccessManager({
  initialAccess,
  roles,
}: {
  initialAccess: AccessRow[];
  roles: Role[];
}) {
  const [rows, setRows] = useState(initialAccess);
  const [email, setEmail] = useState("");
  const [roleId, setRoleId] = useState<number | "">(roles[0]?.id ?? "");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleInvite(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const res = await inviteAdmin(formData);
      if (res?.error) {
        setError(res.error);
      } else {
        setRows((r) => [
          {
            id: crypto.randomUUID(),
            email,
            status: "pending",
            role: roles.find((r) => r.id === roleId) ?? null,
          },
          ...r,
        ]);
        setEmail("");
      }
    });
  }

  function toggleStatus(id: string, current: string) {
    const next = current === "active" ? "suspended" : "active";
    startTransition(async () => {
      const res = await updateAdminStatus(id, next);
      if (!res?.error) {
        setRows((r) => r.map((row) => (row.id === id ? { ...row, status: next } : row)));
      }
    });
  }

  return (
    <div className="mt-6">
      <form
        action={handleInvite}
        className="flex flex-col gap-3 rounded-2xl bg-surface p-5 shadow-[var(--shadow-card)] sm:flex-row sm:items-end"
      >
        <div className="flex-1">
          <label className="text-xs font-medium text-navy/50">Email address</label>
          <input
            name="email"
            required
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="new-admin@petsquare.example"
            className="mt-1 w-full rounded-xl border border-paper-dim px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-tangerine/30"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-navy/50">Role</label>
          <select
            name="role_id"
            value={roleId}
            onChange={(e) => setRoleId(Number(e.target.value))}
            className="mt-1 rounded-xl border border-paper-dim px-3 py-2.5 text-sm"
          >
            {roles.map((r) => (
              <option key={r.id} value={r.id}>{r.label}</option>
            ))}
          </select>
        </div>
        <button
          disabled={pending}
          className="flex items-center justify-center gap-1.5 rounded-xl bg-tangerine px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
        >
          <UserPlus className="h-4 w-4" /> Authorize
        </button>
      </form>
      {error && <p className="mt-2 text-sm text-coral">{error}</p>}

      <div className="mt-6 overflow-x-auto rounded-2xl bg-surface shadow-[var(--shadow-card)]">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="bg-paper text-xs uppercase tracking-wide text-navy/40">
            <tr>
              <th className="px-5 py-3">Email</th>
              <th className="px-5 py-3">Role</th>
              <th className="px-5 py-3">Status</th>
              <th className="px-5 py-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="border-t border-paper-dim">
                <td className="px-5 py-3 text-navy">{row.email}</td>
                <td className="px-5 py-3 text-navy/70">{row.role?.label ?? "—"}</td>
                <td className="px-5 py-3">
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      row.status === "active"
                        ? "bg-sage-light text-sage"
                        : row.status === "pending"
                        ? "bg-sunshine/20 text-tangerine"
                        : "bg-coral/10 text-coral"
                    }`}
                  >
                    {row.status}
                  </span>
                </td>
                <td className="px-5 py-3 text-right">
                  {row.role?.name !== "super_admin" && (
                    <button
                      onClick={() => toggleStatus(row.id, row.status)}
                      disabled={pending}
                      className="inline-flex items-center gap-1 text-xs font-medium text-navy/60 hover:text-navy disabled:opacity-50"
                    >
                      {row.status === "active" ? (
                        <>
                          <ShieldOff className="h-3.5 w-3.5" /> Suspend
                        </>
                      ) : (
                        <>
                          <ShieldCheck className="h-3.5 w-3.5" /> Activate
                        </>
                      )}
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={4} className="px-5 py-8 text-center text-navy/40">
                  No administrators authorized yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
