type LogoType = "default" | "member" | "merchant";

export default function Logo({
  type = "default",
  className = "h-12 w-auto",
}: {
  type?: LogoType;
  className?: string;
}) {
  const src =
    type === "merchant"
      ? "/logo/rewardhub-merchant.png"
      : type === "member"
        ? "/logo/rewardhub-member.png"
        : "/logo/rewardhub-logo.png";

  return (
    <img
      src={src}
      alt="RewardHub"
      className={className}
    />
  );
}