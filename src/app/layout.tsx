import type { Metadata, Viewport } from "next";
import { Figtree, Source_Serif_4, JetBrains_Mono } from "next/font/google";
import { AppProvider } from "@/lib/store";
import "./globals.css";

const figtree = Figtree({
  subsets: ["latin"],
  variable: "--font-figtree",
  display: "swap",
});

const sourceSerif = Source_Serif_4({
  subsets: ["latin"],
  variable: "--font-source-serif",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "IELTS Max — 24-Day Intensive English & IELTS Platform",
  description:
    "Structured 24-day and 48-day intensive English and IELTS preparation platform with computer-delivered mock exams, Reading Room, SRS Word Bank, and Admin CMS.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

const FOUC_SCRIPT = `
try {
  var pref = localStorage.getItem("color-scheme");
  var meta = document.querySelector('meta[name="color-scheme"]');
  if (meta) meta.content = (pref === "light" || pref === "dark") ? pref : "light dark";
  if (pref === "dark") document.documentElement.classList.add("dark");
  else if (pref === "light") document.documentElement.classList.remove("dark");
} catch (e) {}
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${figtree.variable} ${sourceSerif.variable} ${jetbrainsMono.variable}`}
    >
      <head>
        <meta name="color-scheme" content="light dark" />
        <script dangerouslySetInnerHTML={{ __html: FOUC_SCRIPT }} />
      </head>
      <body className="min-h-dvh bg-background text-foreground antialiased">
        <AppProvider>{children}</AppProvider>
      </body>
    </html>
  );
}
