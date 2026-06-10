"use client";

import { useEffect, useState, useRef } from "react";
import Panel from "@/components/ui/Panel";
import { useAuthStore } from "@/store/auth.store";
import authService from "@/services/auth.service";
import { User, Lock, Phone, BookOpen, Camera, X, Upload, Eye } from "lucide-react";
import { toast } from "sonner";

/**
 * Compress an image file using canvas.
 * Resizes to max 256x256 and outputs as JPEG at 0.7 quality.
 * This keeps the stored base64 string small (~20-40KB).
 */
function compressImage(file: File, maxSize = 256, quality = 0.7): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const reader = new FileReader();
    reader.onload = (e) => {
      img.src = e.target?.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);

    img.onload = () => {
      const canvas = document.createElement("canvas");
      let w = img.width;
      let h = img.height;

      // Scale down proportionally
      if (w > h) {
        if (w > maxSize) { h = Math.round((h * maxSize) / w); w = maxSize; }
      } else {
        if (h > maxSize) { w = Math.round((w * maxSize) / h); h = maxSize; }
      }

      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0, w, h);
      resolve(canvas.toDataURL("image/jpeg", quality));
    };
    img.onerror = reject;
  });
}

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

  // Photo modal
  const [showPhotoModal, setShowPhotoModal] = useState(false);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image size should be less than 5MB");
      return;
    }

    try {
      const compressed = await compressImage(file, 256, 0.7);
      setProfilePicture(compressed);
      setShowPhotoModal(false);
      toast.success("Photo selected! Click 'Save Changes' to apply.");
    } catch {
      toast.error("Failed to process image.");
    }

    // Reset file input so re-selecting the same file works
    if (fileInputRef.current) fileInputRef.current.value = "";
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

      toast.success("Profile updated successfully!");
      // Update global auth store with new values
      if (user) {
        setAuth(
          { ...user, profile_picture: profilePicture } as any,
          token
        );
      }
      // Update local profile data so hasChanges resets
      setProfileData({
        ...profileData,
        first_name: firstName,
        last_name: lastName,
        phone_number: phoneNumber,
        profile_picture: profilePicture,
      });
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
      <>
        <div className="flex h-64 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-red-500"></div>
        </div>
      </>
    );
  }

  const hasChanges =
    firstName !== (profileData.first_name || profileData.firstName || "") ||
    lastName !== (profileData.last_name || profileData.lastName || "") ||
    phoneNumber !== (profileData.phone_number || "") ||
    profilePicture !== (profileData.profile_picture || "") ||
    oldPassword.length > 0 ||
    newPassword.length > 0;

  return (
    <>
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-white">Profile Settings</h1>
        <p className="text-sm text-zinc-500 mt-1">Update your account details and password.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
        {/* Main form */}
        <Panel className="p-6">
          <form onSubmit={handleUpdate} className="space-y-6">
            
            <div className="flex items-center gap-4 border-b border-white/10 pb-6">
              {/* Profile photo — tap to open modal */}
              <button
                type="button"
                onClick={() => setShowPhotoModal(true)}
                className="relative h-20 w-20 overflow-hidden rounded-full bg-zinc-800 border-2 border-white/10 flex items-center justify-center shrink-0 group cursor-pointer transition hover:border-red-500/30"
              >
                {profilePicture ? (
                   <img src={profilePicture} alt="Profile" className="h-full w-full object-cover" />
                ) : (
                  <User size={32} className="text-zinc-500" />
                )}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition">
                  <Camera size={20} className="text-white" />
                </div>
              </button>
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
                  placeholder="Phone number"
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
                      placeholder="Password"
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
                      placeholder="Password"
                      className="block w-full rounded-xl border border-white/10 bg-white/[0.02] py-2.5 pl-10 pr-3 text-sm text-white placeholder-zinc-500 transition focus:border-red-500/50 focus:bg-white/[0.04] focus:outline-none focus:ring-1 focus:ring-red-500/50"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <button
                type="submit"
                disabled={loading || !hasChanges}
                className="rounded-xl bg-red-600 px-6 py-2.5 text-sm font-medium text-white shadow-[0_0_15px_rgba(220,38,38,0.5)] transition hover:bg-red-500 hover:shadow-[0_0_25px_rgba(220,38,38,0.6)] disabled:opacity-50 disabled:cursor-not-allowed"
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

      {/* ── Photo Modal (View / Upload) ── */}
      {showPhotoModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm" onClick={() => setShowPhotoModal(false)}>
          <div
            className="relative w-full max-w-sm rounded-2xl border border-white/10 bg-zinc-950 p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              onClick={() => setShowPhotoModal(false)}
              className="absolute top-3 right-3 rounded-lg p-1 text-zinc-400 hover:text-white hover:bg-white/10 transition"
            >
              <X size={18} />
            </button>

            <h3 className="text-lg font-semibold text-white mb-4">Profile Photo</h3>

            {/* Preview */}
            <div className="flex justify-center mb-6">
              <div className="h-32 w-32 overflow-hidden rounded-full border-2 border-white/10 bg-zinc-800 flex items-center justify-center">
                {profilePicture ? (
                  <img src={profilePicture} alt="Profile" className="h-full w-full object-cover" />
                ) : (
                  <User size={48} className="text-zinc-500" />
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-2">
              {profilePicture && (
                <a
                  href={profilePicture}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm text-zinc-300 transition hover:bg-white/[0.06] hover:text-white"
                >
                  <Eye size={16} />
                  View Full Photo
                </a>
              )}
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center justify-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2.5 text-sm font-medium text-red-200 transition hover:bg-red-500/20"
              >
                <Upload size={16} />
                Upload New Photo
              </button>
              {profilePicture && (
                <button
                  onClick={() => {
                    setProfilePicture("");
                    setShowPhotoModal(false);
                    toast.success("Photo removed. Click 'Save Changes' to apply.");
                  }}
                  className="text-xs text-zinc-500 hover:text-red-400 transition mt-1"
                >
                  Remove Photo
                </button>
              )}
            </div>

            <input
              type="file"
              accept="image/jpeg, image/png, image/webp"
              className="hidden"
              ref={fileInputRef}
              onChange={handleImageUpload}
            />
          </div>
        </div>
      )}
    </>
  );
}
