import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "YouTube-to-Blog — your video, your voice, your article",
  description:
    "Transform any YouTube video into a blog article in your brand's voice. Configure your style once, each new video auto-generates an on-brand article via UI or API.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
