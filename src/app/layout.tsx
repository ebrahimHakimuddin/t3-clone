import type { Metadata } from "next";
import "./globals.css";
import AppSidebar from "@/components/sidebar/sidebar";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import AppHeader from "@/components/header/header";
import { ClerkProvider } from "@clerk/nextjs";

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
    <ClerkProvider>
      <html lang="en">
        <body>
          <SidebarProvider>
            <AppSidebar />
            <AppHeader />
            <SidebarInset className="bg-white  rounded-lg shadow-sm">
              <main className="h-full bg-[#FAF3FA]">{children}</main>
            </SidebarInset>
          </SidebarProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
