import SecurityCenter from "@/components/security/SecurityCenter";
import MemberLayout from "@/components/layout/MemberLayout";

export default function MemberSecurityPage() {
  return (
    <MemberLayout>
      <SecurityCenter portal="MEMBER" />
    </MemberLayout>
  );
}