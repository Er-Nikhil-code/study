"use client";

import { useEffect, useState, useRef } from "react";
import DashboardShell from "@/components/layout/DashboardShell";
import Panel from "@/components/ui/Panel";
import { useAuthStore } from "@/store/auth.store";
import authService from "@/services/auth.service";
import { User, Lock, Phone, BookOpen, Camera } from "lucide-react";
import { toast } from "sonner";

export default function ProfilePage() {
  const { user, setAuth } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [profileData, setProfileData] = useState<any>(null);

  // Form states
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [profilePicture, setProfilePicture] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image size should be less than 5MB");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setProfilePicture(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  useEffect(() => {
    const fetchMe = async () => {
      try {
        const res = await authService.me();
        const u = res.user;
        setProfileData(u);
        setFirstName(u.first_name || u.firstName || "");
        setLastName(u.last_name || u.lastName || "");
        setPhoneNumber(u.phone_number || "");
        setProfilePicture(u.profile_picture || "");
      } catch (err) {
        console.error("Failed to fetch profile", err);
      }
    };
    fetchMe();
  }, []);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload: any = {
        first_name: firstName,
        last_name: lastName,
        phone_number: phoneNumber,
      };

      if (oldPassword && newPassword) {
        payload.old_password = oldPassword;
        payload.new_password = newPassword;
      }

      if (profilePicture) {
        payload.profile_picture = profilePicture;
      }

      const token = localStorage.getItem("accessToken") || "";
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/profile`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || "Failed to update profile");
      }

      const data = await res.json();
      toast.success("Profile updated successfully!");
      // Update global auth store with new values
      if (user) {
        setAuth(
          { ...user, first_name: firstName, last_name: lastName, profile_picture: profilePicture } as any,
          token
        );
      }
      setOldPassword("");
      setNewPassword("");
    } catch (err: any) {
      toast.error(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  if (!user || !profileData) {
    return (
      <DashboardShell activeHref="/profile">
        <div className="flex h-64 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-red-500"></div>
        </div>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell activeHref="/profile">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-white">Profile Settings</h1>
        <p className="text-sm text-zinc-500 mt-1">Update your account details and password.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
        {/* Main form */}
        <Panel className="p-6">
          <form onSubmit={handleUpdate} className="space-y-6">
            
            <div className="flex items-center gap-4 border-b border-white/10 pb-6">
              <div className="relative h-20 w-20 overflow-hidden rounded-full bg-zinc-800 border-2 border-white/10 flex items-center justify-center">
                {profilePicture ? (
                   <img src={profilePicture} alt="Profile" className="h-full w-full object-cover" />
                ) : (
                  <User size={32} className="text-zinc-500" />
                )}
                <div 
                  className="absolute inset-0 bg-black/50 opacity-0 hover:opacity-100 flex items-center justify-center transition cursor-pointer"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Camera size={20} className="text-white" />
                </div>
                <input 
                  type="file" 
                  accept="image/jpeg, image/png, image/webp" 
                  className="hidden" 
                  ref={fileInputRef} 
                  onChange={handleImageUpload} 
                />
              </div>
              <div>
                <h3 className="text-lg font-medium text-white">{firstName} {lastName}</h3>
                <p className="text-sm text-zinc-500">{user.email}</p>
                <div className="mt-1 inline-flex rounded-full bg-red-500/10 px-2 py-0.5 text-xs font-medium text-red-300">
                  {user.role}
                </div>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-xs font-medium uppercase tracking-[0.1em] text-zinc-500">First Name</label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <User className="h-4 w-4 text-zinc-500" />
                  </div>
                  <input
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="block w-full rounded-xl border border-white/10 bg-white/[0.02] py-2.5 pl-10 pr-3 text-sm text-white placeholder-zinc-500 transition focus:border-red-500/50 focus:bg-white/[0.04] focus:outline-none focus:ring-1 focus:ring-red-500/50"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium uppercase tracking-[0.1em] text-zinc-500">Last Name</label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <User className="h-4 w-4 text-zinc-500" />
                  </div>
                  <input
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="block w-full rounded-xl border border-white/10 bg-white/[0.02] py-2.5 pl-10 pr-3 text-sm text-white placeholder-zinc-500 transition focus:border-red-500/50 focus:bg-white/[0.04] focus:outline-none focus:ring-1 focus:ring-red-500/50"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium uppercase tracking-[0.1em] text-zinc-500">Phone Number</label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <Phone className="h-4 w-4 text-zinc-500" />
                </div>
                <input
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="+1 (555) 000-0000"
                  className="block w-full rounded-xl border border-white/10 bg-white/[0.02] py-2.5 pl-10 pr-3 text-sm text-white placeholder-zinc-500 transition focus:border-red-500/50 focus:bg-white/[0.04] focus:outline-none focus:ring-1 focus:ring-red-500/50"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium uppercase tracking-[0.1em] text-zinc-500">Profile Picture URL</label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <Camera className="h-4 w-4 text-zinc-500" />
                </div>
                <input
                  type="url"
                  value={profilePicture}
                  onChange={(e) => setProfilePicture(e.target.value)}
                  placeholder="https://example.com/avatar.jpg"
                  className="block w-full rounded-xl border border-white/10 bg-white/[0.02] py-2.5 pl-10 pr-3 text-sm text-white placeholder-zinc-500 transition focus:border-red-500/50 focus:bg-white/[0.04] focus:outline-none focus:ring-1 focus:ring-red-500/50"
                />
              </div>
            </div>

            <div className="border-t border-white/10 pt-6">
              <h3 className="text-sm font-medium text-white mb-4">Change Password</h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-xs font-medium uppercase tracking-[0.1em] text-zinc-500">Current Password</label>
                  <div className="relative">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                      <Lock className="h-4 w-4 text-zinc-500" />
                    </div>
                    <input
                      type="password"
                      value={oldPassword}
                      onChange={(e) => setOldPassword(e.target.value)}
                      placeholder="••••••••"
                      className="block w-full rounded-xl border border-white/10 bg-white/[0.02] py-2.5 pl-10 pr-3 text-sm text-white placeholder-zinc-500 transition focus:border-red-500/50 focus:bg-white/[0.04] focus:outline-none focus:ring-1 focus:ring-red-500/50"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-medium uppercase tracking-[0.1em] text-zinc-500">New Password</label>
                  <div className="relative">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                      <Lock className="h-4 w-4 text-zinc-500" />
                    </div>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="••••••••"
                      className="block w-full rounded-xl border border-white/10 bg-white/[0.02] py-2.5 pl-10 pr-3 text-sm text-white placeholder-zinc-500 transition focus:border-red-500/50 focus:bg-white/[0.04] focus:outline-none focus:ring-1 focus:ring-red-500/50"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <button
                type="submit"
                disabled={loading}
                className="rounded-xl bg-red-600 px-6 py-2.5 text-sm font-medium text-white shadow-[0_0_15px_rgba(220,38,38,0.5)] transition hover:bg-red-500 hover:shadow-[0_0_25px_rgba(220,38,38,0.6)] disabled:opacity-50"
              >
                {loading ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </form>
        </Panel>

        {/* Sidebar info */}
        <div className="space-y-6">
          <Panel className="p-5 bg-[linear-gradient(135deg,rgba(239,68,68,0.1),transparent)]">
            <h3 className="text-sm font-medium text-white flex items-center gap-2 mb-4">
              <BookOpen size={16} className="text-red-400" />
              Course Information
            </h3>
            <div className="space-y-4">
              <div>
                <p className="text-xs uppercase tracking-[0.1em] text-zinc-500">Enrolled In</p>
                <p className="text-sm text-white mt-1 font-medium">{profileData.course_enrolled || "N/A"}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.1em] text-zinc-500">Account Type</p>
                <p className="text-sm text-white mt-1">{user.role}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.1em] text-zinc-500">Email Address</p>
                <p className="text-sm text-white mt-1 break-all">{user.email}</p>
              </div>
            </div>
          </Panel>
        </div>
      </div>
    </DashboardShell>
  );
}
