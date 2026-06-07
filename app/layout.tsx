import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { DEMO_MODE } from "@/lib/demo";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Client CRM",
  description: "Your own customizable client management system.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  // Resize the layout when the on-screen keyboard opens, so bottom sheets and
  // inputs stay above the keyboard instead of being covered.
  interactiveWidget: "resizes-content",
};

// Set the theme class before paint to avoid a flash of the wrong theme.
const themeScript = `(function(){try{var t=localStorage.getItem('theme');if(t==='dark'||(!t&&window.matchMedia('(prefers-color-scheme: dark)').matches)){document.documentElement.classList.add('dark');}}catch(e){}})();`;

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const html = (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="min-h-full">{children}</body>
    </html>
  );

  // Demo mode runs without Clerk keys, so skip the provider entirely.
  return DEMO_MODE ? html : <ClerkProvider>{html}</ClerkProvider>;
}
