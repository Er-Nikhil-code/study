import { AuthUser } from "@/store/auth.store";

export type NavItem = {
  label: string;
  href: string;
};

export function getSidebarNavItems(user: AuthUser | null): NavItem[] {
  if (!user) return [];

  const perms = user.custom_role?.permissions_json || [];
  const hasPerm = (p: string) => perms.includes(p) || perms.includes("*");

  switch (user.role) {
    case "ADMIN":
      return [
        { label: "Dashboard", href: "/admin" },
        { label: "Users & Roles", href: "/admin/users" },
        { label: "Questions", href: "/admin/questions" },
        { label: "Approvals", href: "/admin/approvals" },
        { label: "Challenges", href: "/admin/challenges" },
        { label: "System Status", href: "/admin/system" },
      ];

    case "TEACHER":
      return [
        { label: "Dashboard", href: "/teacher" },
        { label: "Hierarchy", href: "/teacher/hierarchy" },
        { label: "Questions", href: "/teacher/questions" },
        { label: "Tests", href: "/teacher/tests" },
        { label: "Challenges", href: "/teacher/challenges" },
      ];

    case "INTERN": {
      const items: NavItem[] = [
        { label: "Dashboard Overview", href: "/intern/dashboard" },
        { label: "Create Question", href: "/teacher/questions/create" }, // Currently they use this endpoint
        { label: "Draft Questions", href: "/teacher/questions?status=draft" }, // Mock links for now
        { label: "Submitted Questions", href: "/teacher/questions?status=submitted" },
        { label: "Rejected Questions", href: "/teacher/questions?status=rejected" },
        { label: "Question Statistics", href: "/intern/dashboard#stats" },
        { label: "Notifications", href: "/notifications" },
        { label: "Profile", href: "/profile" },
      ];

      // Dynamic permissions
      if (hasPerm("create_test") || hasPerm("manage_test")) {
        items.splice(6, 0, { label: "Tests", href: "/teacher/tests" });
      }
      return items;
    }

    case "STUDENT":
      return [
        { label: "Dashboard Overview", href: "/student/dashboard" },
        { label: "Available Tests", href: "/tests" },
        { label: "Scheduled Tests", href: "/student/dashboard#scheduled" },
        { label: "Previous Tests", href: "/results" },
        { label: "Results & Analytics", href: "/student/dashboard#analytics" },
        { label: "Notifications", href: "/notifications" },
        { label: "Profile", href: "/profile" },
      ];

    default:
      return [];
  }
}
