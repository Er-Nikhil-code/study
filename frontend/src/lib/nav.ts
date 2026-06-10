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
  BookOpen,
  Shield,
  Trophy,
  Wallet,
  FilePlus2,
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
        { label: "Custom Roles", href: "/admin/roles", icon: Shield },
        { label: "Questions", href: "/admin/questions", icon: FileQuestion },
        { label: "Challenges", href: "/admin/challenges", icon: ShieldAlert },
        { label: "System Status", href: "/admin/system", icon: Activity },
        { label: "Notifications", href: "/notifications", icon: Bell },
      ];

    case "TEACHER":
      return [
        { label: "Dashboard", href: "/teacher", icon: LayoutDashboard },
        { label: "Curriculum", href: "/teacher/hierarchy", icon: Network },
        { label: "Notes Review", href: "/teacher/notes/review", icon: FileEdit },
        { label: "Questions", href: "/teacher/questions", icon: FileQuestion },
        { label: "Tests", href: "/teacher/tests", icon: FileText },
        { label: "Challenges", href: "/teacher/challenges", icon: ShieldAlert },
        { label: "Notifications", href: "/notifications", icon: Bell },
      ];

    case "INTERN": {
      const items: NavItem[] = [
        { label: "Dashboard", href: "/intern/dashboard", icon: LayoutDashboard },
        { label: "My Earnings", href: "/intern/earnings", icon: Wallet },
        { label: "Create Questions", href: "/intern/questions/create", icon: FilePlus2 }
      ];
      if (hasPerm("CREATE_NOTES")) {
        items.push({ label: "Create Notes", href: "/intern/notes/create", icon: FileEdit });
      }
      items.push({ label: "Notifications", href: "/notifications", icon: Bell });
      return items;
    }

    case "STUDENT":
      return [
        { label: "Dashboard", href: "/student/dashboard", icon: LayoutDashboard },
        { label: "Available Courses", href: "/courses", icon: Library },
        { label: "My Results", href: "/results", icon: History },
        { label: "Leaderboard", href: "/leaderboard", icon: Trophy },
        { label: "Notifications", href: "/notifications", icon: Bell },
      ];

    default:
      return [];
  }
}
