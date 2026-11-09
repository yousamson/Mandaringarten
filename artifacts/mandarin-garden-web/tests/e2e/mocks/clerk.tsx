import type { ReactNode } from 'react';

export function ClerkProvider({ children }: { children: ReactNode }) {
  return children;
}

export function Show({ when, children }: { when: 'signed-in' | 'signed-out'; children: ReactNode }) {
  return when === 'signed-out' ? children : null;
}

export function useUser() {
  return { isLoaded: true, isSignedIn: false, user: null };
}

export function useAuth() {
  return { getToken: async () => null, userId: null };
}

export function useClerk() {
  return { signOut: async () => undefined };
}

export function SignIn() {
  return <div data-testid="mock-clerk-sign-in" />;
}

export function SignUp() {
  return <div data-testid="mock-clerk-sign-up" />;
}
