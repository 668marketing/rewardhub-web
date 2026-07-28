"use client";

import MemberLayout from "@/components/layout/MemberLayout";
import { useLanguage } from "@/hooks/useLanguage";

export default function ChangePasswordPage() {
  const { t } = useLanguage();

  return (
    <MemberLayout>
      <main style={{ minHeight: "100vh", background: "#f8fafc", padding: "32px 20px" }}>
        <section style={{ maxWidth: "600px", margin: "0 auto", paddingBottom: "120px" }}>
          <h1 style={{ fontSize: "40px", fontWeight: 900, color: "#020617" }}>
            {t("memberChangePassword.title")}
          </h1>

          <div style={{ marginTop: 24, background: "white", borderRadius: 28, padding: 28, boxShadow: "0 12px 35px rgba(15,23,42,0.08)" }}>
            <input placeholder={t("memberChangePassword.currentPassword")} type="password" style={inputStyle} />
            <input placeholder={t("memberChangePassword.newPassword")} type="password" style={inputStyle} />
            <input placeholder={t("memberChangePassword.confirmPassword")} type="password" style={inputStyle} />

            <button style={buttonStyle}>
              {t("memberChangePassword.updatePassword")}
            </button>
          </div>
        </section>
      </main>
    </MemberLayout>
  );
}

const inputStyle = {
  width: "100%",
  marginTop: "14px",
  border: "1px solid #e2e8f0",
  borderRadius: "18px",
  padding: "16px",
  fontWeight: 800,
} as any;

const buttonStyle = {
  marginTop: "20px",
  width: "100%",
  background: "#020617",
  color: "white",
  border: "none",
  borderRadius: "18px",
  padding: "18px",
  fontWeight: 900,
} as any;
