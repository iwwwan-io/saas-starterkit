"use client";

import { useState } from "react";
import { useSession, authClient, signOut } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { PageHeader } from "@/components/page-header";
import { toast } from "sonner";
import {
  User,
  Shield,
  KeyRound,
  Mail,
  Calendar,
  Fingerprint,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  LogOut,
  Camera,
  Copy,
  Check,
} from "lucide-react";

export function SettingsClient() {
  const { data: session, isPending } = useSession();
  const router = useRouter();

  // Controlled Profile Form States (fallback to session user)
  const [customName, setCustomName] = useState<string | null>(null);
  const [customImageUrl, setCustomImageUrl] = useState<string | null>(null);
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);

  const name = customName ?? (session?.user?.name || "");
  const imageUrl = customImageUrl ?? (session?.user?.image || "");

  // Password Form States
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [revokeOtherSessions, setRevokeOtherSessions] = useState(true);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // Copy Feedback State
  const [copiedId, setCopiedId] = useState(false);

  const userInitials = name
    ? name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "U";

  // Handle Profile Update (Name & Avatar)
  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Full name cannot be empty.");
      return;
    }

    setIsUpdatingProfile(true);
    try {
      const result = await authClient.updateUser({
        name: name.trim(),
        image: imageUrl.trim() || undefined,
      });

      if (result?.error) {
        toast.error(result.error.message || "Failed to update profile.");
      } else {
        toast.success("Profile updated successfully!");
      }
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "An unexpected error occurred while updating profile."
      );
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  // Handle Password Change
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentPassword) {
      toast.error("Please enter your current password.");
      return;
    }

    if (newPassword.length < 8) {
      toast.error("New password must be at least 8 characters.");
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("New password confirmation does not match.");
      return;
    }

    setIsChangingPassword(true);
    try {
      const result = await authClient.changePassword({
        currentPassword,
        newPassword,
        revokeOtherSessions,
      });

      if (result?.error) {
        toast.error(result.error.message || "Failed to change password.");
      } else {
        toast.success("Password updated successfully!");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      }
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "An unexpected error occurred while changing password."
      );
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleCopyUserId = () => {
    if (!session?.user?.id) return;
    navigator.clipboard.writeText(session.user.id);
    setCopiedId(true);
    toast.success("User ID copied to clipboard!");
    setTimeout(() => setCopiedId(false), 2000);
  };

  const [isSigningOut, setIsSigningOut] = useState(false);

  const handleSignOutAll = async () => {
    if (isSigningOut) return;
    setIsSigningOut(true);
    toast.loading("Signing out...", { id: "sign-out" });
    try {
      await signOut({
        fetchOptions: {
          onSuccess: () => {
            toast.success("Signed out successfully.", { id: "sign-out" });
            router.replace("/login");
            router.refresh();
          },
        },
      });
      router.replace("/login");
      router.refresh();
    } catch {
      router.replace("/login");
      router.refresh();
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in-50 duration-300">
      <PageHeader
        tag="account/profile"
        category="Identity & Security"
        title="Pengaturan Profil & Akun"
        description="Kelola informasi identitas pribadi, avatar, keamanan kredensial, dan preferensi akun Anda."
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column (2 Cols): Forms */}
        <div className="lg:col-span-2 space-y-8">
          {/* Card 1: Informasi Profil */}
          <Card className="border border-border/80 shadow-xs">
            <CardHeader>
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-primary/10 text-primary">
                  <User className="size-4" />
                </div>
                <div>
                  <CardTitle className="text-base font-bold">Informasi Pribadi</CardTitle>
                  <CardDescription className="text-xs">
                    Perbarui nama lengkap dan foto profil yang tampil di dashboard.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>

            <form onSubmit={handleUpdateProfile}>
              <CardContent className="space-y-5">
                {/* Avatar Preview */}
                <div className="flex items-center gap-4 p-4 rounded-xl bg-muted/40 border border-border/60">
                  <Avatar className="size-16 ring-2 ring-primary/20">
                    <AvatarImage src={imageUrl || undefined} alt={name} />
                    <AvatarFallback className="text-base font-bold bg-primary/15 text-primary">
                      {userInitials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="space-y-1">
                    <h4 className="text-sm font-semibold">{name || "Pengguna SaaS"}</h4>
                    <p className="text-xs text-muted-foreground">{session?.user?.email}</p>
                    <div className="flex items-center gap-1.5 pt-1">
                      <Badge variant="outline" className="text-[10px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30">
                        <CheckCircle2 className="size-3 mr-1" />
                        Terautentikasi
                      </Badge>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="fullname" className="text-xs font-semibold">
                      Nama Lengkap
                    </Label>
                    <Input
                      id="fullname"
                      value={name}
                      onChange={(e) => setCustomName(e.target.value)}
                      placeholder="Masukkan nama lengkap Anda"
                      required
                      className="text-xs"
                      disabled={isPending || isUpdatingProfile}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-xs font-semibold flex items-center justify-between">
                      <span>Alamat Email</span>
                      <span className="text-[10px] text-muted-foreground font-normal">Terkunci</span>
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      value={session?.user?.email || ""}
                      readOnly
                      disabled
                      className="text-xs bg-muted/50 cursor-not-allowed"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="avatar-url" className="text-xs font-semibold flex items-center gap-1.5">
                    <Camera className="size-3 text-muted-foreground" />
                    <span>URL Foto Profil (Avatar URL)</span>
                  </Label>
                  <Input
                    id="avatar-url"
                    type="url"
                    value={imageUrl}
                    onChange={(e) => setCustomImageUrl(e.target.value)}
                    placeholder="https://example.com/foto-anda.jpg"
                    className="text-xs"
                    disabled={isPending || isUpdatingProfile}
                  />
                  <p className="text-[11px] text-muted-foreground">
                    Gunakan tautan gambar publik (HTTPS) seperti Unsplash, Gravatar, atau GitHub avatar.
                  </p>
                </div>
              </CardContent>

              <CardFooter className="flex justify-end border-t border-border/60 bg-muted/20 px-6 py-3 rounded-b-xl">
                <Button
                  type="submit"
                  size="sm"
                  className="text-xs font-semibold"
                  disabled={isPending || isUpdatingProfile}
                >
                  {isUpdatingProfile ? (
                    <>
                      <Loader2 className="size-3.5 animate-spin mr-1.5" />
                      Menyimpan...
                    </>
                  ) : (
                    "Simpan Perubahan Profil"
                  )}
                </Button>
              </CardFooter>
            </form>
          </Card>

          {/* Card 2: Keamanan & Password */}
          <Card className="border border-border/80 shadow-xs">
            <CardHeader>
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-primary/10 text-primary">
                  <KeyRound className="size-4" />
                </div>
                <div>
                  <CardTitle className="text-base font-bold">Keamanan & Kata Sandi</CardTitle>
                  <CardDescription className="text-xs">
                    Perbarui kata sandi akun Anda secara berkala untuk menjaga keamanan.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>

            <form onSubmit={handleChangePassword}>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="current-password" className="text-xs font-semibold">
                    Kata Sandi Saat Ini
                  </Label>
                  <Input
                    id="current-password"
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="••••••••••••"
                    required
                    className="text-xs"
                    disabled={isChangingPassword}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="new-password" className="text-xs font-semibold">
                      Kata Sandi Baru
                    </Label>
                    <Input
                      id="new-password"
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Minimal 8 karakter"
                      required
                      className="text-xs"
                      disabled={isChangingPassword}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirm-password" className="text-xs font-semibold">
                      Konfirmasi Kata Sandi Baru
                    </Label>
                    <Input
                      id="confirm-password"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Ketik ulang kata sandi baru"
                      required
                      className="text-xs"
                      disabled={isChangingPassword}
                    />
                  </div>
                </div>

                <div className="pt-2">
                  <label className="flex items-start gap-2.5 cursor-pointer text-xs select-none">
                    <input
                      type="checkbox"
                      checked={revokeOtherSessions}
                      onChange={(e) => setRevokeOtherSessions(e.target.checked)}
                      className="rounded border-border text-primary focus:ring-primary size-4 mt-0.5"
                    />
                    <div className="space-y-0.5">
                      <span className="font-semibold text-foreground">
                        Keluar dari semua perangkat lain
                      </span>
                      <p className="text-[11px] text-muted-foreground">
                        Sangat disarankan jika Anda menduga akun Anda pernah diakses dari perangkat asing.
                      </p>
                    </div>
                  </label>
                </div>
              </CardContent>

              <CardFooter className="flex justify-end border-t border-border/60 bg-muted/20 px-6 py-3 rounded-b-xl">
                <Button
                  type="submit"
                  size="sm"
                  variant="default"
                  className="text-xs font-semibold"
                  disabled={isChangingPassword}
                >
                  {isChangingPassword ? (
                    <>
                      <Loader2 className="size-3.5 animate-spin mr-1.5" />
                      Memperbarui Sandi...
                    </>
                  ) : (
                    "Perbarui Kata Sandi"
                  )}
                </Button>
              </CardFooter>
            </form>
          </Card>
        </div>

        {/* Right Column (1 Col): Account Overview & Danger Zone */}
        <div className="space-y-8">
          {/* Card 3: Metadata Akun */}
          <Card className="border border-border/80 shadow-xs">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-muted text-muted-foreground">
                  <Fingerprint className="size-4" />
                </div>
                <div>
                  <CardTitle className="text-sm font-bold">Metadata Akun</CardTitle>
                  <CardDescription className="text-xs">
                    Detail identitas sesi dan verifikasi.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-3.5 text-xs">
              <div className="space-y-1">
                <span className="text-[11px] font-medium text-muted-foreground">Unique User ID</span>
                <div className="flex items-center gap-2">
                  <code className="text-[11px] font-mono bg-muted p-1.5 rounded truncate flex-1 select-all">
                    {session?.user?.id || "memuat..."}
                  </code>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="size-7 shrink-0"
                    onClick={handleCopyUserId}
                    title="Salin ID"
                  >
                    {copiedId ? <Check className="size-3 text-emerald-500" /> : <Copy className="size-3" />}
                  </Button>
                </div>
              </div>

              <Separator />

              <div className="flex items-center justify-between py-1">
                <span className="text-muted-foreground flex items-center gap-1.5">
                  <Mail className="size-3.5" />
                  Status Email
                </span>
                <Badge variant="outline" className="text-[10px] border-emerald-500/40 text-emerald-600 dark:text-emerald-400">
                  Terdaftar
                </Badge>
              </div>

              <div className="flex items-center justify-between py-1">
                <span className="text-muted-foreground flex items-center gap-1.5">
                  <Shield className="size-3.5" />
                  Penyedia Autentikasi
                </span>
                <span className="font-semibold text-foreground">Email & Password</span>
              </div>

              <div className="flex items-center justify-between py-1">
                <span className="text-muted-foreground flex items-center gap-1.5">
                  <Calendar className="size-3.5" />
                  Sesi Aktif Sejak
                </span>
                <span className="font-mono text-[11px] text-foreground">
                  Sesi Ini
                </span>
              </div>
            </CardContent>

            <CardFooter className="pt-2">
              <Button
                variant="outline"
                size="sm"
                className="w-full text-xs font-semibold text-destructive hover:bg-destructive/10 hover:text-destructive"
                onClick={handleSignOutAll}
              >
                <LogOut className="size-3.5 mr-1.5" />
                Keluar dari Akun
              </Button>
            </CardFooter>
          </Card>

          {/* Card 4: Zona Bahaya (Danger Zone) */}
          <Card className="border border-destructive/30 bg-destructive/5 shadow-xs">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-destructive/15 text-destructive">
                  <AlertTriangle className="size-4" />
                </div>
                <div>
                  <CardTitle className="text-sm font-bold text-destructive">Zona Bahaya</CardTitle>
                  <CardDescription className="text-xs">
                    Tindakan destruktif pada akun.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-2 text-xs text-muted-foreground">
              <p>
                Menghapus akun Anda akan membatalkan semua langganan aktif dan menghapus keanggotaan organisasi Anda secara permanen.
              </p>
            </CardContent>
            <CardFooter>
              <Button
                variant="outline"
                size="sm"
                className="w-full text-xs border-destructive/40 text-destructive hover:bg-destructive hover:text-destructive-foreground transition-colors cursor-not-allowed opacity-70"
                disabled
                title="Hubungi Administrator untuk proses penghapusan data permanen"
              >
                Hapus Akun (Hubungi Admin)
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}
