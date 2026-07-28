import { useState, useEffect, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import type { User, Session } from '@supabase/supabase-js';

interface AuthState {
  user: User | null;
  session: Session | null;
  loading: boolean;
  error: string | null;
}

export function useAuth() {
  const [state, setState] = useState<AuthState>({
    user: null,
    session: null,
    loading: true,
    error: null,
  });

  // ── Listen for auth state changes
  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) {
      setState((s) => ({ ...s, loading: false }));
      return;
    }

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setState((s) => ({
        ...s,
        user: session?.user ?? null,
        session,
        loading: false,
      }));
    });

    // Subscribe to auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setState((s) => ({
        ...s,
        user: session?.user ?? null,
        session,
        loading: false,
      }));
    });

    return () => subscription.unsubscribe();
  }, []);

  // ── Sign in with email/password
  const signIn = useCallback(async (email: string, password: string) => {
    if (!supabase) return;

    setState((s) => ({ ...s, loading: true, error: null }));

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setState((s) => ({
        ...s,
        loading: false,
        error:
          error.message === 'Invalid login credentials'
            ? 'Credenciales inválidas. Verifica tu email y contraseña.'
            : error.message,
      }));
    }
  }, []);

  // ── Sign out
  const signOut = useCallback(async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
  }, []);

  // ── Clear error
  const clearError = useCallback(() => {
    setState((s) => ({ ...s, error: null }));
  }, []);

  return {
    user: state.user,
    session: state.session,
    loading: state.loading,
    error: state.error,
    isAuthenticated: !!state.session,
    signIn,
    signOut,
    clearError,
  };
}
