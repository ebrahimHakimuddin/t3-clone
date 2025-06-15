"use client";

import Link from "next/link";
import { SidebarTrigger, useSidebar } from "../ui/sidebar";
import { Button } from "../ui/button";
import { Plus } from "lucide-react";

export default function AppHeader() {
  const { open, isMobile } = useSidebar();

  return (
    <header
      className={`fixed z-50 ${isMobile ? "bottom-4 left-4" : "top-4 left-4"}`}
    >
      {(!open || isMobile) && (
        <div className="w-fit h-fit bg-background border border-border rounded-md shadow-md hover:shadow-lg transition-shadow flex items-center p-1">
          <SidebarTrigger />
          <div className="h-6 w-px bg-border mx-2" />
          <Link href="/" className="hover:cursor-pointer">
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 hover:bg-accent hover:text-accent-foreground rounded-sm transition-colors"
              title="New Chat"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      )}
    </header>
  );
}
