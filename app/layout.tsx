import type { Metadata } from "next";
import { getAppName } from "@/lib/env";
import "./globals.css";

const appName = getAppName();

export const metadata: Metadata = {
  title: appName,
  description:
    "AI booking and operations assistant for hospitality and activity venues."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
