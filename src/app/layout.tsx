import type { Metadata } from "next";
import { Space_Grotesk } from "next/font/google"; // Neo-Brutalist font match
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  weight: ['300', '400', '500', '600', '700'],
  variable: "--font-space",
});

export const metadata: Metadata = {
  title: "ParsePDF - Privacy-First Document Tools",
  description: "Secure, local PDF conversion and manipulation tools.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${spaceGrotesk.variable} antialiased`}
        suppressHydrationWarning
      >
        {children}
      </body>
    </html>
  );
}
