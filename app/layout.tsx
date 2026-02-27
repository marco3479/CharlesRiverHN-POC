import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Charles River Health System",
  description: "Maven AGI-powered billing support flow demo"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
