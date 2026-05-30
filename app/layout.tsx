import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "VenuePilot",
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
