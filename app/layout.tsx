import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: 'Universo Detalles | Regalos Mágicos',
  description: 'Tienda de detalles, peluches y sorpresas en Bogotá.',
  // ... (aquí pueden ir otras configuraciones si ya tienes)
  
  // 🟢 AÑADE ESTO:
  verification: {
    google: 'MbgabEF9lqL7UHEpqQIBZ6I3gdU_I1cQtFWUu68Cwtg',
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
