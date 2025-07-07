import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Navbar } from '@/components/layout/Navbar';
// import { Toaster } from 'react-hot-toast';

const inter = Inter({
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Villa Property Management",
  description: "Professional villa property management system",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} antialiased bg-black text-white transition-colors duration-200`}>
        <Navbar />
        <main className="page-transition">{children}</main>
      </body>
    </html>
  );
}
