import { redirect } from 'next/navigation';

export default function ImprintPage() {
  // Keep Squad22's legal identity synchronized with the authoritative
  // Konfydence provider notice instead of duplicating details that can drift.
  redirect('https://konfydence.com/imprint');
}
