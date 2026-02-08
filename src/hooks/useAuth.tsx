import { useState, useEffect, useRef, createContext, useContext, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

type AppRole = 'admin' | 'landlord' | 'user';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  role: AppRole | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, fullName?: string, accountType?: 'user' | 'landlord') => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  isAdmin: boolean;
  isLandlord: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [role, setRole] = useState<AppRole | null>(null);
  const [loading, setLoading] = useState(true);
  const roleFetchedForRef = useRef<string | null>(null);

  const fetchUserRole = async (userId: string) => {
    // Deduplicate: skip if we already fetched for this user
    if (roleFetchedForRef.current === userId) return;
    roleFetchedForRef.current = userId;

    const { data, error } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .order('created_at', { ascending: true })
      .limit(1)
      .maybeSingle();

    if (!error && data) {
      setRole(data.role as AppRole);
    }
  };

  useEffect(() => {
    let initialSessionHandled = false;

    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          // Only fetch role on sign in or initial — not on token refresh
          if (event === 'SIGNED_IN' || event === 'INITIAL_SESSION') {
            setTimeout(() => fetchUserRole(session.user.id), 0);
          }
        } else {
          setRole(null);
          roleFetchedForRef.current = null;
        }
        setLoading(false);
        initialSessionHandled = true;
      }
    );

    // Fallback: check for existing session if onAuthStateChange hasn't fired
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!initialSessionHandled) {
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user) {
          fetchUserRole(session.user.id);
        }
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    roleFetchedForRef.current = null; // Reset for new sign-in
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error };
  };

  const signUp = async (email: string, password: string, fullName?: string, accountType: 'user' | 'landlord' = 'user') => {
    const redirectUrl = `${window.location.origin}/`;
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: { full_name: fullName, account_type: accountType }
      }
    });
    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setRole(null);
    roleFetchedForRef.current = null;
  };

  const value = {
    user,
    session,
    role,
    loading,
    signIn,
    signUp,
    signOut,
    isAdmin: role === 'admin',
    isLandlord: role === 'landlord',
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

const AUTH_DEFAULTS: AuthContextType = {
  user: null,
  session: null,
  role: null,
  loading: true,
  signIn: async () => ({ error: new Error('Auth not initialized') }),
  signUp: async () => ({ error: new Error('Auth not initialized') }),
  signOut: async () => {},
  isAdmin: false,
  isLandlord: false,
};

export function useAuth() {
  const context = useContext(AuthContext);
  // Return safe defaults instead of throwing to prevent HMR hook-count crashes
  return context ?? AUTH_DEFAULTS;
}
