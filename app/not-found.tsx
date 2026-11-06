import Link from "next/link";

export default function NotFound() {
  return (
    <main id="main" tabIndex={-1} className="mx-auto max-w-xl px-5 py-16">
      <h1 className="text-2xl font-semibold">I can&apos;t find that page</h1>
      <p className="mt-3 text-neutral-700">The link may be old or mistyped.</p>
      <Link href="/" className="button-link mt-5 rounded-lg bg-black px-6 py-3 font-medium text-white hover:bg-neutral-800">Back to Home</Link>
    </main>
  );
}
