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
  BrainCircuit
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
        
        { label: "Courses", href: "/courses", icon: BookOpen },
        { label: "Curriculum", href: "/teacher/hierarchy", icon: Network },
        { label: "Manage Tests", href: "/teacher/tests", icon: FileText },
        
        { label: "AI Generator", href: "/teacher/ai-generation", icon: BrainCircuit },
        { label: "Create Question", href: "/teacher/questions/create", icon: FilePlus2 },
        { label: "Question Bank", href: "/admin/questions", icon: FileQuestion },
        
        { label: "Notes", href: "/intern/notes/create", icon: FileEdit },
        { label: "Review Notes", href: "/teacher/notes/review", icon: FileEdit },
        
        { label: "Users & Roles", href: "/admin/users", icon: Users },
        { label: "Custom Roles", href: "/admin/roles", icon: Shield },
        
        { label: "Send Notification", href: "/admin/notifications", icon: Send },
        { label: "My Notifications", href: "/notifications", icon: Bell },
        
        { label: "System Status", href: "/admin/system", icon: Activity },
      ];

    case "TEACHER":
      return [
        { label: "Dashboard", href: "/teacher", icon: LayoutDashboard },
        { label: "Courses", href: "/courses", icon: BookOpen },
        { label: "Curriculum", href: "/teacher/hierarchy", icon: Network },
        { label: "Create Notes", href: "/intern/notes/create", icon: FileEdit },
        { label: "Notes Review", href: "/teacher/notes/review", icon: FileEdit },
        { label: "AI Generator", href: "/teacher/ai-generation", icon: BrainCircuit },
        { label: "Create Question", href: "/teacher/questions/create", icon: FilePlus2 },
        { label: "Questions", href: "/teacher/questions", icon: FileQuestion },
        { label: "Tests", href: "/teacher/tests", icon: FileText },
        { label: "Challenges", href: "/teacher/challenges", icon: ShieldAlert },
        { label: "Notifications", href: "/notifications", icon: Bell },
        { label: "My Interns", href: "/teacher/interns", icon: Users },
      ];

    case "INTERN": {
      const items: NavItem[] = [
        { label: "Dashboard", href: "/intern/dashboard", icon: LayoutDashboard },
        { label: "My Questions", href: "/intern/questions", icon: BookOpen },
        { label: "Create Questions", href: "/teacher/questions/create", icon: FilePlus2 },
        { label: "Question Statistics", href: "/intern/statistics", icon: BarChart2 },
        { label: "My Earnings", href: "/intern/earnings", icon: Wallet },
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
