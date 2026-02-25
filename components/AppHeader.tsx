"use client";

import { usePathname, useRouter } from "next/navigation";
import { PanelLeftOpen } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Button } from "@/components/ui/button";

interface AppHeaderProps {
  showSidebarToggle?: boolean;
  sidebarOpen?: boolean;
  onToggleSidebar?: () => void;
}

const NAV_TABS = [
  { label: "Distiller", href: "/" },
  { label: "Kanban", href: "/kanban" },
] as const;

export function AppHeader({ showSidebarToggle, sidebarOpen, onToggleSidebar }: AppHeaderProps) {
  const pathname = usePathname();
  const router = useRouter();

  return (
    <header className="border-b">
      <div className="container mx-auto flex items-center justify-between px-4 py-4 md:px-6">
        <div className="flex items-center gap-4">
          {showSidebarToggle && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onToggleSidebar}
              aria-expanded={sidebarOpen}
              aria-controls="history-sidebar"
              className="lg:hidden"
            >
              <PanelLeftOpen className="h-5 w-5" />
              <span className="sr-only">Toggle history</span>
            </Button>
          )}
          <div>
            <h1 className="text-xl font-bold tracking-tight md:text-2xl">
              Meeting Notes Distiller
            </h1>
            <p className="text-sm text-muted-foreground">
              From chaotic notes to a professional report in seconds
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Navigation tabs */}
          <nav className="flex items-center rounded-full bg-muted p-1">
            {NAV_TABS.map((tab) => {
              const isActive = pathname === tab.href;
              return (
                <button
                  key={tab.href}
                  onClick={() => router.push(tab.href)}
                  className={`rounded-full px-4 py-1.5 text-sm font-medium transition-all ${
                    isActive
                      ? "bg-background shadow text-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </nav>
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
