import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

// ============================================
// FONTS
// ============================================

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
});

// ============================================
// METADATA
// ============================================

export const metadata: Metadata = {
  title: 'Duelo de Labia | Desenrola AI',
  description: 'Voce ganharia do cara medio nessa conversa? Entre no duelo e descubra.',
  keywords: ['desenrola', 'ai', 'conversas', 'paquera', 'teclado ia'],
  authors: [{ name: 'Desenrola AI' }],
  openGraph: {
    title: 'Duelo de Labia | Desenrola AI',
    description: 'Voce ganharia do cara medio nessa conversa?',
    type: 'website',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#09090b',
};

// ============================================
// ROOT LAYOUT
// ============================================

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className="dark">
      <body
        className={`${inter.variable} font-sans antialiased bg-zinc-950 text-white min-h-screen`}
      >
        {children}
      </body>
    </html>
  );
}
