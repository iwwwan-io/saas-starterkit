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
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/reui/badge";
import { Alert, AlertTitle, AlertDescription, AlertAction } from "@/components/reui/alert";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
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
  AlertTriangle,
  LogOut,
  Camera,
  Copy,
  Check,
} from "lucide-react";

export function SettingsClient() {
  const { data: session, isPending, error, refetch } = useSession();
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
    <div className="flex flex-col gap-8 animate-in fade-in duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:animate-none">
      <PageHeader
        tag="account/profile"
        category="Identity & Security"
        title="Profile & Settings"
        description="Manage your personal identity, avatar, credential security, and account preferences."
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column (2 Cols): Forms */}
        <div className="lg:col-span-2 flex flex-col gap-8">
          {/* Card 1: Profile Information */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-primary/10 text-primary">
                  <User className="size-4" aria-hidden />
                </div>
                <div className="flex flex-col gap-0.5">
                  <CardTitle className="font-bold">Personal Information</CardTitle>
                  <CardDescription>
                    Update the display name and avatar shown across your workspace.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>

            <form onSubmit={handleUpdateProfile}>
              <CardContent className="flex flex-col gap-5">
                {/* Avatar Preview */}
                <div className="flex items-center gap-4 p-4 rounded-xl bg-muted/40 border border-border/60">
                  <Avatar className="size-16 ring-2 ring-primary/20">
                    <AvatarImage src={imageUrl || undefined} alt={name} />
                    <AvatarFallback className="font-bold bg-primary/15 text-primary">
                      {userInitials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col gap-1 min-w-0">
                    {isPending ? (
                      <>
                        <Skeleton aria-hidden className="h-4 w-32" />
                        <Skeleton aria-hidden className="h-3 w-44" />
                      </>
                    ) : (
                      <>
                        <h4 className="text-sm font-semibold truncate">
                          {name || "Unnamed account"}
                        </h4>
                        <p className="text-xs text-muted-foreground truncate">
                          {session?.user?.email}
                        </p>
                        <Badge variant="success-light" className="w-fit">
                          Authenticated
                        </Badge>
                      </>
                    )}
                  </div>
                </div>

                {error && (
                  <Alert variant="destructive">
                    <AlertTriangle aria-hidden />
                    <AlertTitle>Could not load your account</AlertTitle>
                    <AlertDescription>
                      {error.message || "The session request failed."}
                    </AlertDescription>
                    <AlertAction>
                      <Button type="button" variant="outline" size="sm" onClick={() => refetch()}>
                        Retry
                      </Button>
                    </AlertAction>
                  </Alert>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="fullname" className="font-semibold">
                      Full Name
                    </Label>
                    <Input
                      id="fullname"
                      value={name}
                      onChange={(e) => setCustomName(e.target.value)}
                      placeholder="Enter your full name"
                      required
                      disabled={isPending || isUpdatingProfile}
                    />
                  </div>

                  <div className="flex flex-col gap-2">
                    <Label
                      htmlFor="email"
                      className="font-semibold flex items-center justify-between"
                    >
                      <span>Email Address</span>
                      <span className="text-xs text-muted-foreground font-normal">Locked</span>
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      value={session?.user?.email || ""}
                      readOnly
                      disabled
                      className="bg-muted/50 cursor-not-allowed"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <Label htmlFor="avatar-url" className="font-semibold flex items-center gap-1.5">
                    <Camera className="size-3 text-muted-foreground" aria-hidden />
                    <span>Avatar URL</span>
                  </Label>
                  <Input
                    id="avatar-url"
                    type="url"
                    value={imageUrl}
                    onChange={(e) => setCustomImageUrl(e.target.value)}
                    placeholder="https://example.com/your-photo.jpg"
                    disabled={isPending || isUpdatingProfile}
                  />
                  <p className="text-xs text-muted-foreground">
                    Use a public HTTPS image link, such as Unsplash, Gravatar, or a GitHub avatar.
                  </p>
                </div>
              </CardContent>

              <CardFooter className="justify-end">
                <Button type="submit" size="sm" disabled={isPending || isUpdatingProfile}>
                  {isUpdatingProfile ? (
                    <>
                      <Loader2 className="animate-spin" aria-hidden />
                      Saving...
                    </>
                  ) : (
                    "Save Profile"
                  )}
                </Button>
              </CardFooter>
            </form>
          </Card>

          {/* Card 2: Security & Password */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-primary/10 text-primary">
                  <KeyRound className="size-4" aria-hidden />
                </div>
                <div className="flex flex-col gap-0.5">
                  <CardTitle className="font-bold">Security &amp; Password</CardTitle>
                  <CardDescription>
                    Rotate your password periodically to keep the account secure.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>

            <form onSubmit={handleChangePassword}>
              <CardContent className="flex flex-col gap-4">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="current-password" className="font-semibold">
                    Current Password
                  </Label>
                  <Input
                    id="current-password"
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="••••••••••••"
                    required
                    disabled={isChangingPassword}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="new-password" className="font-semibold">
                      New Password
                    </Label>
                    <Input
                      id="new-password"
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="At least 8 characters"
                      required
                      disabled={isChangingPassword}
                    />
                  </div>

                  <div className="flex flex-col gap-2">
                    <Label htmlFor="confirm-password" className="font-semibold">
                      Confirm New Password
                    </Label>
                    <Input
                      id="confirm-password"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Repeat the new password"
                      required
                      disabled={isChangingPassword}
                    />
                  </div>
                </div>

                <div className="flex items-start gap-2.5 pt-1">
                  <Checkbox
                    id="revoke-other-sessions"
                    checked={revokeOtherSessions}
                    onCheckedChange={(checked) => setRevokeOtherSessions(checked === true)}
                    disabled={isChangingPassword}
                    className="mt-0.5"
                  />
                  <Label
                    htmlFor="revoke-other-sessions"
                    className="flex flex-col gap-0.5 cursor-pointer font-normal"
                  >
                    <span className="text-sm font-semibold text-foreground">
                      Sign out of all other devices
                    </span>
                    <span className="text-xs text-muted-foreground">
                      Recommended if you suspect the account was accessed from an unknown device.
                    </span>
                  </Label>
                </div>
              </CardContent>

              <CardFooter className="justify-end">
                <Button type="submit" size="sm" disabled={isChangingPassword}>
                  {isChangingPassword ? (
                    <>
                      <Loader2 className="animate-spin" aria-hidden />
                      Updating...
                    </>
                  ) : (
                    "Update Password"
                  )}
                </Button>
              </CardFooter>
            </form>
          </Card>
        </div>

        {/* Right Column (1 Col): Account Overview & Danger Zone */}
        <div className="flex flex-col gap-8">
          {/* Card 3: Account Metadata */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-muted text-muted-foreground">
                  <Fingerprint className="size-4" aria-hidden />
                </div>
                <div className="flex flex-col gap-0.5">
                  <CardTitle className="font-bold">Account Metadata</CardTitle>
                  <CardDescription>Session identity and verification details.</CardDescription>
                </div>
              </div>
            </CardHeader>

            <CardContent className="flex flex-col gap-3.5 text-xs">
              <div className="flex flex-col gap-1">
                <span className="text-xs font-medium text-muted-foreground">Unique User ID</span>
                <div className="flex items-center gap-2">
                  {isPending ? (
                    <Skeleton aria-hidden className="h-7 flex-1" />
                  ) : (
                    <code className="text-xs font-mono bg-muted p-1.5 rounded truncate flex-1 select-all">
                      {session?.user?.id || "Unavailable"}
                    </code>
                  )}
                  <Button
                    type="button"
                    variant="outline"
                    size="icon-sm"
                    onClick={handleCopyUserId}
                    disabled={!session?.user?.id}
                    aria-label="Copy user ID"
                  >
                    {copiedId ? (
                      <Check className="text-success-foreground dark:text-success" aria-hidden />
                    ) : (
                      <Copy aria-hidden />
                    )}
                  </Button>
                </div>
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <span className="text-muted-foreground flex items-center gap-1.5">
                  <Mail className="size-3.5" aria-hidden />
                  Email Status
                </span>
                <Badge variant="success-light">Registered</Badge>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-muted-foreground flex items-center gap-1.5">
                  <Shield className="size-3.5" aria-hidden />
                  Auth Provider
                </span>
                <span className="font-semibold text-foreground">Email &amp; Password</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-muted-foreground flex items-center gap-1.5">
                  <Calendar className="size-3.5" aria-hidden />
                  Active Session
                </span>
                <span className="font-mono text-xs text-foreground">This device</span>
              </div>
            </CardContent>

            <CardFooter>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="w-full text-destructive hover:bg-destructive/10 hover:text-destructive"
                onClick={handleSignOutAll}
                disabled={isSigningOut}
              >
                <LogOut aria-hidden />
                Sign Out
              </Button>
            </CardFooter>
          </Card>

          {/* Card 4: Danger Zone */}
          <Card className="border-destructive/30">
            <CardHeader>
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-destructive/15 text-destructive">
                  <AlertTriangle className="size-4" aria-hidden />
                </div>
                <div className="flex flex-col gap-0.5">
                  <CardTitle className="font-bold text-destructive">Danger Zone</CardTitle>
                  <CardDescription>Destructive actions on this account.</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Alert variant="warning">
                <AlertTriangle aria-hidden />
                <AlertTitle>Account deletion is not self-serve</AlertTitle>
                <AlertDescription>
                  Deleting an account cancels active subscriptions and removes organization
                  memberships permanently. Request it from a workspace administrator.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
