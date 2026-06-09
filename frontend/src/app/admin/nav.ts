import { LayoutDashboard, Users, Shield, FileQuestion, CheckSquare, ShieldAlert, Activity } from "lucide-react";

/**
 * Shared navigation items for all admin pages.
 * Single source of truth — imported by every admin page.
 */
export const adminNavItems = [
  { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { label: "Users", href: "/admin/users", icon: Users },
  { label: "Roles", href: "/admin/roles", icon: Shield },
  { label: "Questions", href: "/admin/questions", icon: FileQuestion },
  { label: "Approvals", href: "/admin/approvals", icon: CheckSquare },
  { label: "Challenges", href: "/admin/challenges", icon: ShieldAlert },
  { label: "System", href: "/admin/system", icon: Activity },
];
