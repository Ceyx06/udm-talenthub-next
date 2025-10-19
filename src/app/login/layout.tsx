// app/login/layout.tsx
import { redirect } from "next/navigation";

export const metadata = { title: "Login — UDM TalentHub" };
export const dynamic = "force-dynamic";

export default async function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
