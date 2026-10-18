import { PageShell } from "@/components/PageShell";
import { isAdmin } from "@/server/admin-auth";
import { dashboardStats } from "@/server/orders";
import { logout } from "./actions";
import { AdminNav } from "./AdminNav";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const admin = await isAdmin();
  const stats = admin ? await dashboardStats() : null;
  return (
    <PageShell wide>
      {stats && <AdminNav toShip={stats.toShip} refundNeeded={stats.refundNeeded} logout={logout} />}
      {children}
    </PageShell>
  );
}
