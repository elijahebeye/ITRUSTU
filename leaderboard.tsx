import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/hooks/useAuth';

export default function LeaderboardPage() {
  const qc = useQueryClient();
  const { user } = useAuth();

  const { data: rows, isLoading } = useQuery(['leaderboard'], async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, username, avatar_url, reputation, trust_balance')
      .order('reputation', { ascending: false })
      .limit(100);
    if (error) throw error;
    return data;
  }, { refetchInterval: 30000 });

  async function vouch(targetId) {
    try {
      const { error } = await supabase.rpc('vouch', { target: targetId, amount: 0.2 });
      if (error) throw error;
      qc.invalidateQueries(['leaderboard']);
    } catch (err) {
      alert(err.message || 'Vouch failed');
    }
  }

  if (isLoading) return <div style={{padding:20}}>Loading...</div>;

  return (
    <div style={{ padding: 20 }}>
      <h1>Top 100 — iTRuST</h1>
      <ul style={{ listStyle: 'none', padding: 0 }}>
        {rows.map((p, i) => (
          <li key={p.id} style={{ display:'flex', gap:12, alignItems:'center', padding:'10px 0', borderBottom:'1px solid #eee' }}>
            <div style={{ width:24, textAlign:'right' }}>{i+1}</div>
            <img src={p.avatar_url ?? 'https://placehold.co/40'} width={40} height={40} style={{ borderRadius:20 }} alt="" />
            <div style={{ flex:1 }}>
              <div>{p.username ?? p.id.slice(0,6)}</div>
              <small>Reputation: {Number(p.reputation ?? 0).toFixed(1)} · TRUST: {Number(p.trust_balance ?? 0).toFixed(1)}</small>
            </div>
            <button onClick={() => vouch(p.id)} disabled={!user || user.id === p.id}>
              {user && user.id === p.id ? '—' : 'Vouch'}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
