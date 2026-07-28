"use client";

import MemberLayout from "@/components/layout/MemberLayout";
import { useLanguage } from "@/hooks/useLanguage";

export default function DevicesPage() {
  const { t } = useLanguage();

  return (
    <MemberLayout>
      <main style={{ minHeight: "100vh", background: "#f8fafc", padding: "32px 20px" }}>
        <section style={{ maxWidth: "700px", margin: "0 auto", paddingBottom: "120px" }}>
          <h1 style={{ fontSize: "40px", fontWeight: 900, color: "#020617" }}>
            {t("memberDevices.title")}
          </h1>

          <div style={{ marginTop: 24, background: "white", borderRadius: 28, padding: 28, boxShadow: "0 12px 35px rgba(15,23,42,0.08)" }}>
            <h2 style={{ margin: 0, fontSize: 24, fontWeight: 900 }}>
              {t("memberDevices.currentDevice")}
            </h2>

            <p style={{ marginTop: 10, color: "#64748b", fontWeight: 700 }}>
              {t("memberDevices.currentDeviceDescription")}
            </p>

            <div style={{ marginTop: 20, background: "#f8fafc", borderRadius: 20, padding: 20 }}>
              <p style={{ margin: 0, fontWeight: 900 }}>
                {t("memberDevices.browserLogin")}
              </p>
              <p style={{ marginTop: 6, color: "#64748b", fontWeight: 700 }}>
                {t("memberDevices.activeNow")}
              </p>
            </div>
          </div>
        </section>
      </main>
    </MemberLayout>
  );
}
