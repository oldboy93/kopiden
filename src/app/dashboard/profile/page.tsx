"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import AppHeader from "@/components/AppHeader";
import {
  User,
  MapPin,
  Camera,
  Save,
  ChevronLeft,
  Loader2,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import Link from "next/link";

export default function ProfilePage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>({
    full_name: "",
    username: "",
    address: "",
    avatar_url: "",
  });
  const [status, setStatus] = useState<{
    type: "success" | "error" | null;
    msg: string;
  }>({ type: null, msg: "" });

  const router = useRouter();

  useEffect(() => {
    async function getProfile() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
        return;
      }
      setUser(user);

      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (profileData) {
        setProfile({
          full_name: profileData.full_name || "",
          username: profileData.username || "",
          address: profileData.address || "",
          avatar_url: profileData.avatar_url || "",
        });
      }
      setLoading(false);
    }
    getProfile();
  }, [router]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setStatus({ type: null, msg: "" });

    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: profile.full_name,
          username: profile.username,
          address: profile.address,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id);

      if (error) throw error;
      setStatus({ type: "success", msg: "Profil berhasil diperbarui! ✨" });
    } catch (error: any) {
      console.error("Update error:", error);
      setStatus({
        type: "error",
        msg: error.message || "Gagal memperbarui profil.",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      if (!e.target.files || e.target.files.length === 0) return;
      setSaving(true);
      const file = e.target.files[0];
      const fileExt = file.name.split(".").pop();
      const filePath = `${user.id}-${Math.random()}.${fileExt}`;

      // Upload to avatars bucket (creating if not exists conceptually)
      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const {
        data: { publicUrl },
      } = supabase.storage.from("avatars").getPublicUrl(filePath);

      const { error: updateError } = await supabase
        .from("profiles")
        .update({ avatar_url: publicUrl })
        .eq("id", user.id);

      if (updateError) throw updateError;

      setProfile({ ...profile, avatar_url: publicUrl });
      setStatus({ type: "success", msg: "Foto profil berhasil diperbarui! ✨" });
    } catch (error: any) {
      console.error("Avatar error:", error);
      setStatus({ 
        type: "error", 
        msg: `Gagal mengunggah: ${error.message}. Pastikan bucket 'avatars' sudah ada dan bersifat publik.` 
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fafafa]">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8f9fa] pb-20">
      <AppHeader title="Profil Saya" />

      <div className="container mx-auto px-4 max-w-lg mt-6">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-gray-500 font-bold text-sm mb-6 hover:text-primary transition-colors"
        >
          <ChevronLeft size={16} /> Kembali ke Dashboard
        </Link>

        {/* Status Message */}
        {status.type && (
          <div
            className={`mb-6 p-4 rounded-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2 duration-300 ${
              status.type === "success"
                ? "bg-emerald-50 text-emerald-600 border border-emerald-100"
                : "bg-red-50 text-red-600 border border-red-100"
            }`}
          >
            {status.type === "success" ? (
              <CheckCircle2 size={20} />
            ) : (
              <AlertCircle size={20} />
            )}
            <span className="text-sm font-bold">{status.msg}</span>
          </div>
        )}

        {/* Profile Form Card */}
        <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-50 overflow-hidden">
          <div className="p-8">
            <div className="flex flex-col items-center mb-8">
              <div className="relative group">
                <div className="w-24 h-24 rounded-[2rem] bg-primary/10 flex items-center justify-center text-primary font-black text-3xl overflow-hidden border-4 border-white shadow-xl">
                  {profile.avatar_url ? (
                    <img
                      src={profile.avatar_url}
                      alt="Avatar"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    profile.full_name?.[0].toUpperCase() || "U"
                  )}
                </div>
                <label className="absolute -bottom-2 -right-2 p-2.5 bg-white rounded-2xl shadow-lg border border-gray-50 cursor-pointer hover:scale-110 active:scale-95 transition-all text-primary">
                  <Camera size={18} />
                  <input
                    type="file"
                    className="hidden"
                    accept="image/*"
                    onChange={handleAvatarUpload}
                  />
                </label>
              </div>
              <h2 className="mt-4 font-black text-xl text-[#1a1a1a]">
                Pengaturan Profil
              </h2>
              <p className="text-gray-400 text-xs font-bold mt-1 uppercase tracking-wider">
                {user?.email}
              </p>
            </div>

            <form onSubmit={handleUpdateProfile} className="space-y-5">
              <div>
                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">
                  Nama Lengkap
                </label>
                <div className="relative">
                  <User
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                    size={18}
                  />
                  <input
                    type="text"
                    value={profile.full_name}
                    onChange={(e) =>
                      setProfile({ ...profile, full_name: e.target.value })
                    }
                    placeholder="Masukkan nama Anda"
                    className="w-full pl-12 pr-4 py-4 bg-gray-50 rounded-2xl border-none focus:ring-2 focus:ring-primary/20 transition-all font-bold text-[#1a1a1a]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">
                  Username
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-black">
                    @
                  </span>
                  <input
                    type="text"
                    value={profile.username}
                    onChange={(e) =>
                      setProfile({ ...profile, username: e.target.value })
                    }
                    placeholder="username"
                    className="w-full pl-10 pr-4 py-4 bg-gray-50 rounded-2xl border-none focus:ring-2 focus:ring-primary/20 transition-all font-bold text-[#1a1a1a]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">
                  Alamat Pengiriman
                </label>
                <div className="relative">
                  <MapPin
                    className="absolute left-4 top-4 text-gray-400"
                    size={18}
                  />
                  <textarea
                    value={profile.address}
                    onChange={(e) =>
                      setProfile({ ...profile, address: e.target.value })
                    }
                    placeholder="Alamat lengkap Anda..."
                    rows={3}
                    className="w-full pl-12 pr-4 py-4 bg-gray-50 rounded-2xl border-none focus:ring-2 focus:ring-primary/20 transition-all font-bold text-[#1a1a1a] resize-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={saving}
                className="w-full bg-[#1a1a1a] text-white py-4 rounded-2xl font-black shadow-xl shadow-black/10 hover:bg-black active:scale-[0.98] transition-all flex items-center justify-center gap-2 mt-4"
              >
                {saving ? (
                  <Loader2 className="animate-spin" size={20} />
                ) : (
                  <>
                    <Save size={20} /> Simpan Perubahan
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
