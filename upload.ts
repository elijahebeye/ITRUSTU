import { supabase } from '@/lib/supabaseClient';

export async function uploadAvatar(file) {
  const { data: sessionData } = await supabase.auth.getSession();
  const user = sessionData.session?.user;
  if (!user) throw new Error('Not signed in');

  const path = `${user.id}/${Date.now()}-${file.name}`;
  const { error: uploadErr } = await supabase.storage.from('avatars').upload(path, file);
  if (uploadErr) throw uploadErr;

  const { data } = supabase.storage.from('avatars').getPublicUrl(path);
  const publicUrl = data.publicUrl;

  await supabase.from('profiles').update({ avatar_url: publicUrl }).eq('id', user.id);
  return publicUrl;
}
