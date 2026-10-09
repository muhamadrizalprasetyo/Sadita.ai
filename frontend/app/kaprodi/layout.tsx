import { RoleShell } from "@/components/role-shell";

export default function KaprodiLayout({ children }: { children: React.ReactNode }) {
  return <RoleShell role="KAPRODI">{children}</RoleShell>;
}
