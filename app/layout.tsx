import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Get your own AI assistant — Claw by AdaHQ",
  description: "Set up a personal AI assistant connected to Telegram in under 5 minutes. No technical skills needed. Your own private AI, on your own server.",
  openGraph: {
    title: "Get your own AI assistant — Claw by AdaHQ",
    description: "Set up a personal AI assistant connected to Telegram in under 5 minutes. No technical skills needed.",
    url: "https://claw-setup-sigma.vercel.app",
    siteName: "Claw by AdaHQ",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="bg-gray-50 text-gray-900 antialiased">
        {children}
      </body>
    </html>
  );
}
