import { createClient } from "@/lib/supabase/server";
import BreederDashboard from "@/components/dashboard/BreederDashboard";
import UserDashboard from "@/components/dashboard/UserDashboard";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("account_type, full_name")
    .eq("id", user.id)
    .single();

  if (profile?.account_type === "service_pro") {
    return <BreederDashboard userId={user.id} />;
  }

  return <UserDashboard userId={user.id} userName={profile?.full_name ?? "Utente"} />;
}
