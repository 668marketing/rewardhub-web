"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import MerchantNav from "@/components/layout/MerchantNav";
import { updateMerchantPassword } from "@/lib/api";

export default function MerchantChangePasswordPage() {
  const router = useRouter();

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    const merchant = JSON.parse(
      localStorage.getItem("merchant") || "{}"
    );

    const merchantId =
      merchant?.merchantId ||
      merchant?.MERCHANT_ID;

    if (!currentPassword)
      return alert("Please enter current password.");

    if (!newPassword)
      return alert("Please enter new password.");

    if (newPassword.length < 6)
      return alert("Password must be at least 6 characters.");

    if (newPassword !== confirmPassword)
      return alert("Passwords do not match.");

    try {
      setSaving(true);

      await updateMerchantPassword({
        merchantId,
        currentPassword,
        newPassword,
      });

      alert("Password changed successfully.");

      router.back();
    } catch (err: any) {
      alert(err.message || "Unable to change password.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <MerchantNav />

      <main className="min-h-screen bg-[#f6f7fb] px-4 py-6 pb-28 md:px-8">
        <section className="mx-auto max-w-2xl">

          <button
            onClick={() => router.back()}
            className="mb-6 text-sm font-black text-slate-500 hover:text-slate-900"
          >
            ← Back
          </button>

          <div className="rounded-[2rem] bg-white p-8 shadow-sm">

            <h1 className="text-3xl font-black text-slate-950">
              Change Password
            </h1>

            <p className="mt-2 text-sm font-bold text-slate-500">
              Update your merchant account password.
            </p >

            <div className="mt-8 space-y-5">

              <div>
                <label className="mb-2 block text-sm font-black text-slate-700">
                  Current Password
                </label>

                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) =>
                    setCurrentPassword(e.target.value)
                  }
                  className="w-full rounded-2xl border border-slate-200 px-5 py-4 font-bold outline-none focus:border-slate-950"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-black text-slate-700">
                  New Password
                </label>

                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) =>
                    setNewPassword(e.target.value)
                  }
                  className="w-full rounded-2xl border border-slate-200 px-5 py-4 font-bold outline-none focus:border-slate-950"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-black text-slate-700">
                  Confirm New Password
                </label>

                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) =>
                    setConfirmPassword(e.target.value)
                  }
                  className="w-full rounded-2xl border border-slate-200 px-5 py-4 font-bold outline-none focus:border-slate-950"
                />
              </div>

              <button
                onClick={handleSave}
                disabled={saving}
                className="mt-4 w-full rounded-2xl bg-slate-950 py-5 text-sm font-black text-white transition hover:bg-black disabled:opacity-50"
              >
                {saving ? "Saving..." : "Change Password"}
              </button>

            </div>

          </div>

        </section>
      </main>
    </>
  );
}