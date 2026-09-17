"use client";

import { useState, useTransition } from "react";
import { EyeOff, Eye, Trash2 } from "lucide-react";
import { setCommentStatus, deleteCommentAdmin } from "@/app/admin/comments/actions";

type Comment = {
  id: string; body: string; status: string; created_at: string;
  author_email: string | null; vendor_name: string; vendor_slug: string;
};

export default function CommentsList({ comments }: { comments: Comment[] }) {
  const [rows, setRows] = useState(comments);
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  function toggle(id: string, current: string) {
    const next = current === "visible" ? "hidden" : "visible";
    startTransition(async () => {
      const result = await setCommentStatus(id, next as "visible" | "hidden");
      if (result?.error) { setError(result.error); return; }
      setRows((r) => r.map((c) => (c.id === id ? { ...c, status: next } : c)));
    });
  }

  function remove(id: string) {
    if (!confirm("Delete this comment permanently?")) return;
    startTransition(async () => {
      const result = await deleteCommentAdmin(id);
      if (result?.error) { setError(result.error); return; }
      setRows((r) => r.filter((c) => c.id !== id));
    });
  }

  return (
    <div className="mt-6 space-y-3">
      {error && <p role="alert" className="text-sm text-coral">{error}</p>}
      {rows.map((c) => (
        <div key={c.id} className={`rounded-2xl p-4 shadow-[var(--shadow-card)] ${c.status === "hidden" ? "bg-paper" : "bg-surface"}`}>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0 break-words">
              <p className="text-sm text-navy">&ldquo;{c.body}&rdquo;</p>
              <p className="mt-1 text-xs text-navy/40">
                {c.author_email ?? "Unknown user"} on{" "}
                <a href={`/vendors/${c.vendor_slug}`} target="_blank" rel="noopener noreferrer" className="hover:underline">{c.vendor_name}</a>
                {" · "}{new Date(c.created_at).toLocaleDateString()}
                {c.status === "hidden" && " · hidden"}
              </p>
            </div>
            <div className="flex shrink-0 gap-2">
              <button onClick={() => toggle(c.id, c.status)} disabled={pending} className="flex min-h-11 min-w-11 items-center justify-center rounded-xl border border-paper-dim text-navy/70 disabled:opacity-50" aria-label={c.status === "visible" ? "Hide comment" : "Show comment"}>
                {c.status === "visible" ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
              <button onClick={() => remove(c.id)} disabled={pending} className="flex min-h-11 min-w-11 items-center justify-center rounded-xl border border-paper-dim text-coral disabled:opacity-50" aria-label="Delete comment">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      ))}
      {rows.length === 0 && <p className="text-sm text-navy/40">No comments yet.</p>}
    </div>
  );
}
