import Link from "next/link";
import { AppShell } from "@/components/AppShell";

export default function NotFound() {
  return (
    <AppShell>
      <main id="main" tabIndex={-1} className="fade-in mx-auto w-full max-w-xl px-6 pb-24 pt-24">
        <div className="shell-card p-8">
          <h1 className="page-title !text-[28px]">I can&apos;t find that page</h1>
          <p className="text-soft mt-3">The link may be old or mistyped.</p>
          <Link href="/" className="btn btn-primary button-link mt-6">Back to Home</Link>
        </div>
      </main>
    </AppShell>
  );
}
