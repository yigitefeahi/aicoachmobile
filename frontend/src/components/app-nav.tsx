"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, BookOpen, CalendarDays, Settings, Sparkles } from "lucide-react";

const hiddenRoutes = new Set(["/", "/login", "/register", "/onboarding"]);
const hiddenPrefixes = ["/interview/presence"];

const links = [
  { href: "/dashboard", label: "Dashboard", icon: BarChart3 },
  { href: "/interview/setup", label: "Practice", icon: Sparkles },
  { href: "/roadmap", label: "Roadmap", icon: CalendarDays },
  { href: "/stories", label: "Stories", icon: BookOpen },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function AppNav() {
  const pathname = usePathname();
  if (
    hiddenRoutes.has(pathname) ||
    hiddenPrefixes.some((prefix) => pathname.startsWith(prefix))
  ) {
    return null;
  }

  return (
    <>
      <nav className="app-shell-nav" aria-label="Primary navigation">
        <Link href="/dashboard" className="app-shell-brand">
          AI Coach
        </Link>
        <div className="app-shell-links">
          {links.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`app-shell-link ${active ? "app-shell-link-active" : ""}`}
              >
                <Icon size={15} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
      <div className="app-shell-spacer" aria-hidden />
    </>
  );
}
