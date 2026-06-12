import { LayoutDashboard, Users, Shield, FileQuestion, CheckSquare, ShieldAlert, Activity, ShoppingCart } from "lucide-react";

/**
 * Shared navigation items for all king pages.
 * Single source of truth — imported by every king page.
 */
export const adminNavItems = [
  { label: "Dashboard", href: "/king", icon: LayoutDashboard },
  { label: "Users", href: "/king/users", icon: Users },
  { label: "Enrollments", href: "/king/enrollments", icon: ShoppingCart },
  { label: "Roles", href: "/king/roles", icon: Shield },
  { label: "Questions", href: "/king/questions", icon: FileQuestion },
  { label: "Approvals", href: "/king/approvals", icon: CheckSquare },
  { label: "Challenges", href: "/king/challenges", icon: ShieldAlert },
  { label: "System", href: "/king/system", icon: Activity },
];
