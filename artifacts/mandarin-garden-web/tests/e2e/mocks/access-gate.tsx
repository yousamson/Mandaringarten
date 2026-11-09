import type { ReactNode } from 'react';
import type { Language } from '@/lib/garden-data';

export function AccessChecking({ l: _language }: { l: Language }) {
  return null;
}

export function AccessError({ l: _language }: { l: Language; onRetry?: () => void }) {
  return null;
}

export function AccountSignOut({ l: _language }: { l: Language }) {
  return null;
}

export function MemberGate({ children }: { l: Language; children: ReactNode }) {
  return children;
}

export function MembershipPage({ children: _children, l: _language }: { children?: ReactNode; l: Language }) {
  return null;
}
