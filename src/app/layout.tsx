import type { Metadata } from "next";
import "./globals.css";

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
      <body>{children}</body>
    </html>
  );
}
