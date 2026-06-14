import { LayoutDashboard, Users, Shield, FileQuestion, CheckSquare, ShieldAlert, Activity, ShoppingCart, FileText } from "lucide-react";

/**
 * Shared navigation items for all king pages.
 * Single source of truth — imported by every king page.
 */
export const adminNavItems = [
  { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { label: "Users", href: "/admin/users", icon: Users },
  { label: "Enrollments", href: "/admin/enrollments", icon: ShoppingCart },
  { label: "Questions", href: "/admin/questions", icon: FileQuestion },
  { label: "Approvals", href: "/admin/approvals", icon: CheckSquare },
  { label: "Challenges", href: "/admin/challenges", icon: ShieldAlert },
  { label: "Test Series", href: "/admin/test-series", icon: FileText },
  { label: "System", href: "/admin/system", icon: Activity },
];
