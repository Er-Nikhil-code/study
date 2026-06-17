"use client";

import Panel from "@/components/ui/Panel";
import { Shield } from "lucide-react";

export default function AdminRolesPage() {
  return (
    <div className="max-w-4xl mx-auto py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
          <Shield className="text-red-500" />
          Manage Roles
        </h1>
        <p className="text-zinc-400">
          Configure permission-based roles and access control.
        </p>
      </div>

      <Panel className="p-12 text-center border-dashed border-2 border-white/10 bg-transparent">
        <Shield className="w-16 h-16 text-zinc-600 mx-auto mb-4 opacity-50" />
        <h2 className="text-xl font-semibold text-white mb-2">Coming Soon</h2>
        <p className="text-zinc-500 max-w-md mx-auto">
          The comprehensive roles and permissions management interface is currently under development. 
          Please check back later or manage basic roles through the Users tab.
        </p>
      </Panel>
    </div>
  );
}
