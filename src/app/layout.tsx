import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
// Testing imports one by one to identify the problematic component
import { Navbar } from '@/components/layout/Navbar';
import { AuthProvider } from '@/contexts/AuthContext';
import { ToasterProvider } from '@/components/providers/ToasterProvider';
// import { FirebaseConnectionStatus } from '@/components/FirebaseConnectionStatus';

const inter = Inter({
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Villa Property Management",
  description: "Professional villa property management system",
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon.ico',
    apple: '/favicon.ico',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body className={`${inter.className} antialiased bg-black text-white transition-colors duration-200`}>
        <AuthProvider>
          <Navbar />
          <main className="page-transition">{children}</main>
          <ToasterProvider />
          {/* <FirebaseConnectionStatus /> */}
        </AuthProvider>
      </body>
    </html>
  );
}
