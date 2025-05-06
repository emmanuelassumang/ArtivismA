import type { Metadata } from "next";
import localFont from "next/font/local";
import { ThemeProvider } from "next-themes";
import "./globals.css";
import Navbar from "../components/Navbar";
import AccessibilityMenu from "../components/AccessibilityMenu";
import { AccessibilityProvider } from "../components/AccessibilityContext";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "Artivism - Mapping Art that Makes a Difference",
  description: "Discover and explore street art and urban installations around the world.",
  keywords: "street art, urban art, murals, artivism, map, explore, public art",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <AccessibilityProvider>
            <Navbar />
            {children}
            <AccessibilityMenu />
          </AccessibilityProvider>
        </ThemeProvider>
        
        {/* Script to apply saved preferences immediately on load */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  // Apply grayscale if saved
                  if (localStorage.getItem('greyscale') === 'true') {
                    document.documentElement.classList.add('greyscale');
                  }
                  
                  // Apply font size if saved
                  const savedFontSize = localStorage.getItem('fontSize');
                  if (savedFontSize) {
                    document.documentElement.style.fontSize = \`\${savedFontSize}rem\`;
                  }
                } catch (e) {
                  console.error('Error applying saved accessibility preferences:', e);
                }
              })();
            `,
          }}
        />
      </body>
    </html>
  );
}
