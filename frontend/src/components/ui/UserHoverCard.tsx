import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { api } from "@/lib/api";
import { User, Calendar, ShieldCheck } from "lucide-react";

interface UserHoverCardProps {
  userId: string;
  children: React.ReactNode;
}

interface HoverUserInfo {
  id: string;
  first_name: string;
  last_name: string;
  role: string;
  profile_picture?: string;
  created_at: string;
  custom_role?: { name: string } | null;
  assigned_teacher?: { first_name: string; last_name: string } | null;
}

export default function UserHoverCard({ userId, children }: UserHoverCardProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const [userInfo, setUserInfo] = useState<HoverUserInfo | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isHovering) {
      // 300ms delay before showing
      hoverTimeoutRef.current = setTimeout(() => {
        setIsOpen(true);
        if (!userInfo && !isLoading) {
          fetchUserInfo();
        }
      }, 300);
    } else {
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
      }
      setIsOpen(false);
    }
    return () => {
      if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    };
  }, [isHovering, userInfo, isLoading]);

  const fetchUserInfo = async () => {
    setIsLoading(true);
    try {
      const { data } = await api.get(`/auth/users/${userId}/hover`);
      setUserInfo(data);
    } catch (error) {
      console.error("Failed to fetch user hover info", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div 
      className="relative inline-block"
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      <span className="cursor-help underline decoration-dashed decoration-zinc-500 underline-offset-4 hover:text-white transition-colors">
        {children}
      </span>

      {isOpen && (
        <div className="absolute z-[100] w-72 bottom-full left-1/2 -translate-x-1/2 mb-2 p-4 bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl shadow-black/50 animate-in fade-in zoom-in-95 duration-200">
          {/* Arrow */}
          <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-[1px] border-8 border-transparent border-t-zinc-800 border-b-0" />
          <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-0.5 border-8 border-transparent border-t-zinc-900 border-b-0" />

          {isLoading || !userInfo ? (
            <div className="flex items-center justify-center py-4">
              <div className="w-5 h-5 rounded-full border-2 border-red-500 border-t-transparent animate-spin" />
            </div>
          ) : (
            <div className="flex gap-4">
              <div className="shrink-0">
                {userInfo.profile_picture ? (
                  <Image src={userInfo.profile_picture} alt="Profile" width={48} height={48} className="w-12 h-12 rounded-full object-cover bg-zinc-800 border border-zinc-700" />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-zinc-400">
                    <User size={24} />
                  </div>
                )}
              </div>
              <div className="flex flex-col flex-1 min-w-0">
                <h4 className="text-white font-medium truncate">
                  {userInfo.first_name} {userInfo.last_name}
                </h4>
                <div className="flex items-center gap-1.5 mt-1.5">
                  <ShieldCheck size={12} className="text-emerald-500" />
                  <span className="text-xs font-medium text-emerald-400 uppercase tracking-wider">
                    {userInfo.custom_role ? userInfo.custom_role.name : userInfo.role}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 mt-2">
                  <Calendar size={12} className="text-zinc-500" />
                  <span className="text-xs text-zinc-400">
                    Joined {new Date(userInfo.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                  </span>
                </div>
                <div className="mt-1 text-[10px] text-zinc-600 font-mono truncate" title={userInfo.id}>
                  ID: {userInfo.id}
                </div>
                {userInfo.role !== 'ADMIN' && userInfo.role !== 'STUDENT' && (
                  <div className="mt-1.5 pt-1.5 border-t border-zinc-800 text-[10px] text-zinc-400 flex items-center gap-1">
                    <span className="text-zinc-500">Reports to:</span>
                    <span className="font-medium text-zinc-300">
                      {userInfo.role === 'TEACHER' 
                        ? 'Admin' 
                        : (userInfo.assigned_teacher 
                            ? `${userInfo.assigned_teacher.first_name} ${userInfo.assigned_teacher.last_name}` 
                            : 'Admin')}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
