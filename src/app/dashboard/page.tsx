import type { Metadata } from "next";
import { Suspense } from "react";
import { headers } from "next/headers";
import { auth } from "@/server/auth";
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
import { PageHeader } from "@/components/page-header";
import { MetricCard } from "@/components/metric-card";
import {
  Building2,
  CreditCard,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  Database,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Dashboard Overview — SaaS Starter Kit",
  description: "Workspace overview, metrics, and template architecture checklist.",
};

async function UserSessionDetails() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  const user = session?.user;

  return (
    <div className="p-4 rounded-lg bg-muted/40 border border-border/40 text-xs space-y-1">
      <span className="font-semibold text-foreground">User Session:</span>
      <div className="text-muted-foreground truncate font-mono text-[11px]">
        ID: {user?.id ?? "Guest"}
      </div>
      <div className="text-muted-foreground truncate font-mono text-[11px]">
        Email: {user?.email ?? "N/A"}
      </div>
    </div>
  );
}

function UserSessionFallback() {
  return (
    <div className="p-4 rounded-lg bg-muted/40 border border-border/40 text-xs space-y-2 animate-pulse">
      <div className="h-3.5 w-24 bg-muted rounded" />
      <div className="h-3 w-44 bg-muted rounded" />
      <div className="h-3 w-36 bg-muted rounded" />
    </div>
  );
}

export default function DashboardOverviewPage() {

  return (
    <div className="space-y-8">
      {/* Welcome Banner using reusable PageHeader */}
      <PageHeader
        title="Welcome to your SaaS Workspace"
        description="This workspace includes multi-tenant organization support, Better Auth session handling, PostgreSQL migrations via Drizzle, and Midtrans Snap billing."
        tag="saas/studio"
        category="App Router • Next.js 16"
      >
        <Link
          href="/dashboard/billing"
          className={buttonVariants({
            variant: "default",
            size: "sm",
            className: "btn-studio-glow text-xs font-semibold gap-1.5",
          })}
        >
          <CreditCard className="size-3.5" />
          Manage Billing
        </Link>
      </PageHeader>

      {/* Metric Cards using reusable MetricCard */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Account Mode"
          value="Personal"
          description="Multi-tenancy enabled"
          icon={ShieldCheck}
          badge="Active"
        />

        <MetricCard
          title="Organizations"
          value="Optional"
          description="Create or join teams"
          icon={Building2}
          badge="Plugin"
        />

        <MetricCard
          title="Payment Gateway"
          value="Midtrans Snap"
          description="Sandbox • Production"
          icon={CreditCard}
          badge="Snap v2"
        />

        <MetricCard
          title="Database Layer"
          value="Drizzle ORM"
          description="PostgreSQL • Migrations"
          icon={Database}
          badge="Drizzle Kit"
        />
      </div>

      {/* Quick Access & Setup checklist */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="border-dashed border-border/80 bg-card/60 backdrop-blur-md shadow-xs">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-bold">Template Architecture Checklist</CardTitle>
              <Badge variant="outline" className="text-[10px] font-mono">
                Verified
              </Badge>
            </div>
            <CardDescription className="text-xs">
              Production-ready components configured for your SaaS.
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

        <Card className="border-dashed border-border/80 bg-card/60 backdrop-blur-md shadow-xs">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-bold">Quick Actions</CardTitle>
              <Badge variant="outline" className="text-[10px] font-mono">
                Shortcuts
              </Badge>
            </div>
            <CardDescription className="text-xs">Direct shortcuts to manage your workspace modules.</CardDescription>
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

            <Suspense fallback={<UserSessionFallback />}>
              <UserSessionDetails />
            </Suspense>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
