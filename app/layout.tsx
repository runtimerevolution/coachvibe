import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CoachOs — Your AI Coaching Platform",
  description: "Voice-powered AI chat, workflow automation, and landing page builder for coaches.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Quicksand:wght@400;500;600;700&family=Red+Hat+Display:wght@500;700;800;900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
