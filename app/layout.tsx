import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import ThemeToggle from "@/components/theme-toggle";
import "./globals.css";

export const metadata: Metadata = {
  title: "SkillBridge",
  description: "Role-based attendance management for training sessions.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const themeScript = `
    (() => {
      try {
        const savedTheme = window.localStorage.getItem("skillbridge-theme");
        const theme = savedTheme === "light" || savedTheme === "dark"
          ? savedTheme
          : "dark";
        document.documentElement.classList.toggle("dark", theme === "dark");
        document.documentElement.dataset.theme = theme;
      } catch {
        document.documentElement.dataset.theme = "light";
      }
    })();
  `;

  return (
    <ClerkProvider>
      <html lang="en" suppressHydrationWarning>
        <head>
          <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        </head>
        <body>
          <ThemeToggle />
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}
