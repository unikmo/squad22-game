import type { Metadata, Viewport } from 'next';
import './globals.css';

const title = 'Squad22 | Online Football Strategy Card Game';
const description = 'Play Squad22 online: build football formations, control the shared Open Pile, complete Position Pairs and use Trait Triples to open positions for the whole table.';

export const metadata: Metadata = {
  title: {
    default: title,
    template: '%s | Squad22',
  },
  description,
  applicationName: 'Squad22',
  category: 'games',
  keywords: [
    'football card game',
    'soccer card game',
    'football strategy game',
    'strategy card game',
    'online football card game',
    'soccer strategy card game',
    'Squad22',
  ],
  authors: [{ name: 'Squad22' }],
  creator: 'Squad22',
  publisher: 'Squad22',
  icons: {
    icon: '/images/logo.webp',
    apple: '/images/logo.webp',
  },
  formatDetection: {
    telephone: false,
    address: false,
    email: false,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
      'max-video-preview': -1,
    },
  },
  openGraph: {
    type: 'website',
    siteName: 'Squad22',
    title,
    description,
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title,
    description,
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  colorScheme: 'dark',
  themeColor: '#07140d',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div className="app-container">{children}</div>
      </body>
    </html>
  );
}
