import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { PRICING_PLANS } from "@/modules/billing/plans";
import {
  ArrowRight,
  Building2,
  CreditCard,
  Layers,
  Check,
  Sparkles,
  Zap,
  Database,
  Lock,
} from "lucide-react";

export default function LandingPage() {
  const formatIDR = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Navigation Header */}
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-md">
        <div className="container max-w-7xl mx-auto flex h-16 items-center justify-between px-4 sm:px-8">
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-xl bg-primary text-primary-foreground flex items-center justify-center font-bold text-base shadow-sm">
              S
            </div>
            <span className="font-bold text-lg tracking-tight">SaaS Starter Kit</span>
          </div>

          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-muted-foreground">
            <a href="#features" className="hover:text-foreground transition-colors">
              Features
            </a>
            <a href="#architecture" className="hover:text-foreground transition-colors">
              Architecture
            </a>
            <a href="#pricing" className="hover:text-foreground transition-colors">
              Pricing
            </a>
          </nav>

          <div className="flex items-center gap-3">
            <Link href="/login" className={buttonVariants({ variant: "ghost" })}>
              Sign In
            </Link>
            <Link href="/register" className={buttonVariants({ variant: "default" })}>
              Get Started
              <ArrowRight className="ml-1.5 h-4 w-4" />
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-20 pb-16 md:pt-32 md:pb-24 border-b border-border/40">
        <div className="container max-w-5xl mx-auto px-4 sm:px-8 text-center space-y-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-1.5 text-xs font-semibold text-primary">
            <Sparkles className="h-3.5 w-3.5" /> Production-Grade Next.js Template Repository
          </div>

          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-foreground max-w-4xl mx-auto leading-tight">
            Ship your SaaS in days, not months, with{" "}
            <span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              Next.js &amp; Midtrans
            </span>
          </h1>

          <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto">
            A modular monolith template repository featuring Next.js App Router, Better Auth,
            Drizzle ORM, multi-tenant organizations, and a complete Midtrans payment gateway integration.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Link
              href="/register"
              className={buttonVariants({
                size: "lg",
                className: "w-full sm:w-auto px-8 font-semibold shadow-md",
              })}
            >
              Start Building Now
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
            <Link
              href="/dashboard"
              className={buttonVariants({
                size: "lg",
                variant: "outline",
                className: "w-full sm:w-auto",
              })}
            >
              Explore Live Dashboard
            </Link>
          </div>

          {/* Tech Badges */}
          <div className="pt-12 flex flex-wrap items-center justify-center gap-2 sm:gap-4 text-xs font-medium text-muted-foreground">
            <span className="px-3 py-1.5 rounded-lg bg-muted border border-border/50">Next.js 16 (App Router)</span>
            <span className="px-3 py-1.5 rounded-lg bg-muted border border-border/50">TypeScript 5</span>
            <span className="px-3 py-1.5 rounded-lg bg-muted border border-border/50">Better Auth + Orgs</span>
            <span className="px-3 py-1.5 rounded-lg bg-muted border border-border/50">Drizzle ORM &amp; Kit</span>
            <span className="px-3 py-1.5 rounded-lg bg-muted border border-border/50">PostgreSQL</span>
            <span className="px-3 py-1.5 rounded-lg bg-muted border border-border/50">Midtrans Snap &amp; Core</span>
            <span className="px-3 py-1.5 rounded-lg bg-muted border border-border/50">shadcn/ui + Tailwind v4</span>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-20 bg-muted/20 border-b border-border/40">
        <div className="container max-w-7xl mx-auto px-4 sm:px-8 space-y-12">
          <div className="text-center space-y-3">
            <h2 className="text-3xl font-bold tracking-tight">Everything You Need to Scale</h2>
            <p className="text-muted-foreground text-sm max-w-2xl mx-auto">
              Architected with separation of concerns, strict type-safety, and battle-tested patterns for high productivity.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            <Card className="border-border/60">
              <CardHeader>
                <div className="h-10 w-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center mb-2">
                  <CreditCard className="h-5 w-5" />
                </div>
                <CardTitle className="text-xl">Midtrans Payment Gateway</CardTitle>
                <CardDescription>
                  Full Snap checkout, bank virtual accounts, QRIS, GoPay, and credit card payments. Includes automated SHA-512 webhook signature verification.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-border/60">
              <CardHeader>
                <div className="h-10 w-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center mb-2">
                  <Lock className="h-5 w-5" />
                </div>
                <CardTitle className="text-xl">Better Auth Security</CardTitle>
                <CardDescription>
                  Robust cookie-based session management, password hashing, and extensible plugin architecture without vendor lock-in.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-border/60">
              <CardHeader>
                <div className="h-10 w-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center mb-2">
                  <Building2 className="h-5 w-5" />
                </div>
                <CardTitle className="text-xl">Optional Multi-Tenancy</CardTitle>
                <CardDescription>
                  Support personal standalone accounts or multi-seat organizations with role-based member invitations and workspace switching.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-border/60">
              <CardHeader>
                <div className="h-10 w-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center mb-2">
                  <Database className="h-5 w-5" />
                </div>
                <CardTitle className="text-xl">Drizzle ORM &amp; Migrations</CardTitle>
                <CardDescription>
                  Type-safe schema definitions, automated migration scripts, and Vercel-optimized connection pooling for serverless execution.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-border/60">
              <CardHeader>
                <div className="h-10 w-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center mb-2">
                  <Layers className="h-5 w-5" />
                </div>
                <CardTitle className="text-xl">Modular Monolith Layout</CardTitle>
                <CardDescription>
                  Clean domain isolation under <code>src/modules/</code> separating billing, auth, and organization logic from UI presentation.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-border/60">
              <CardHeader>
                <div className="h-10 w-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center mb-2">
                  <Zap className="h-5 w-5" />
                </div>
                <CardTitle className="text-xl">Vercel &amp; Production Ready</CardTitle>
                <CardDescription>
                  Zero-configuration deployment to Vercel with runtime environment variable validation using Zod.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 border-b border-border/40">
        <div className="container max-w-7xl mx-auto px-4 sm:px-8 space-y-12">
          <div className="text-center space-y-3">
            <h2 className="text-3xl font-bold tracking-tight">Flexible SaaS Pricing Plans</h2>
            <p className="text-muted-foreground text-sm max-w-2xl mx-auto">
              Ready-made tiers supporting monthly subscriptions, yearly discounts, and lifetime access options in Indonesian Rupiah (IDR).
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {Object.values(PRICING_PLANS).map((plan) => (
              <Card
                key={plan.id}
                className={`flex flex-col justify-between relative ${
                  plan.isPopular ? "border-primary shadow-lg ring-1 ring-primary/30" : "border-border/60"
                }`}
              >
                {plan.isPopular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="bg-primary text-primary-foreground text-xs">Most Popular</Badge>
                  </div>
                )}
                <CardHeader className="pt-6">
                  <CardTitle className="text-xl font-bold">{plan.name}</CardTitle>
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
                          className={`h-3.5 w-3.5 shrink-0 ${
                            feature.included ? "text-emerald-500" : "text-muted-foreground/40"
                          }`}
                        />
                        <span className={feature.included ? "text-foreground" : "text-muted-foreground line-through"}>
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
                      className: "w-full",
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

      {/* Footer */}
      <footer className="py-8 bg-muted/30 border-t border-border/40 text-center text-xs text-muted-foreground">
        <div className="container max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            Built with <strong>Next.js 16</strong>, <strong>Better Auth</strong>, <strong>Drizzle ORM</strong>, and <strong>Midtrans</strong>.
          </div>
          <div className="flex gap-4">
            <Link href="/dashboard" className="hover:underline">Dashboard</Link>
            <Link href="/login" className="hover:underline">Sign In</Link>
            <Link href="/register" className="hover:underline">Sign Up</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
