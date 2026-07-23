"use client";

import {
  ReactNode,
  useState,
} from "react";

import AdminHeader from "./AdminHeader";
import AdminSidebar from "./AdminSidebar";

type AdminLayoutProps = {
  children: ReactNode;
};

export default function AdminLayout({
  children,
}: AdminLayoutProps) {
  const [
    mobileSidebarOpen,
    setMobileSidebarOpen,
  ] = useState(false);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <AdminSidebar
        mobileOpen={
          mobileSidebarOpen
        }
        onMobileClose={() =>
          setMobileSidebarOpen(false)
        }
      />

      <div className="min-h-screen lg:pl-[286px]">
        <AdminHeader
          onMenuOpen={() =>
            setMobileSidebarOpen(true)
          }
        />

        <main className="min-h-[calc(100vh-80px)] bg-[radial-gradient(circle_at_top_right,rgba(16,185,129,0.055),transparent_28%),radial-gradient(circle_at_bottom_left,rgba(59,130,246,0.04),transparent_30%)]">
          {children}
        </main>
      </div>
    </div>
  );
}