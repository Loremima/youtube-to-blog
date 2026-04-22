import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/session";
import { PLAN_LIMITS } from "@/lib/plans";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSessionUser();
  if (!session) redirect("/login");

  const limits = PLAN_LIMITS[session.user.plan];

  return (
    <div className="min-h-screen">
      <header className="border-b border-neutral-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link href="/dashboard" className="text-lg font-semibold">
            YouTube-to-Blog
          </Link>
          <nav className="flex items-center gap-6 text-sm">
            <Link href="/dashboard" className="hover:text-brand">
              Overview
            </Link>
            <Link href="/dashboard/profiles" className="hover:text-brand">
              Style profiles
            </Link>
            <Link href="/dashboard/try" className="hover:text-brand">
              Try it
            </Link>
            <span className="rounded-full bg-neutral-100 px-3 py-1 text-xs font-medium capitalize">
              {session.user.plan} · {limits.monthlyArticles}/mo
            </span>
            <form action="/api/session" method="post" className="inline">
              <input type="hidden" name="_method" value="DELETE" />
              <button
                type="submit"
                formAction="/dashboard/logout"
                className="text-neutral-500 hover:text-neutral-900"
              >
                Sign out
              </button>
            </form>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-6 py-10">{children}</main>
    </div>
  );
}
