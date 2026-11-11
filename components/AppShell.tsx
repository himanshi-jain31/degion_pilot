"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { initialsOf, useName } from "@/lib/name";

// Pages that use the slim icon bar on the left
export const SHELL_PATHS = ["/", "/help", "/settings", "/design-files"];

const stroke = { fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round", strokeLinejoin: "round" } as const;
const icons = {
  plus: <path d="M12 5v14M5 12h14" />,
  home: <path d="M4 11l8-7 8 7v8a1 1 0 0 1-1 1h-4v-6H9v6H5a1 1 0 0 1-1-1z" />,
  projects: <><rect x="4" y="5" width="16" height="4" rx="1.5" /><rect x="4" y="11" width="16" height="4" rx="1.5" /><rect x="4" y="17" width="10" height="3" rx="1.5" /></>,
  files: <><path d="M6 3h8l4 4v13a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z" /><path d="M14 3v4h4" /></>,
  help: <><circle cx="12" cy="12" r="9" /><path d="M9.6 9.5a2.5 2.5 0 1 1 3.4 2.3c-.7.3-1 .8-1 1.5M12 17h.01" /></>,
  settings: <><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" /></>,
  person: <><circle cx="12" cy="8" r="3.5" /><path d="M5 20a7 7 0 0 1 14 0" /></>,
};
export type IconName = keyof typeof icons;
export function Icon({ name, size = 22 }: { name: IconName; size?: number }) {
  return (
    <svg aria-hidden="true" width={size} height={size} viewBox="0 0 24 24" {...stroke}>
      {icons[name]}
    </svg>
  );
}

function Item({ href, label, icon, active, accent }: { href: string; label: string; icon: IconName; active?: boolean; accent?: boolean }) {
  return (
    <li className="group relative">
      <Link
        href={href}
        aria-label={label}
        aria-current={active ? "page" : undefined}
        className={`flex h-11 w-11 items-center justify-center rounded-xl transition-colors duration-150 ${
          accent ? "bg-accent text-white hover:bg-[var(--accent-hover)]" : active ? "bg-card text-accent shadow-[0_1px_2px_rgba(28,28,30,0.08)]" : "text-[#4d5a6e] hover:bg-white/70 hover:text-ink"
        }`}
      >
        <Icon name={icon} />
      </Link>
      <span
        role="tooltip"
        className="pointer-events-none absolute left-full top-1/2 z-50 ml-3 hidden -translate-y-1/2 whitespace-nowrap rounded-lg bg-ink px-3 py-1.5 text-sm text-white shadow-lg group-focus-within:block group-hover:block max-sm:bottom-full max-sm:left-1/2 max-sm:top-auto max-sm:mb-3 max-sm:ml-0 max-sm:-translate-x-1/2 max-sm:translate-y-0"
      >
        {label}
      </span>
    </li>
  );
}

// The slim icon bar: along the left on a laptop, along the bottom on a phone
function Sidebar() {
  const path = usePathname();
  const [name] = useName();
  const initials = initialsOf(name);
  return (
    <nav
      aria-label="Main"
      className="fixed z-40 flex items-center border-line bg-white/70 backdrop-blur max-sm:inset-x-0 max-sm:bottom-0 max-sm:justify-around max-sm:border-t max-sm:px-2 max-sm:py-2 sm:inset-y-0 sm:left-0 sm:w-[72px] sm:flex-col sm:justify-between sm:border-r sm:py-5"
    >
      <ul className="flex items-center gap-2 max-sm:contents sm:flex-col">
        <Item href="/#new" label="New design" icon="plus" accent />
        <Item href="/" label="Home" icon="home" active={path === "/"} />
        <Item href="/#projects" label="My projects" icon="projects" active={path.startsWith("/project")} />
        <Item href="/design-files" label="Design files" icon="files" active={path === "/design-files"} />
        <Item href="/help" label="Help" icon="help" active={path === "/help"} />
      </ul>
      <ul className="flex items-center gap-2 max-sm:contents sm:flex-col">
        <Item href="/settings" label="Settings" icon="settings" active={path === "/settings"} />
        <li className="group relative">
          <Link
            href="/settings#name"
            aria-label={initials ? `Your profile (${initials})` : "Your profile"}
            className="flex h-11 w-11 items-center justify-center rounded-full bg-[var(--accent-soft)] text-sm font-medium text-[var(--accent-ink)] transition-colors duration-150 hover:bg-[#e0e4ff]"
          >
            {initials || <Icon name="person" size={20} />}
          </Link>
          <span
            role="tooltip"
            className="pointer-events-none absolute left-full top-1/2 z-50 ml-3 hidden -translate-y-1/2 whitespace-nowrap rounded-lg bg-ink px-3 py-1.5 text-sm text-white shadow-lg group-focus-within:block group-hover:block max-sm:bottom-full max-sm:left-auto max-sm:right-0 max-sm:top-auto max-sm:mb-3 max-sm:ml-0 max-sm:translate-y-0"
          >
            Your profile
          </span>
        </li>
      </ul>
    </nav>
  );
}

// The calm page frame: soft gradient background and the icon bar
export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="shell-bg min-h-screen sm:pl-[72px]">
      <Sidebar />
      {children}
    </div>
  );
}
