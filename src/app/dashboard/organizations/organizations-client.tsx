"use client";

import { useState } from "react";
import { organization, useActiveOrganization, useListOrganizations } from "@/lib/auth-client";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/page-header";
import { toast } from "sonner";
import {
  Building2,
  Plus,
  Users,
  Mail,
  Shield,
  Loader2,
  CheckCircle2,
} from "lucide-react";

export function OrganizationsClient() {
  const { data: activeOrg } = useActiveOrganization();
  const { data: orgList, isPending: isListLoading } = useListOrganizations();

  const [orgName, setOrgName] = useState("");
  const [orgSlug, setOrgSlug] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("member");
  const [isCreatingOrg, setIsCreatingOrg] = useState(false);
  const [isInviting, setIsInviting] = useState(false);

  const handleCreateOrg = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orgName || !orgSlug) {
      toast.error("Please provide both organization name and unique slug.");
      return;
    }

    setIsCreatingOrg(true);
    try {
      const result = await organization.create({
        name: orgName,
        slug: orgSlug.toLowerCase().replace(/[^a-z0-9-]/g, "-"),
      });

      if (result.error) {
        toast.error(result.error.message || "Failed to create organization.");
      } else {
        toast.success(`Organization "${orgName}" created successfully!`);
        setOrgName("");
        setOrgSlug("");
      }
    } catch {
      toast.error("An unexpected error occurred while creating organization.");
    } finally {
      setIsCreatingOrg(false);
    }
  };

  const handleInviteMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeOrg) {
      toast.error("Please select an organization first.");
      return;
    }

    if (!inviteEmail) {
      toast.error("Please enter the email address to invite.");
      return;
    }

    setIsInviting(true);
    try {
      const result = await organization.inviteMember({
        email: inviteEmail,
        role: inviteRole as "member" | "admin" | "owner",
        organizationId: activeOrg.id,
      });

      if (result.error) {
        toast.error(result.error.message || "Failed to send invitation.");
      } else {
        toast.success(`Invitation sent to ${inviteEmail}`);
        setInviteEmail("");
      }
    } catch {
      toast.error("Failed to send invitation.");
    } finally {
      setIsInviting(false);
    }
  };

  const handleSwitchOrg = async (orgId: string | null) => {
    try {
      await organization.setActive({
        organizationId: orgId,
      });
      toast.success(orgId ? "Switched organization" : "Switched to personal account");
    } catch {
      toast.error("Failed to switch workspace context.");
    }
  };

  return (
    <div className="space-y-8">
      {/* Reusable PageHeader */}
      <PageHeader
        title="Organizations & Multi-Tenancy"
        description="Manage your teams, invite members, or switch between personal and organization accounts."
        tag="Multi-Tenant"
        category="Better Auth Plugin"
      >
        <Badge
          variant="outline"
          className="border-border/80 font-mono text-[11px] py-1 px-2.5 bg-background/50"
        >
          Active: {activeOrg ? activeOrg.name : "Personal Account"}
        </Badge>
      </PageHeader>

      {/* Active Workspace Banner */}
      <Card className="card-vercel rounded-xl border border-border/80 shadow-xs">
        <CardHeader>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Building2 className="size-4 text-foreground" />
                Current Workspace:{" "}
                <span className="font-semibold text-foreground">
                  {activeOrg ? activeOrg.name : "Personal Account"}
                </span>
              </CardTitle>
              <CardDescription className="text-xs">
                {activeOrg
                  ? `Slug: ${activeOrg.slug} • Multi-tenant workspace`
                  : "You are currently working in your personal user workspace."}
              </CardDescription>
            </div>
            {activeOrg && (
              <Button
                variant="outline"
                size="sm"
                className="text-xs border-border/80"
                onClick={() => handleSwitchOrg(null)}
              >
                Switch to Personal Account
              </Button>
            )}
          </div>
        </CardHeader>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Create Organization */}
        <Card className="card-vercel rounded-xl border border-border/80 shadow-xs">
          <CardHeader>
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <Plus className="size-4 text-foreground" />
              Create New Organization
            </CardTitle>
            <CardDescription className="text-xs">
              Organizations allow multiple team members to share resources and billing.
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleCreateOrg}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="orgName">Organization Name</Label>
                <Input
                  id="orgName"
                  placeholder="Acme Corporation"
                  value={orgName}
                  onChange={(e) => {
                    setOrgName(e.target.value);
                    if (!orgSlug) {
                      setOrgSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-"));
                    }
                  }}
                  disabled={isCreatingOrg}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="orgSlug">URL Slug</Label>
                <Input
                  id="orgSlug"
                  placeholder="acme-corp"
                  value={orgSlug}
                  onChange={(e) => setOrgSlug(e.target.value)}
                  disabled={isCreatingOrg}
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Unique identifier used for workspace scoping and subdomains.
                </p>
              </div>

              <Button type="submit" disabled={isCreatingOrg} className="w-full btn-studio-glow text-xs font-semibold">
                {isCreatingOrg ? (
                  <>
                    <Loader2 className="mr-2 size-3.5 animate-spin" />
                    Creating Organization...
                  </>
                ) : (
                  <>
                    <Building2 className="mr-2 size-3.5" />
                    Create Organization
                  </>
                )}
              </Button>
            </CardContent>
          </form>
        </Card>

        {/* Existing Organizations Switcher */}
        <Card className="card-vercel rounded-xl border border-border/80 shadow-xs">
          <CardHeader>
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <Users className="size-4 text-foreground" />
              Your Workspaces
            </CardTitle>
            <CardDescription className="text-xs">
              Select a workspace to switch your active working context.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div
              onClick={() => handleSwitchOrg(null)}
              className={`p-3 rounded-lg border cursor-pointer transition-all flex items-center justify-between text-xs ${
                !activeOrg
                  ? "border-foreground/50 bg-foreground/5 font-semibold shadow-xs"
                  : "border-border/60 hover:bg-muted/40"
              }`}
            >
              <div className="flex items-center gap-2">
                <Shield className="size-3.5 text-muted-foreground" />
                <span>Personal Account</span>
              </div>
              {!activeOrg && (
                <Badge variant="default" className="text-[10px] px-2 py-0 font-mono bg-foreground text-background">
                  Active
                </Badge>
              )}
            </div>

            {isListLoading ? (
              <div className="flex justify-center p-4">
                <Loader2 className="size-4 animate-spin text-foreground" />
              </div>
            ) : orgList && orgList.length > 0 ? (
              orgList.map((org: { id: string; name: string; slug: string }) => {
                const isSelected = activeOrg?.id === org.id;
                return (
                  <div
                    key={org.id}
                    onClick={() => handleSwitchOrg(org.id)}
                    className={`p-3 rounded-lg border cursor-pointer transition-all flex items-center justify-between text-xs ${
                      isSelected
                        ? "border-foreground/50 bg-foreground/5 font-semibold shadow-xs"
                        : "border-border/60 hover:bg-muted/40"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Building2 className="size-3.5 text-foreground" />
                      <span>{org.name}</span>
                      <span className="text-[11px] text-muted-foreground font-mono">({org.slug})</span>
                    </div>
                    {isSelected && (
                      <Badge variant="default" className="text-[10px] px-2 py-0 font-mono bg-foreground text-background">
                        Active
                      </Badge>
                    )}
                  </div>
                );
              })
            ) : (
              <div className="text-xs text-muted-foreground p-3 border border-border/80 rounded-md text-center">
                No organizations yet. Create one on the left.
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Team Member Invitations (if in Org mode) */}
      {activeOrg && (
        <Card className="card-vercel rounded-xl border border-border/80 shadow-xs">
          <CardHeader>
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <Mail className="size-4 text-primary" />
              Invite Team Member to {activeOrg.name}
            </CardTitle>
            <CardDescription className="text-xs">
              Collaborate by sending email invitations to join this organization.
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleInviteMember}>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-3">
                <div className="md:col-span-2 space-y-2">
                  <Label htmlFor="inviteEmail">Member Email</Label>
                  <Input
                    id="inviteEmail"
                    type="email"
                    placeholder="colleague@example.com"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    disabled={isInviting}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="inviteRole">Role</Label>
                  <select
                    id="inviteRole"
                    className="flex h-9 w-full rounded-md border border-input bg-card px-3 py-1 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    value={inviteRole}
                    onChange={(e) => setInviteRole(e.target.value)}
                    disabled={isInviting}
                  >
                    <option value="member">Member</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
              </div>
              <Button type="submit" disabled={isInviting} className="btn-studio-glow text-xs font-semibold">
                {isInviting ? (
                  <>
                    <Loader2 className="mr-2 size-3.5 animate-spin" />
                    Sending Invite...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="mr-2 size-3.5" />
                    Send Invitation
                  </>
                )}
              </Button>
            </CardContent>
          </form>
        </Card>
      )}
    </div>
  );
}
