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
  subItems?: NavItem[];
};

export function getSidebarNavItems(user: AuthUser | null): NavItem[] {
  if (!user) return [];

  const perms = user.custom_role?.permissions_json || [];
  const hasPerm = (p: string) => user.role === "ADMIN" || perms.includes(p) || perms.includes("*");

  // Students have a fixed view for now
  if (user.role === "STUDENT") {
    return [
      { label: "Dashboard", href: "/student/dashboard", icon: LayoutDashboard },
      { label: "Available Courses", href: "/courses", icon: Library },
      { label: "My Results", href: "/results", icon: History },
      { label: "Notifications", href: "/notifications", icon: Bell },
    ];
  }

  // Base Dashboard for Staff
  const items: NavItem[] = [];
  
  if (user.role === "ADMIN") items.push({ label: "King Dashboard", href: "/admin", icon: LayoutDashboard });
  else if (user.role === "TEACHER") items.push({ label: "Knight Dashboard", href: "/teacher", icon: LayoutDashboard });
  else if (user.role === "INTERN") items.push({ label: "Pawn Dashboard", href: "/intern/dashboard", icon: LayoutDashboard });

  // Courses
  items.push({ label: "Courses", href: "/courses", icon: BookOpen });

  // Content & Hierarchy (Removed as curriculum is now managed directly inside courses)

  // AI Features
  if (hasPerm("use_ai_generator") || user.role === "TEACHER") {
    items.push({ label: "AI Generator", href: "/teacher/ai-generation", icon: BrainCircuit });
  }

  // Questions
  if (hasPerm("create_question") || user.role === "TEACHER" || user.role === "INTERN") {
    items.push({ label: "Create Question", href: "/teacher/questions/create", icon: FilePlus2 });
  }
  if (hasPerm("manage_questions") || user.role === "TEACHER" || user.role === "INTERN") {
    items.push({ label: "Question Bank", href: user.role === "ADMIN" ? "/admin/questions" : (user.role === "INTERN" ? "/intern/questions" : "/teacher/questions"), icon: FileQuestion });
  }

  // Tests
  if (hasPerm("manage_tests") || hasPerm("create_test") || user.role === "TEACHER") {
    items.push({ label: "Tests", href: "/teacher/tests", icon: FileText });
  }

  // Notes
  if (hasPerm("review_notes") || user.role === "TEACHER" || user.role === "ADMIN") {
    items.push({ label: "Notes", href: "/teacher/notes/review", icon: FileEdit });
  } else if (hasPerm("create_notes") || user.role === "INTERN") {
    items.push({ label: "Notes", href: "/intern/notes/create", icon: FileEdit });
  }

  // Challenges
  if (hasPerm("manage_challenges") || user.role === "TEACHER") {
    items.push({ label: "Challenges", href: "/teacher/challenges", icon: ShieldAlert });
  }

  // Intern specifics
  if (user.role === "INTERN") {
    items.push({ label: "Question Statistics", href: "/intern/statistics", icon: BarChart2 });
    items.push({ label: "My Earnings", href: "/intern/earnings", icon: Wallet });
  }

  if (user.role === "TEACHER") {
    items.push({ label: "My Pawns", href: "/teacher/interns", icon: Users });
  }

  // User Management
  if (hasPerm("manage_users")) {
    items.push({ label: "Users & Roles", href: "/admin/users", icon: Users });
  }

  // System & Notifications
  if (hasPerm("manage_users") || user.role === "ADMIN") {
    items.push({ label: "Send Notification", href: "/admin/notifications", icon: Send });
  }
  items.push({ label: "My Notifications", href: "/notifications", icon: Bell });
  
  if (hasPerm("system_health") || user.role === "ADMIN") {
    items.push({ label: "System Status", href: "/admin/system", icon: Activity });
  }

  return items;
}
