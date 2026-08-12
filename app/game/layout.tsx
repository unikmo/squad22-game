import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Play Squad22 | Tactical Football Card Game Demo',
  description:
    'Play the Squad22 tactical demo online. Choose legal moves, compare Position Pairs with global Trait Triple openings, and learn how the shared table changes every decision.',
};

export default function GameLayout({ children }: { children: React.ReactNode }) {
  return children;
}
