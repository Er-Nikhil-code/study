import { AuthUser } from "@/store/auth.store";
import {
  LayoutDashboard,
  Users,
  FileQuestion,
  CheckSquare,
  ShieldAlert,
  Activity,
  Network,
  FileText,
  PlusCircle,
  FileEdit,
  Send,
  XCircle,
  BarChart2,
  Bell,
  User,
  Library,
  Calendar,
  History,
  PieChart,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type NavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
};

export function getSidebarNavItems(user: AuthUser | null): NavItem[] {
  if (!user) return [];

  const perms = user.custom_role?.permissions_json || [];
  const hasPerm = (p: string) => perms.includes(p) || perms.includes("*");

  switch (user.role) {
    case "ADMIN":
      return [
        { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
        { label: "Users & Roles", href: "/admin/users", icon: Users },
        { label: "Questions", href: "/admin/questions", icon: FileQuestion },
        { label: "Approvals", href: "/admin/approvals", icon: CheckSquare },
        { label: "Challenges", href: "/admin/challenges", icon: ShieldAlert },
        { label: "System Status", href: "/admin/system", icon: Activity },
      ];

    case "TEACHER":
      return [
        { label: "Dashboard", href: "/teacher", icon: LayoutDashboard },
        { label: "Hierarchy", href: "/teacher/hierarchy", icon: Network },
        { label: "Questions", href: "/teacher/questions", icon: FileQuestion },
        { label: "Tests", href: "/teacher/tests", icon: FileText },
        { label: "Challenges", href: "/teacher/challenges", icon: ShieldAlert },
      ];

    case "INTERN": {
      const items: NavItem[] = [
        { label: "Dashboard Overview", href: "/intern/dashboard", icon: LayoutDashboard },
        { label: "Create Question", href: "/teacher/questions/create", icon: PlusCircle },
        { label: "Draft Questions", href: "/teacher/questions?status=draft", icon: FileEdit },
        { label: "Submitted Questions", href: "/teacher/questions?status=submitted", icon: Send },
        { label: "Rejected Questions", href: "/teacher/questions?status=rejected", icon: XCircle },
        { label: "Question Statistics", href: "/intern/statistics", icon: BarChart2 },
        { label: "Notifications", href: "/notifications", icon: Bell },
        { label: "Profile", href: "/profile", icon: User },
      ];

      // Dynamic permissions
      if (hasPerm("create_test") || hasPerm("manage_test")) {
        items.splice(6, 0, { label: "Tests", href: "/teacher/tests", icon: FileText });
      }
      return items;
    }

    case "STUDENT":
      return [
        { label: "Dashboard Overview", href: "/student/dashboard", icon: LayoutDashboard },
        { label: "Available Tests", href: "/tests", icon: Library },
        { label: "Previous Tests", href: "/results", icon: History },
        { label: "Notifications", href: "/notifications", icon: Bell },
        { label: "Profile", href: "/profile", icon: User },
      ];

    default:
      return [];
  }
}
