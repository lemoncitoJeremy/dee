import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "wanna know dee",
  description: "A little app for getting to know Dee.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
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
