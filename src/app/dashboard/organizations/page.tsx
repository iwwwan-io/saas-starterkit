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
import { toast } from "sonner";
import {
  Building2,
  Plus,
  Users,
  Mail,
  Shield,
  Loader2,
} from "lucide-react";

export default function OrganizationsPage() {
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
    if (!activeOrg?.id) {
      toast.error("No active organization selected.");
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
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
          Organizations &amp; Multi-Tenancy
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage your teams, invite members, or switch between personal and organization accounts.
        </p>
      </div>

      {/* Active Workspace Banner */}
      <Card className="border-border/60">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                <Building2 className="h-5 w-5 text-primary" />
                Current Workspace:{" "}
                <span className="font-semibold text-primary">
                  {activeOrg ? activeOrg.name : "Personal Account"}
                </span>
              </CardTitle>
              <CardDescription>
                {activeOrg
                  ? `Slug: ${activeOrg.slug} • Multi-tenant workspace`
                  : "You are currently working in your personal user workspace."}
              </CardDescription>
            </div>
            {activeOrg && (
              <Button
                variant="outline"
                size="sm"
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
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Plus className="h-5 w-5 text-primary" />
              Create New Organization
            </CardTitle>
            <CardDescription>
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

              <Button type="submit" disabled={isCreatingOrg} className="w-full">
                {isCreatingOrg ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating Organization...
                  </>
                ) : (
                  <>
                    <Building2 className="mr-2 h-4 w-4" />
                    Create Organization
                  </>
                )}
              </Button>
            </CardContent>
          </form>
        </Card>

        {/* Existing Organizations Switcher */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              Your Workspaces
            </CardTitle>
            <CardDescription>
              Select a workspace to switch your active working context.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div
              onClick={() => handleSwitchOrg(null)}
              className={`p-3 rounded-lg border cursor-pointer transition-all flex items-center justify-between ${
                !activeOrg
                  ? "border-primary bg-primary/5 font-semibold"
                  : "border-border/60 hover:bg-muted/40"
              }`}
            >
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-muted-foreground" />
                <span>Personal Account</span>
              </div>
              {!activeOrg && (
                <Badge variant="default" className="text-xs">
                  Active
                </Badge>
              )}
            </div>

            {isListLoading ? (
              <div className="flex justify-center p-4">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : orgList && orgList.length > 0 ? (
              orgList.map((org: { id: string; name: string; slug: string }) => {
                const isSelected = activeOrg?.id === org.id;
                return (
                  <div
                    key={org.id}
                    onClick={() => handleSwitchOrg(org.id)}
                    className={`p-3 rounded-lg border cursor-pointer transition-all flex items-center justify-between ${
                      isSelected
                        ? "border-primary bg-primary/5 font-semibold"
                        : "border-border/60 hover:bg-muted/40"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-primary" />
                      <span>{org.name}</span>
                      <span className="text-xs text-muted-foreground">({org.slug})</span>
                    </div>
                    {isSelected && (
                      <Badge variant="default" className="text-xs">
                        Active
                      </Badge>
                    )}
                  </div>
                );
              })
            ) : (
              <div className="text-xs text-muted-foreground p-3 border border-dashed rounded-md text-center">
                No organizations yet. Create one on the left.
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Team Member Invitations (if in Org mode) */}
      {activeOrg && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Mail className="h-5 w-5 text-primary" />
              Invite Team Member to {activeOrg.name}
            </CardTitle>
            <CardDescription>
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
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    value={inviteRole}
                    onChange={(e) => setInviteRole(e.target.value)}
                    disabled={isInviting}
                  >
                    <option value="member">Member</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
              </div>
              <Button type="submit" disabled={isInviting}>
                {isInviting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending Invite...
                  </>
                ) : (
                  <>
                    <Mail className="mr-2 h-4 w-4" />
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
