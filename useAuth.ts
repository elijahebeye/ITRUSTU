import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export interface AuthUser {
  id: string;
  email: string | null;
  displayName?: string | null;
  avatar_url?: string | null;
  trustBalance?: number | null;
  reputation?: number | null;
  joinOrder?: number | null;
}

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<any>(null);

  useEffect(() => {
    let mounted = true;

    async function load() {
      setIsLoading(true);
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        const supaUser = sessionData.session?.user ?? null;
        if (!supaUser) {
          if (mounted) setUser(null);
          setIsLoading(false);
          return;
        }

        const { data: profile, error: pErr } = await supabase
          .from("profiles")
          .select("id, email, username, avatar_url, trust_balance, reputation, joinOrder")
          .eq("id", supaUser.id)
          .maybeSingle();

        if (pErr) {
          console.warn("Profile fetch error:", pErr);
        }

        const u: AuthUser = {
          id: supaUser.id,
          email: supaUser.email ?? null,
          displayName: profile?.username ?? null,
          avatar_url: profile?.avatar_url ?? null,
          trustBalance: profile?.trust_balance ?? null,
          reputation: profile?.reputation ?? null,
          joinOrder: profile?.joinOrder ?? null,
        };

        if (mounted) setUser(u);
      } catch (err) {
        setError(err);
        console.error(err);
      } finally {
        if (mounted) setIsLoading(false);
      }
    }

    load();

    const { subscription } = supabase.auth.onAuthStateChange((_event, session) => {
      load();
    });

    return () => {
      mounted = false;
      try { subscription?.unsubscribe(); } catch(e){}
    };
  }, []);

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    error,
  };
}
