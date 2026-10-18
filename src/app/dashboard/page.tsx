"use client";

import { useSession } from "@/lib/auth-client";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Building2,
  CreditCard,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  Database,
} from "lucide-react";

export default function DashboardOverviewPage() {
  const { data: session } = useSession();

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="rounded-2xl bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border border-primary/20 p-6 md:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Badge variant="outline" className="border-primary/40 text-primary">
              Template Ready
            </Badge>
            <span className="text-xs text-muted-foreground">App Router &amp; Next.js 16</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
            Welcome to your SaaS Workspace
          </h1>
          <p className="text-sm text-muted-foreground mt-1 max-w-xl">
            This workspace includes multi-tenant organization support, Better Auth session
            handling, PostgreSQL migrations via Drizzle, and Midtrans Snap billing.
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/dashboard/billing" className={buttonVariants({ variant: "default" })}>
            <CreditCard className="mr-2 h-4 w-4" />
            Manage Billing
          </Link>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Account Mode</CardTitle>
            <ShieldCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Personal</div>
            <p className="text-xs text-muted-foreground mt-1">Multi-tenancy enabled</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Organizations</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Optional</div>
            <p className="text-xs text-muted-foreground mt-1">Create or join teams</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Payment Gateway</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Midtrans Snap</div>
            <p className="text-xs text-muted-foreground mt-1">Sandbox &amp; Production</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Database Layer</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Drizzle ORM</div>
            <p className="text-xs text-muted-foreground mt-1">PostgreSQL + Migrations</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Access & Setup checklist */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Template Architecture Checklist</CardTitle>
            <CardDescription>
              Verified components ready for your custom SaaS implementation.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-3 text-sm">
              <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
              <div>
                <strong className="font-semibold text-foreground">Next.js App Router &amp; TypeScript</strong>
                <p className="text-xs text-muted-foreground">
                  Strict typechecking, React 19, and Tailwind CSS v4 styling.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 text-sm">
              <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
              <div>
                <strong className="font-semibold text-foreground">Better Auth &amp; Session Management</strong>
                <p className="text-xs text-muted-foreground">
                  Drizzle database adapter with built-in multi-tenant organization plugin.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 text-sm">
              <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
              <div>
                <strong className="font-semibold text-foreground">PostgreSQL &amp; Drizzle Kit Migrations</strong>
                <p className="text-xs text-muted-foreground">
                  Connection pooling prepared for serverless deployment on Vercel.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 text-sm">
              <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
              <div>
                <strong className="font-semibold text-foreground">Midtrans Webhook &amp; Signature Validation</strong>
                <p className="text-xs text-muted-foreground">
                  SHA-512 signature verification, order tracking, and idempotent event processing.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Quick Actions</CardTitle>
            <CardDescription>Direct shortcuts to manage your workspace modules.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Link
              href="/dashboard/billing"
              className="group flex items-center justify-between p-3 rounded-lg border border-border/60 hover:border-primary/50 hover:bg-muted/50 transition-all"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-md bg-primary/10 text-primary">
                  <CreditCard className="h-4 w-4" />
                </div>
                <div>
                  <div className="text-sm font-medium">Subscription &amp; Plans</div>
                  <div className="text-xs text-muted-foreground">
                    Test Snap checkout flow and view pricing tiers
                  </div>
                </div>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
            </Link>

            <Link
              href="/dashboard/organizations"
              className="group flex items-center justify-between p-3 rounded-lg border border-border/60 hover:border-primary/50 hover:bg-muted/50 transition-all"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-md bg-primary/10 text-primary">
                  <Building2 className="h-4 w-4" />
                </div>
                <div>
                  <div className="text-sm font-medium">Team &amp; Workspaces</div>
                  <div className="text-xs text-muted-foreground">
                    Invite members and manage organization roles
                  </div>
                </div>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
            </Link>

            <div className="p-4 rounded-lg bg-muted/40 border border-border/40 text-xs space-y-1">
              <span className="font-semibold text-foreground">User Session:</span>
              <div className="text-muted-foreground truncate">ID: {session?.user?.id}</div>
              <div className="text-muted-foreground truncate">Email: {session?.user?.email}</div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
