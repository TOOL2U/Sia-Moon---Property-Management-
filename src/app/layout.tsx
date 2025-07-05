import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { SupabaseAuthProvider } from "@/contexts/SupabaseAuthContext";
import { SmoothScrollProvider } from "@/components/providers/SmoothScrollProvider";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { ScrollToTop } from "@/components/ui/ScrollToTop";
import { Toaster } from "react-hot-toast";

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
        <SmoothScrollProvider>
          <SupabaseAuthProvider>
            <Navbar />
            <main className="page-transition">{children}</main>
            <Footer />
            <ScrollToTop />
            <Toaster
              position="top-right"
              toastOptions={{
                duration: 4000,
                className: 'animate-slide-in-top',
                style: {
                  background: 'var(--card)',
                  color: 'var(--card-foreground)',
                  boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8)',
                  borderRadius: '0.75rem',
                  border: '1px solid var(--border)',
                  padding: '16px',
                  fontSize: '14px',
                  maxWidth: '400px',
                },
                success: {
                  iconTheme: {
                    primary: '#10b981',
                    secondary: '#000',
                  },
                },
                error: {
                  iconTheme: {
                    primary: '#ef4444',
                    secondary: '#000',
                  },
                },
              }}
            />
          </SupabaseAuthProvider>
        </SmoothScrollProvider>
      </body>
    </html>
  );
}
