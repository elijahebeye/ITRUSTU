import { QueryClient, QueryFunction } from "@tanstack/react-query";
import { supabase } from "@/lib/supabaseClient";

function makeResp(ok, status, payload) {
  return {
    ok: !!ok,
    status: status ?? (ok ? 200 : 400),
    text: async () => (typeof payload === 'string' ? payload : JSON.stringify(payload)),
    json: async () => payload,
  };
}

export async function apiRequest(method: string, url: string, data?: any): Promise<any> {
  // Map old /api/* endpoints to Supabase operations
  try {
    // AUTH - register / login via magic link
    if ((url === "/api/auth/register" || url === "/api/auth/login") && method === "POST") {
      const email = data?.email ?? data?.emailAddress ?? (data instanceof FormData ? data.get('email') : undefined);
      if (!email) return makeResp(false, 400, { message: "Email required" });
      const { error } = await supabase.auth.signInWithOtp({ email });
      if (error) return makeResp(false, 400, { message: error.message });
      return makeResp(true, 200, { message: "Magic link sent" });
    }

    // LOGOUT
    if (url === "/api/auth/logout" && method === "POST") {
      const { error } = await supabase.auth.signOut();
      if (error) return makeResp(false, 400, { message: error.message });
      return makeResp(true, 200, {});
    }

    // CURRENT USER
    if (url === "/api/auth/user" && method === "GET") {
      const { data: sessionData } = await supabase.auth.getSession();
      const supaUser = sessionData.session?.user ?? null;
      if (!supaUser) return makeResp(false, 401, { message: "Not signed in" });

      const { data: profile, error } = await supabase
        .from("profiles")
        .select("id, email, username, avatar_url, trust_balance, reputation, joinOrder")
        .eq("id", supaUser.id)
        .maybeSingle();
      if (error) return makeResp(false, 500, { message: error.message });

      return makeResp(true, 200, { user: { id: supaUser.id, email: supaUser.email, profile } });
    }

    // LEADERBOARD
    if (url === "/api/leaderboard" && method === "GET") {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, username, avatar_url, reputation, trust_balance")
        .order("reputation", { ascending: false })
        .limit(100);
      if (error) return makeResp(false, 500, { message: error.message });
      return makeResp(true, 200, { data });
    }

    // USER STATS
    if (url === "/api/user/stats" && method === "GET") {
      const { data: sessionData } = await supabase.auth.getSession();
      const supaUser = sessionData.session?.user ?? null;
      if (!supaUser) return makeResp(false, 401, { message: "Not signed in" });
      const { data: profile, error } = await supabase
        .from("profiles")
        .select("id, username, avatar_url, trust_balance, reputation, joinOrder")
        .eq("id", supaUser.id)
        .maybeSingle();
      if (error) return makeResp(false, 500, { message: error.message });
      return makeResp(true, 200, { data: profile });
    }

    // VOUCH - expect JSON body with target / voucheeId / amount
    if (url === "/api/vouch" && (method === "POST" || method === "PUT")) {
      const target = data?.target ?? data?.voucheeId ?? data?.vouchee_id ?? data?.vouchee;
      const amount = data?.amount ?? data?.trustAmount ?? 0.2;
      if (!target) return makeResp(false, 400, { message: "Target required" });
      const { error } = await supabase.rpc("vouch", { target: target, amount: Number(amount) });
      if (error) return makeResp(false, 400, { message: error.message });
      return makeResp(true, 200, { message: "Vouched" });
    }

    // USERS SEARCH (query param 'q' expected in url or data)
    if (url.startsWith("/api/users/search") && method === "GET") {
      // try to parse q from url ?q=
      const qMatch = url.match(/\?q=(.*)$/);
      const q = qMatch ? decodeURIComponent(qMatch[1]) : (data?.q ?? "");
      if (!q) return makeResp(true, 200, { results: [] });
      const { data, error } = await supabase
        .from("profiles")
        .select("id, username, avatar_url, reputation, trust_balance")
        .ilike("username", `%${q}%`)
        .limit(20);
      if (error) return makeResp(false, 500, { message: error.message });
      return makeResp(true, 200, { results: data });
    }

    // PROFILE UPDATE (file uploads handled elsewhere)
    if (url === "/api/user/profile" && (method === "PUT" || method === "POST")) {
      const { data: sessionData } = await supabase.auth.getSession();
      const supaUser = sessionData.session?.user ?? null;
      if (!supaUser) return makeResp(false, 401, { message: "Not signed in" });
      // Expect data to be object with fields to update: username, avatar_url
      const updates = {};
      if (data?.username) updates['username'] = data.username;
      if (data?.avatar_url) updates['avatar_url'] = data.avatar_url;
      if (Object.keys(updates).length === 0) return makeResp(false, 400, { message: "Nothing to update" });
      const { error } = await supabase.from("profiles").update(updates).eq("id", supaUser.id);
      if (error) return makeResp(false, 500, { message: error.message });
      return makeResp(true, 200, { message: "Profile updated" });
    }

    // Fallback: attempt to call fetch for absolute URLs
    if (url.startsWith("http") || url.startsWith("/")) {
      // If it's a relative URL pointing to /api/*, but wasn't matched, return 404
      return makeResp(false, 404, { message: "API endpoint not implemented in client proxy: " + url });
    }

    return makeResp(false, 400, { message: "Unknown request" });
  } catch (err) {
    return makeResp(false, 500, { message: err.message || String(err) });
  }
}

// QueryClient integration (basic)
export function getQueryFn(opts?: { on401?: "throw" | "return" }): QueryFunction<any, any> {
  return async ({ queryKey }) => {
    const key = queryKey[0];
    if (typeof key === "string" && key.startsWith("/api/")) {
      const res = await apiRequest("GET", key);
      if (!res.ok) {
        if (opts?.on401 === "throw" && res.status === 401) throw new Error("Unauthorized");
        return null;
      }
      const payload = await res.json();
      // our apiRequest returns { data } or { user } etc.
      // Normalize common shapes
      if (payload.data) return payload.data;
      if (payload.user) return payload.user;
      return payload;
    }

    throw new Error("Unsupported query key: " + String(key));
  };
}

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
