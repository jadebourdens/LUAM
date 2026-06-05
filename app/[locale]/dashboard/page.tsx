import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export default async function DashboardPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('username, brand_name')
    .eq('id', user.id)
    .single();

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold">{profile?.brand_name || profile?.username || 'My'} Store</h1>
      <p className="mt-4">Welcome back! You can manage your inventory here.</p>
      {/* Your inventory components go here */}
    </div>
  );
}