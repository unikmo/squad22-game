import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Full Match Beta | Squad22',
  description: 'Play a full multi-round Squad22 match against The Gaffer. Build positions, control the shared Open Pile and use global Trait Triple openings.',
  robots: { index: false, follow: true },
};

export default function PlayLayout({ children }: { children: React.ReactNode }) {
  return children;
}
