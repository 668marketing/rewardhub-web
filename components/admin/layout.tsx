"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";

import AdminLayout from "@/components/admin/AdminLayout";
import AdminRouteGuard from "@/components/admin/AdminRouteGuard";

export default function AdminRootLayout({
  children,
}: {
  children: ReactNode;
}) {
  const pathname = usePathname();

  const isLoginPage =
    pathname === "/admin/login";

  if (isLoginPage) {
    return children;
  }

  return (
    <AdminRouteGuard>
      <AdminLayout>
        {children}
      </AdminLayout>
    </AdminRouteGuard>
  );
}