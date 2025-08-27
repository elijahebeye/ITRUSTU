import { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

export default function AuthModal() {
  const [email, setEmail] = useState('');
  const [msg, setMsg] = useState('');

  async function sendMagicLink(e) {
    e.preventDefault();
    setMsg('Sending magic link...');
    try {
      const { data, error } = await supabase.auth.signInWithOtp({ email });
      if (error) {
        setMsg(error.message || 'Error sending link');
      } else {
        setMsg('Check your email for the magic link');
      }
    } catch (err) {
      setMsg('Error sending link');
    }
  }

  return (
    <div style={{ maxWidth: 420, margin: '0 auto' }}>
      <h3>Sign in with email</h3>
      <form onSubmit={sendMagicLink}>
        <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" style={{ width: '100%', padding: 8 }} />
        <button type="submit" style={{ marginTop: 8, padding: '8px 12px' }}>Send magic link</button>
      </form>
      <p>{msg}</p>
    </div>
  );
}
