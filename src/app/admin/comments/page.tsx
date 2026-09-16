import { createClient } from "@/lib/supabase/server";
import CommentsList from "@/components/admin/CommentsList";

export default async function AdminCommentsPage() {
  const supabase = await createClient();

  const { data: comments } = await supabase
    .from("comments")
    .select("id, body, status, created_at, profiles(email), vendors(name, slug)")
    .order("created_at", { ascending: false })
    .limit(200);

  return (
    <div>
      <h1 className="font-display text-2xl text-navy">Comments & Community</h1>
      <p className="mt-1 text-sm text-navy/50">
        Pet Owner Feedback left on vendor profiles. Hidden comments stay in the database but
        stop showing publicly.
      </p>
      <CommentsList
        comments={(comments ?? []).map((c) => {
          const author = Array.isArray(c.profiles) ? c.profiles[0] : c.profiles;
          const vendor = Array.isArray(c.vendors) ? c.vendors[0] : c.vendors;
          return {
            ...c,
            author_email: (author as { email?: string } | null)?.email ?? null,
            vendor_name: vendor?.name ?? "Unknown vendor",
            vendor_slug: vendor?.slug ?? "",
          };
        })}
      />
    </div>
  );
}
