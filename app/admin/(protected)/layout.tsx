import type { ReactNode } from "react";

import AdminLayout from "@/components/admin/AdminLayout";
import AdminRouteGuard from "@/components/admin/AdminRouteGuard";

export default function ProtectedAdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <AdminRouteGuard>
      <AdminLayout>
        {children}
      </AdminLayout>
    </AdminRouteGuard>
  );
}