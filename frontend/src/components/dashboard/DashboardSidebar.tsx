"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, FileUp, History, Wallet, Settings, LogOut } from "lucide-react";
import clsx from "clsx";
import { motion, AnimatePresence } from "framer-motion";
import { useUser } from "@/lib/auth-context";
import { StatementFlowLogo } from "@/components/layout/StatementFlowLogo";

const mainNav = [
  {href: "/dashboard", label: "Dashboard", icon: LayoutDashboard},
  {href: "/dashboard/convert", label: "Convert", icon: FileUp},
  {href: "/dashboard/history", label: "History", icon: History},
  {href: "/dashboard/topup", label: "Top Up", icon: Wallet},
  {href: "/dashboard/settings", label: "Settings", icon: Settings},
];

export function DashboardSidebar() {
  const pathname = usePathname();
  const [hovered, setHovered] = useState<string | null>(null);
  const { logout } = useUser();

  return (
    <aside className="flex w-56 flex-col border-r border-default-200 bg-default-50/50">
      <div className="flex h-14 items-center border-b border-default-100 px-4">
        <Link href="/dashboard" className="flex items-center gap-2">
          <StatementFlowLogo />
        </Link>
      </div>
      <div className="relative flex flex-1 flex-col gap-1 p-3">
        {mainNav.map(({href, label, icon: Icon}) => {
          const isActive = pathname === href;
          const targetRotate = isActive ? 0 : hovered === href ? 30 : 0;

          return (
            <Link
              key={href}
              href={href}
              onMouseEnter={() => setHovered(href)}
              onMouseLeave={() =>
                setHovered((current) => (current === href ? null : current))
              }
              onClick={() => setHovered(null)}
              className={clsx(
                "relative flex items-center rounded-lg px-3 py-2.5 text-sm font-medium transition-colors duration-200",
                isActive
                  ? "text-background"
                  : "text-default-600 hover:bg-default-200/50 hover:text-foreground",
              )}
            >
              <AnimatePresence>
                {isActive && (
                  <motion.span
                    layoutId="sidebar-active-pill"
                    className="absolute inset-0 rounded-lg bg-foreground"
                    transition={{type: "spring", stiffness: 500, damping: 35}}
                  />
                )}
              </AnimatePresence>
              <span className="relative z-10 flex items-center gap-3">
                <motion.span
                  className="inline-flex h-4 w-4 shrink-0 items-center justify-center"
                  animate={{rotate: targetRotate}}
                  transition={
                    hovered === href && !isActive
                      ? {type: "tween", duration: 0.3, ease: "easeOut"}
                      : {type: "tween", duration: 0.15, ease: "easeIn"}
                  }
                >
                  <Icon className="h-4 w-4" />
                </motion.span>
                <span>{label}</span>
              </span>
            </Link>
          );
        })}
      </div>
      <div className="border-t border-default-200 p-3">
        <button
          type="button"
          onClick={logout}
          className="flex w-full cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-default-600 transition-colors hover:bg-default-200/80 hover:text-foreground"
        >
          <LogOut className="h-4 w-4 shrink-0" />
          Logout
        </button>
      </div>
    </aside>
  );
}
