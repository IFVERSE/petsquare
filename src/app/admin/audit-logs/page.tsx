import { createClient } from "@/lib/supabase/server";
import { ShieldCheck } from "lucide-react";

export default async function AdminAuditLogsPage() {
  const supabase = await createClient();
  const { data: logs } = await supabase
    .from("audit_logs")
    .select("id, action, target_type, target_id, details, created_at, profiles(email, full_name)")
    .order("created_at", { ascending: false })
    .limit(200);

  return (
    <div>
      <h1 className="font-display text-2xl text-navy">Audit Logs</h1>
      <p className="mt-1 text-sm text-navy/50">
        Every admin action taken through this panel — vendor approvals, deal moderation, report
        resolutions, comment moderation, and user suspensions all write here automatically.
      </p>

      <div className="mt-6 overflow-hidden rounded-2xl bg-surface shadow-[var(--shadow-card)]">
        <table className="w-full text-left text-sm">
          <thead className="bg-paper text-xs uppercase tracking-wide text-navy/40">
            <tr>
              <th className="px-4 py-3">Admin</th>
              <th className="px-4 py-3">Action</th>
              <th className="px-4 py-3">Target</th>
              <th className="px-4 py-3">When</th>
            </tr>
          </thead>
          <tbody>
            {(logs ?? []).map((log) => {
              const admin = Array.isArray(log.profiles) ? log.profiles[0] : log.profiles;
              return (
                <tr key={log.id} className="border-t border-paper-dim">
                  <td className="px-4 py-3 text-navy/70">{admin?.full_name || admin?.email || "Unknown"}</td>
                  <td className="px-4 py-3">
                    <span className="flex items-center gap-1.5 font-data text-xs text-navy">
                      <ShieldCheck className="h-3.5 w-3.5 text-sage" /> {log.action}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-navy/50">
                    {log.target_type} · <span className="font-data text-xs">{log.target_id?.slice(0, 8)}</span>
                  </td>
                  <td className="px-4 py-3 text-navy/40">{new Date(log.created_at).toLocaleString()}</td>
                </tr>
              );
            })}
            {(!logs || logs.length === 0) && (
              <tr><td colSpan={4} className="px-4 py-8 text-center text-navy/40">No admin actions logged yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
