import type { Metadata } from "next";
import "./globals.css";
import AppSidebar from "@/components/sidebar/sidebar";
import {  SidebarProvider } from "@/components/ui/sidebar";
import AppHeader from "@/components/header/header";
import { ClerkProvider } from "@clerk/nextjs";
import ConvexClientProvider from "./convex-client-provider";

export const metadata: Metadata = {
  title: "T3 Clone",
  description: "T3 clone made for Theo's 'Cloneathon'",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <ClerkProvider>
          <ConvexClientProvider>
            <SidebarProvider>
              <AppSidebar />
              <AppHeader />
              <main className="w-full bg-[#FAF3FA]">{children}</main>
            </SidebarProvider>
          </ConvexClientProvider>
        </ClerkProvider>
      </body>
    </html>
  );
}
