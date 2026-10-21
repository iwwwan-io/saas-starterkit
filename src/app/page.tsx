import type { Metadata } from "next";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ThemeToggle } from "@/components/theme-toggle";
import { StudioBanner } from "@/components/studio-banner";
import { BrandLogo } from "@/components/brand-logo";
import { PRICING_PLANS } from "@/modules/billing/plans";
import {
  ArrowRight,
  Check,
  CreditCard,
  Database,
  Layers,
  Lock,
  Search,
  ShieldCheck,
  Sparkles,
  Users,
  Zap,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Modern Multi-Tenant SaaS Starter Kit",
  description:
    "Production-grade Next.js App Router template with Better Auth, PostgreSQL, Drizzle ORM, and Midtrans Snap integration.",
};

export default function LandingPage() {
  const formatIDR = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground antialiased selection:bg-primary selection:text-primary-foreground">
      {/* 1. Top Announcement Bar */}
      <StudioBanner />

      {/* 2. Studio Sticky Header */}
      <header className="sticky top-0 z-40 w-full border-b border-dashed border-border/70 bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8 border-dashed min-[1400px]:border-x border-border/70">
          {/* Logo & Brand */}
          <BrandLogo href="/" size="md" />

          {/* Navigation Pill Menu */}
          <nav className="hidden md:flex items-center gap-1 rounded-full border border-dashed border-border/80 bg-background/50 px-3 py-1 shadow-xs">
            <a href="#features" className="rounded-full px-3 py-1 text-xs font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground">
              Features
            </a>
            <a href="#showcase" className="rounded-full px-3 py-1 text-xs font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground">
              Showcase
            </a>
            <a href="#architecture" className="rounded-full px-3 py-1 text-xs font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground">
              Architecture
            </a>
            <a href="#pricing" className="rounded-full px-3 py-1 text-xs font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground">
              Pricing
            </a>
          </nav>

          {/* Right Controls */}
          <div className="flex items-center gap-2">
            {/* Quick search shortcut button */}
            <button
              type="button"
              className="hidden lg:flex items-center gap-2 rounded-md border border-input/60 bg-muted/30 px-2.5 py-1.5 text-xs text-muted-foreground shadow-xs hover:bg-accent hover:text-foreground transition-colors"
            >
              <Search className="size-3.5" />
              <span>Search docs...</span>
              <kbd className="pointer-events-none ml-2 rounded border bg-background px-1.5 py-0.5 text-[10px] font-mono text-muted-foreground shadow-xs">
                ⌘K
              </kbd>
            </button>

            {/* Dark / Light Mode Toggle */}
            <ThemeToggle />

            {/* GitHub Link */}
            <a
              href="https://github.com/iwwwan-io/saas-starterkit"
              target="_blank"
              rel="noreferrer"
              className="inline-flex size-9 items-center justify-center rounded-md border border-input/60 bg-background shadow-xs hover:bg-accent hover:text-accent-foreground transition-colors max-sm:hidden"
              aria-label="GitHub Repository"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="size-4">
                <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
                <path d="M9 18c-4.51 2-5-2-7-2" />
              </svg>
            </a>

            <div className="h-4 w-px bg-border/60 max-sm:hidden" />

            <Link
              href="/login"
              className={buttonVariants({
                variant: "ghost",
                size: "sm",
                className: "text-xs font-medium",
              })}
            >
              Sign In
            </Link>

            <Link
              href="/register"
              className={buttonVariants({
                variant: "default",
                size: "sm",
                className: "btn-studio-glow text-xs font-semibold px-3.5 gap-1.5",
              })}
            >
              Get Started
              <ArrowRight className="size-3.5" />
            </Link>
          </div>
        </div>
      </header>

      {/* Main Studio Blueprint Frame */}
      <main className="flex-1">
        <div className="mx-auto w-full max-w-7xl border-dashed min-[1400px]:border-x border-border/70">
          {/* HERO SECTION */}
          <section className="relative overflow-hidden pt-16 pb-16 md:pt-24 md:pb-24 border-b border-dashed border-border/70 bg-studio-grid">
            <div className="mx-auto flex max-w-5xl flex-col items-center px-4 text-center sm:px-6 lg:px-8 space-y-8">
              {/* Social Proof Avatar Stack */}
              <div className="inline-flex items-center gap-3 rounded-full border border-border/80 bg-background/80 px-3.5 py-1.5 shadow-xs backdrop-blur-sm">
                <div className="flex -space-x-2">
                  <div className="flex size-7 items-center justify-center rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 text-[10px] font-bold text-white ring-2 ring-background">
                    JD
                  </div>
                  <div className="flex size-7 items-center justify-center rounded-full bg-gradient-to-tr from-amber-500 to-rose-500 text-[10px] font-bold text-white ring-2 ring-background">
                    AK
                  </div>
                  <div className="flex size-7 items-center justify-center rounded-full bg-gradient-to-tr from-emerald-500 to-teal-500 text-[10px] font-bold text-white ring-2 ring-background">
                    SR
                  </div>
                  <div className="flex size-7 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground ring-2 ring-background">
                    +
                  </div>
                </div>
                <p className="text-xs font-medium text-muted-foreground">
                  Trusted by <span className="font-semibold text-foreground">1,600+</span> developers &amp; founders
                </p>
              </div>

              {/* Main Headline with Studio Underline */}
              <h1 className="max-w-4xl text-3xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl lg:leading-[1.15]">
                Build Futuristic SaaS at Warp Speed with Awesome{" "}
                <span className="relative inline-block font-black text-foreground">
                  <span>Next.js &amp; Midtrans</span>
                  <svg
                    width="450"
                    height="10"
                    viewBox="0 0 450 10"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className="absolute -bottom-1 left-0 w-full text-primary"
                    aria-hidden="true"
                  >
                    <path
                      d="M2 7.5C65 1.5 375 2.5 448 7.5"
                      stroke="currentColor"
                      strokeWidth="3.5"
                      strokeLinecap="round"
                    />
                  </svg>
                </span>
              </h1>

              {/* High-Impact Subtitle */}
              <p className="max-w-2xl text-base sm:text-lg text-muted-foreground leading-relaxed">
                Production-grade modular monolith featuring{" "}
                <Link href="#architecture" className="link-animated font-medium text-foreground">
                  Next.js 16 App Router
                </Link>
                ,{" "}
                <Link href="#features" className="link-animated font-medium text-foreground">
                  Better Auth multi-tenancy
                </Link>
                ,{" "}
                <Link href="#features" className="link-animated font-medium text-foreground">
                  Drizzle ORM
                </Link>
                , and a hardened{" "}
                <Link href="#showcase" className="link-animated font-medium text-foreground">
                  Midtrans billing lifecycle
                </Link>
                .
              </p>

              {/* Dual Action Buttons */}
              <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                <Link
                  href="/register"
                  className={buttonVariants({
                    size: "lg",
                    className: "btn-studio-glow h-11 px-6 text-sm font-semibold gap-2 rounded-lg",
                  })}
                >
                  <Sparkles className="size-4" />
                  Get All Access
                </Link>
                <Link
                  href="/dashboard"
                  className={buttonVariants({
                    variant: "secondary",
                    size: "lg",
                    className: "h-11 px-6 text-sm font-semibold gap-2 rounded-lg border border-border/80 shadow-xs",
                  })}
                >
                  Explore Live Dashboard
                  <ArrowRight className="size-4" />
                </Link>
              </div>

              {/* Technology Logo / Pill Strip */}
              <div className="pt-6 flex flex-wrap items-center justify-center gap-2 sm:gap-3 text-xs text-muted-foreground">
                <span className="rounded-md border border-border/60 bg-background/60 px-2.5 py-1 font-mono">Next.js 16</span>
                <span className="rounded-md border border-border/60 bg-background/60 px-2.5 py-1 font-mono">TypeScript 5</span>
                <span className="rounded-md border border-border/60 bg-background/60 px-2.5 py-1 font-mono">Better Auth</span>
                <span className="rounded-md border border-border/60 bg-background/60 px-2.5 py-1 font-mono">Drizzle ORM</span>
                <span className="rounded-md border border-border/60 bg-background/60 px-2.5 py-1 font-mono">PostgreSQL</span>
                <span className="rounded-md border border-border/60 bg-background/60 px-2.5 py-1 font-mono">Midtrans Snap</span>
                <span className="rounded-md border border-border/60 bg-background/60 px-2.5 py-1 font-mono">Tailwind CSS v4</span>
              </div>
            </div>
          </section>

          {/* 3. SHOWCASE MARQUEE (Interactive Blueprint Cards) */}
          <section id="showcase" className="py-12 border-b border-dashed border-border/70 overflow-hidden bg-muted/15">
            <div className="px-4 sm:px-6 lg:px-8 mb-6 flex items-center justify-between">
              <div>
                <p className="text-xs font-mono uppercase tracking-wider text-muted-foreground">Interactive Architecture</p>
                <h2 className="text-xl font-bold tracking-tight">Production Modules in Action</h2>
              </div>
              <Badge variant="outline" className="font-mono text-xs hidden sm:inline-flex">
                Hover to pause stream
              </Badge>
            </div>

            {/* Marquee Row */}
            <div className="relative w-full overflow-hidden">
              <div className="flex w-max gap-4 animate-marquee p-2">
                {/* CARD 1: Midtrans Snap Payment Simulator */}
                <div className="w-80 shrink-0 rounded-xl border border-border/80 bg-card p-4 shadow-sm space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CreditCard className="size-4 text-primary" />
                      <span className="text-xs font-semibold">Midtrans Snap Checkout</span>
                    </div>
                    <Badge variant="secondary" className="text-[10px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                      Live Gateway
                    </Badge>
                  </div>
                  <div className="rounded-lg border border-border/60 bg-muted/30 p-2.5 text-xs space-y-1.5 font-mono">
                    <div className="flex justify-between text-muted-foreground">
                      <span>Gross Amount:</span>
                      <span className="font-bold text-foreground">Rp 149.000</span>
                    </div>
                    <div className="flex justify-between text-muted-foreground">
                      <span>Channels:</span>
                      <span className="text-foreground">QRIS, VA, CC, GoPay</span>
                    </div>
                    <div className="flex justify-between text-muted-foreground">
                      <span>Signature:</span>
                      <span className="text-emerald-500 truncate max-w-[120px]">SHA-512 OK</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1">
                    <span>Terminal Status Machine</span>
                    <span className="text-foreground font-medium">Auto-Settlement</span>
                  </div>
                </div>

                {/* CARD 2: Subscription & Lifecycle Hardening */}
                <div className="w-80 shrink-0 rounded-xl border border-border/80 bg-card p-4 shadow-sm space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="size-4 text-primary" />
                      <span className="text-xs font-semibold">Lifecycle &amp; Entitlement</span>
                    </div>
                    <Badge variant="secondary" className="text-[10px] bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                      Phase 2.4.1
                    </Badge>
                  </div>
                  <div className="rounded-lg border border-border/60 bg-muted/30 p-2.5 text-xs space-y-1.5 font-mono">
                    <div className="flex justify-between text-muted-foreground">
                      <span>Status:</span>
                      <span className="text-emerald-500 font-bold">active</span>
                    </div>
                    <div className="flex justify-between text-muted-foreground">
                      <span>Renewal Engine:</span>
                      <span className="text-foreground">UTC Calendar Clamping</span>
                    </div>
                    <div className="flex justify-between text-muted-foreground">
                      <span>Full Refund:</span>
                      <span className="text-rose-500">Auto-Revocation</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1">
                    <span>Row Lock Guard</span>
                    <span className="font-medium text-foreground">SELECT FOR UPDATE</span>
                  </div>
                </div>

                {/* CARD 3: Multi-Tenant Organizations */}
                <div className="w-80 shrink-0 rounded-xl border border-border/80 bg-card p-4 shadow-sm space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Users className="size-4 text-primary" />
                      <span className="text-xs font-semibold">Multi-Tenant Workspaces</span>
                    </div>
                    <Badge variant="outline" className="text-[10px]">
                      Better Auth
                    </Badge>
                  </div>
                  <div className="rounded-lg border border-border/60 bg-muted/30 p-2.5 text-xs space-y-1.5 font-mono">
                    <div className="flex justify-between text-muted-foreground">
                      <span>Current Org:</span>
                      <span className="text-foreground font-semibold">Acme Labs Inc</span>
                    </div>
                    <div className="flex justify-between text-muted-foreground">
                      <span>Member Role:</span>
                      <span className="text-foreground">Owner / Billing Admin</span>
                    </div>
                    <div className="flex justify-between text-muted-foreground">
                      <span>Isolation:</span>
                      <span className="text-emerald-500">100% Tenant Scoped</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1">
                    <span>Role Verification</span>
                    <span className="font-medium text-foreground">Strict 403 Guards</span>
                  </div>
                </div>

                {/* CARD 4: Drizzle ORM & Postgres Migrations */}
                <div className="w-80 shrink-0 rounded-xl border border-border/80 bg-card p-4 shadow-sm space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Database className="size-4 text-primary" />
                      <span className="text-xs font-semibold">Drizzle ORM Engine</span>
                    </div>
                    <Badge variant="outline" className="text-[10px] font-mono">
                      PostgreSQL
                    </Badge>
                  </div>
                  <div className="rounded-lg border border-border/60 bg-muted/30 p-2.5 text-xs space-y-1.5 font-mono">
                    <div className="flex justify-between text-muted-foreground">
                      <span>Pooler Mode:</span>
                      <span className="text-foreground">prepare: false</span>
                    </div>
                    <div className="flex justify-between text-muted-foreground">
                      <span>Migrations:</span>
                      <span className="text-foreground">Journaled (0000-0002)</span>
                    </div>
                    <div className="flex justify-between text-muted-foreground">
                      <span>Serverless Sync:</span>
                      <span className="text-emerald-500">PgBouncer Safe</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1">
                    <span>Zero Data Leaks</span>
                    <span className="font-medium text-foreground">100% Type-Safe</span>
                  </div>
                </div>

                {/* DUPLICATE SET FOR SMOOTH CONTINUOUS MARQUEE LOOP */}
                <div className="w-80 shrink-0 rounded-xl border border-border/80 bg-card p-4 shadow-sm space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CreditCard className="size-4 text-primary" />
                      <span className="text-xs font-semibold">Midtrans Snap Checkout</span>
                    </div>
                    <Badge variant="secondary" className="text-[10px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                      Live Gateway
                    </Badge>
                  </div>
                  <div className="rounded-lg border border-border/60 bg-muted/30 p-2.5 text-xs space-y-1.5 font-mono">
                    <div className="flex justify-between text-muted-foreground">
                      <span>Gross Amount:</span>
                      <span className="font-bold text-foreground">Rp 149.000</span>
                    </div>
                    <div className="flex justify-between text-muted-foreground">
                      <span>Channels:</span>
                      <span className="text-foreground">QRIS, VA, CC, GoPay</span>
                    </div>
                    <div className="flex justify-between text-muted-foreground">
                      <span>Signature:</span>
                      <span className="text-emerald-500 truncate max-w-[120px]">SHA-512 OK</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1">
                    <span>Terminal Status Machine</span>
                    <span className="text-foreground font-medium">Auto-Settlement</span>
                  </div>
                </div>

                <div className="w-80 shrink-0 rounded-xl border border-border/80 bg-card p-4 shadow-sm space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="size-4 text-primary" />
                      <span className="text-xs font-semibold">Lifecycle &amp; Entitlement</span>
                    </div>
                    <Badge variant="secondary" className="text-[10px] bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                      Phase 2.4.1
                    </Badge>
                  </div>
                  <div className="rounded-lg border border-border/60 bg-muted/30 p-2.5 text-xs space-y-1.5 font-mono">
                    <div className="flex justify-between text-muted-foreground">
                      <span>Status:</span>
                      <span className="text-emerald-500 font-bold">active</span>
                    </div>
                    <div className="flex justify-between text-muted-foreground">
                      <span>Renewal Engine:</span>
                      <span className="text-foreground">UTC Calendar Clamping</span>
                    </div>
                    <div className="flex justify-between text-muted-foreground">
                      <span>Full Refund:</span>
                      <span className="text-rose-500">Auto-Revocation</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1">
                    <span>Row Lock Guard</span>
                    <span className="font-medium text-foreground">SELECT FOR UPDATE</span>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* 4. FEATURES BENTO GRID */}
          <section id="features" className="py-20 border-b border-dashed border-border/70">
            <div className="px-4 sm:px-6 lg:px-8 space-y-12">
              <div className="text-center space-y-3 max-w-3xl mx-auto">
                <Badge variant="outline" className="font-mono text-xs">
                  Production Engineering
                </Badge>
                <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
                  Engineered for Real-World SaaS Reliability
                </h2>
                <p className="text-sm sm:text-base text-muted-foreground">
                  Stop reinventing payment webhooks, database row locking, session security, and organization hierarchies.
                </p>
              </div>

              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                <Card className="border-dashed border-border/80 bg-card/60 shadow-xs hover:border-primary/50 transition-colors">
                  <CardHeader>
                    <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary mb-2">
                      <CreditCard className="size-5" />
                    </div>
                    <CardTitle className="text-lg">Midtrans Snap Payment Gateway</CardTitle>
                    <CardDescription className="text-xs leading-relaxed">
                      Complete integration for Virtual Accounts, QRIS, GoPay, and Credit Cards. Automated SHA-512 signature verification and idempotent webhook processing.
                    </CardDescription>
                  </CardHeader>
                </Card>

                <Card className="border-dashed border-border/80 bg-card/60 shadow-xs hover:border-primary/50 transition-colors">
                  <CardHeader>
                    <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary mb-2">
                      <Lock className="size-5" />
                    </div>
                    <CardTitle className="text-lg">Better Auth Security Suite</CardTitle>
                    <CardDescription className="text-xs leading-relaxed">
                      Rock-solid cookie-based session management, password hashing, and token rotation. Multi-tenant workspace support with strict role-based access control.
                    </CardDescription>
                  </CardHeader>
                </Card>

                <Card className="border-dashed border-border/80 bg-card/60 shadow-xs hover:border-primary/50 transition-colors">
                  <CardHeader>
                    <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary mb-2">
                      <ShieldCheck className="size-5" />
                    </div>
                    <CardTitle className="text-lg">Lifecycle &amp; Refund Protection</CardTitle>
                    <CardDescription className="text-xs leading-relaxed">
                      Full refund immediately revokes entitlement and prevents reactivation from late settlement payloads. Deterministic UTC renewal extension with month-end clamping.
                    </CardDescription>
                  </CardHeader>
                </Card>

                <Card className="border-dashed border-border/80 bg-card/60 shadow-xs hover:border-primary/50 transition-colors">
                  <CardHeader>
                    <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary mb-2">
                      <Database className="size-5" />
                    </div>
                    <CardTitle className="text-lg">Drizzle ORM &amp; Migrations</CardTitle>
                    <CardDescription className="text-xs leading-relaxed">
                      Strictly typed SQL schema, automated migration journal, and connection pooling prepared for Prisma Postgres, Supabase, Neon, and AWS RDS.
                    </CardDescription>
                  </CardHeader>
                </Card>

                <Card className="border-dashed border-border/80 bg-card/60 shadow-xs hover:border-primary/50 transition-colors">
                  <CardHeader>
                    <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary mb-2">
                      <Layers className="size-5" />
                    </div>
                    <CardTitle className="text-lg">Modular Monolith Architecture</CardTitle>
                    <CardDescription className="text-xs leading-relaxed">
                      Domain logic is segregated cleanly under <code>src/modules/</code>, decoupling business workflows from UI presentation and routing.
                    </CardDescription>
                  </CardHeader>
                </Card>

                <Card className="border-dashed border-border/80 bg-card/60 shadow-xs hover:border-primary/50 transition-colors">
                  <CardHeader>
                    <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary mb-2">
                      <Zap className="size-5" />
                    </div>
                    <CardTitle className="text-lg">Zero-Config Deployment</CardTitle>
                    <CardDescription className="text-xs leading-relaxed">
                      Next.js 16 with Turbopack, Zod runtime environment variable validation, and complete GitHub Actions CI with ephemeral PostgreSQL integration tests.
                    </CardDescription>
                  </CardHeader>
                </Card>
              </div>
            </div>
          </section>

          {/* 5. ARCHITECTURE SPEC & CODE PREVIEW */}
          <section id="architecture" className="py-20 border-b border-dashed border-border/70 bg-muted/10">
            <div className="px-4 sm:px-6 lg:px-8 space-y-10">
              <div className="max-w-3xl space-y-3">
                <Badge variant="outline" className="font-mono text-xs">
                  Clean Architecture
                </Badge>
                <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                  Modular Domain Layering
                </h2>
                <p className="text-sm text-muted-foreground">
                  Every feature has a home. Business operations remain testable, isolated, and safe from unintended side effects.
                </p>
              </div>

              {/* Code Terminal Window */}
              <div className="rounded-xl border border-border/80 bg-card shadow-sm overflow-hidden font-mono text-xs">
                <div className="flex items-center justify-between border-b border-border/60 bg-muted/40 px-4 py-2.5">
                  <div className="flex items-center gap-2">
                    <span className="size-3 rounded-full bg-rose-500/80 inline-block" />
                    <span className="size-3 rounded-full bg-amber-500/80 inline-block" />
                    <span className="size-3 rounded-full bg-emerald-500/80 inline-block" />
                    <span className="ml-2 text-muted-foreground">saas-starterkit / src / modules / billing / service.ts</span>
                  </div>
                  <span className="text-[10px] text-muted-foreground">TypeScript</span>
                </div>
                <div className="p-4 sm:p-6 overflow-x-auto text-muted-foreground leading-relaxed space-y-1">
                  <p className="text-purple-400">export class <span className="text-yellow-300">BillingService</span> &#123;</p>
                  <p className="pl-4 text-muted-foreground">&#47;&#47; Centralized entitlement check enforcing strict UTC expiration</p>
                  <p className="pl-4"><span className="text-blue-400">async</span> <span className="text-yellow-200">checkEntitlement</span>(params: &#123; userId?: string; organizationId?: string &#125;) &#123;</p>
                  <p className="pl-8"><span className="text-blue-400">const</span> sub = <span className="text-blue-400">await</span> <span className="text-blue-300">this</span>.getActiveSubscription(params);</p>
                  <p className="pl-8"><span className="text-purple-400">return</span> &#123; hasAccess: !!sub, planId: sub?.planId ?? <span className="text-rose-400">null</span> &#125;;</p>
                  <p className="pl-4">&#125;</p>
                  <p className="pl-4 text-muted-foreground">&#47;&#47; Midtrans Webhook processor with row-level locking &amp; idempotency</p>
                  <p className="pl-4"><span className="text-blue-400">async</span> <span className="text-yellow-200">processWebhookNotification</span>(payload: MidtransNotificationPayload) &#123;</p>
                  <p className="pl-8"><span className="text-blue-400">return</span> <span className="text-blue-400">await</span> <span className="text-blue-300">this</span>.db.transaction(<span className="text-blue-400">async</span> (tx) =&gt; &#123;</p>
                  <p className="pl-12 text-emerald-400">&#47;&#47; SELECT ... FOR UPDATE prevents race conditions on concurrent webhooks</p>
                  <p className="pl-12"><span className="text-blue-400">const</span> [order] = <span className="text-blue-400">await</span> tx.select().from(orderTable).where(...).for(<span className="text-emerald-300">&quot;update&quot;</span>);</p>
                  <p className="pl-12">...</p>
                  <p className="pl-8">&#125;);</p>
                  <p className="pl-4">&#125;</p>
                  <p className="text-purple-400">&#125;</p>
                </div>
              </div>
            </div>
          </section>

          {/* 6. PRICING SECTION (Shadcn Studio style) */}
          <section id="pricing" className="py-20 border-b border-dashed border-border/70">
            <div className="px-4 sm:px-6 lg:px-8 space-y-12">
              <div className="text-center space-y-3 max-w-3xl mx-auto">
                <Badge variant="outline" className="font-mono text-xs">
                  Pricing Plans
                </Badge>
                <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
                  Simple, Transparent SaaS Pricing
                </h2>
                <p className="text-sm sm:text-base text-muted-foreground">
                  All tiers include complete source code access, automated Midtrans billing, and lifetime software updates.
                </p>
              </div>

              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                {Object.values(PRICING_PLANS).map((plan) => (
                  <Card
                    key={plan.id}
                    className={`flex flex-col justify-between relative border-dashed ${
                      plan.isPopular
                        ? "border-primary bg-card shadow-md ring-1 ring-primary/40"
                        : "border-border/80 bg-card/60"
                    }`}
                  >
                    {plan.isPopular && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                        <Badge className="bg-primary text-primary-foreground text-[10px] px-2.5 font-semibold">
                          Most Popular
                        </Badge>
                      </div>
                    )}
                    <CardHeader className="pt-6">
                      <CardTitle className="text-lg font-bold">{plan.name}</CardTitle>
                      <CardDescription className="min-h-10 text-xs">{plan.description}</CardDescription>
                      <div className="pt-4">
                        <span className="text-3xl font-extrabold tracking-tight">{formatIDR(plan.price)}</span>
                        <span className="text-xs text-muted-foreground ml-1">
                          {plan.interval === "lifetime" ? "one-time" : "/ month"}
                        </span>
                      </div>
                    </CardHeader>

                    <CardContent className="space-y-3 pt-2">
                      <ul className="space-y-2 text-xs">
                        {plan.features.map((feature, i) => (
                          <li key={i} className="flex items-center gap-2">
                            <Check
                              className={`size-3.5 shrink-0 ${
                                feature.included ? "text-emerald-500" : "text-muted-foreground/30"
                              }`}
                            />
                            <span className={feature.included ? "text-foreground" : "text-muted-foreground/60 line-through"}>
                              {feature.text}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>

                    <CardFooter className="pt-4">
                      <Link
                        href="/register"
                        className={buttonVariants({
                          variant: plan.isPopular ? "default" : "outline",
                          className: `w-full text-xs font-semibold ${plan.isPopular ? "btn-studio-glow" : ""}`,
                        })}
                      >
                        Get Started
                      </Link>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            </div>
          </section>

          {/* 7. STUDIO FOOTER */}
          <footer className="py-12 px-4 sm:px-6 lg:px-8 text-xs text-muted-foreground">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <span className="size-2 rounded-full bg-emerald-500 inline-block animate-pulse" />
                <span>All systems operational</span>
                <span className="text-border">|</span>
                <span>saas/studio v2.4</span>
              </div>
              <div className="flex items-center gap-4">
                <Link href="/dashboard" className="hover:text-foreground transition-colors">
                  Dashboard
                </Link>
                <Link href="/login" className="hover:text-foreground transition-colors">
                  Sign In
                </Link>
                <Link href="/register" className="hover:text-foreground transition-colors">
                  Sign Up
                </Link>
                <a
                  href="https://github.com/iwwwan-io/saas-starterkit"
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-foreground transition-colors"
                >
                  GitHub
                </a>
              </div>
            </div>
          </footer>
        </div>
      </main>
    </div>
  );
}
