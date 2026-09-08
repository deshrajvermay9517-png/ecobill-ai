import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "EcoBill AI | Climate Intelligence from Electricity Bills",
  description:
    "Turn your electricity bill into an actionable climate plan. Understand energy usage, estimate real carbon impact with deterministic calculations, and discover realistic reduction opportunities.",
  keywords: [
    "electricity bill",
    "carbon footprint",
    "energy efficiency",
    "climate plan",
    "grid emissions",
    "EcoBill AI",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[#fcfdfd] text-slate-900">
        <Navbar />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
