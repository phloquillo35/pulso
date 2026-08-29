import { Shell } from "@/components/shell";
import { getServerUser, isSupabaseEnabled } from "@/lib/supabase/auth";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await getServerUser();
  return (
    <Shell user={user} supabaseEnabled={isSupabaseEnabled()}>
      {children}
    </Shell>
  );
}
