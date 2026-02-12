import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { AudioUnlocker } from '@/components/audio-unlocker';
import { ExitIntentProvider } from '@/components/exit-intent-provider';

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
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              !function(f,b,e,v,n,t,s)
              {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
              n.callMethod.apply(n,arguments):n.queue.push(arguments)};
              if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
              n.queue=[];t=b.createElement(e);t.async=!0;
              t.src=v;s=b.getElementsByTagName(e)[0];
              s.parentNode.insertBefore(t,s)}(window, document,'script',
              'https://connect.facebook.net/en_US/fbevents.js');
              fbq('init', '2012101536189098');
              fbq('track', 'PageView');
            `,
          }}
        />
        <noscript>
          <img
            height="1"
            width="1"
            style={{ display: 'none' }}
            src="https://www.facebook.com/tr?id=2012101536189098&ev=PageView&noscript=1"
          />
        </noscript>
      </head>
      <body
        className={`${inter.variable} font-sans antialiased bg-zinc-950 text-white min-h-screen`}
      >
        <ExitIntentProvider />
        <AudioUnlocker />
        {children}
      </body>
    </html>
  );
}
