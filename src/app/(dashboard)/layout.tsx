"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  User,
  Megaphone,
  MessageCircle,
  Star,
  Crown,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { DASHBOARD_NAV } from "@/lib/constants";

const iconMap: Record<string, React.ElementType> = {
  LayoutDashboard,
  User,
  Megaphone,
  MessageCircle,
  Star,
  Crown,
  Settings,
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-muted">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar */}
          <aside className="w-full lg:w-64 shrink-0">
            <nav className="bg-white rounded-xl border border-border p-2 space-y-1">
              {DASHBOARD_NAV.map((item) => {
                const Icon = iconMap[item.icon] || LayoutDashboard;
                const isActive =
                  pathname === item.href ||
                  (item.href !== "/dashboard" &&
                    pathname.startsWith(item.href));

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                      isActive
                        ? "bg-primary-light text-primary-dark"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </aside>

          {/* Main content */}
          <div className="flex-1 min-w-0">{children}</div>
        </div>
      </div>
    </div>
  );
}
