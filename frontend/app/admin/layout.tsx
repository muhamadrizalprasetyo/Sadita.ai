import { RoleShell } from "@/components/role-shell";
export default function Layout({ children }: { children: React.ReactNode }) { return <RoleShell role="ADMIN">{children}</RoleShell>; }
