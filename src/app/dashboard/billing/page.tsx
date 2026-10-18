"use client";

import { useState, useEffect } from "react";
import { useSession, useActiveOrganization } from "@/lib/auth-client";
import { PRICING_PLANS } from "@/modules/billing/plans";
import { PricingPlan, BillingInterval } from "@/modules/billing/types";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Check,
  Loader2,
  Sparkles,
  HelpCircle,
} from "lucide-react";

interface CurrentSubscription {
  id: string;
  planId: string;
  status: string;
  billingPeriod: string;
  currentPeriodEnd: string;
}

export default function BillingPage() {
  const { data: session } = useSession();
  const { data: activeOrg } = useActiveOrganization();

  const [interval, setInterval] = useState<BillingInterval>("monthly");
  const [isProcessing, setIsProcessing] = useState<string | null>(null);
  const [currentSub, setCurrentSub] = useState<CurrentSubscription | null>(null);
  const [isLoadingSub, setIsLoadingSub] = useState(true);

  // Fetch current subscription
  useEffect(() => {
    async function loadSubscription() {
      try {
        const orgQuery = activeOrg?.id ? `?organizationId=${activeOrg.id}` : "";
        const res = await fetch(`/api/billing/subscription${orgQuery}`);
        if (res.ok) {
          const data = await res.json();
          setCurrentSub(data.subscription);
        }
      } catch (err) {
        console.error("Failed to load subscription:", err);
      } finally {
        setIsLoadingSub(false);
      }
    }
    if (session?.user) {
      loadSubscription();
    }
  }, [session, activeOrg]);

  const handleCheckout = async (plan: PricingPlan) => {
    if (plan.price === 0) {
      toast.info("You already have access to the Free tier.");
      return;
    }

    setIsProcessing(plan.id);
    try {
      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planId: plan.id,
          interval: plan.interval === "lifetime" ? "lifetime" : interval,
          organizationId: activeOrg?.id || null,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to initialize payment");
      }

      const checkoutData = await res.json();

      // Trigger Midtrans Snap
      if (typeof window !== "undefined" && window.snap) {
        window.snap.pay(checkoutData.snapToken, {
          onSuccess: () => {
            toast.success("Payment successful! Your plan is activated.");
            window.location.reload();
          },
          onPending: () => {
            toast.info("Payment pending. Please complete transaction via your bank/e-wallet.");
          },
          onError: () => {
            toast.error("Payment failed. Please try again.");
          },
          onClose: () => {
            toast.info("Payment popup closed.");
          },
        });
      } else {
        // Fallback to direct redirect URL if snap.js not loaded
        if (checkoutData.snapRedirectUrl) {
          window.location.assign(checkoutData.snapRedirectUrl);
        } else {
          toast.error("Midtrans Snap client not available.");
        }
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Payment checkout failed");
    } finally {
      setIsProcessing(null);
    }
  };

  const formatIDR = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
          Billing &amp; Subscriptions
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Select or upgrade your SaaS plan powered by Midtrans Payment Gateway.
        </p>
      </div>

      {/* Current Subscription Status */}
      <Card className="border-border/60">
        <CardHeader>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <CardTitle className="text-lg">Subscription Overview</CardTitle>
                {currentSub ? (
                  <Badge variant="default" className="bg-emerald-600 text-white">
                    {currentSub.status.toUpperCase()}
                  </Badge>
                ) : (
                  <Badge variant="secondary">FREE TIER</Badge>
                )}
              </div>
              <CardDescription>
                {activeOrg
                  ? `Billing context: Organization (${activeOrg.name})`
                  : `Billing context: Personal User Account (${session?.user?.email})`}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoadingSub ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading subscription details...
            </div>
          ) : currentSub ? (
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="p-3 rounded-lg bg-muted/40 border border-border/40">
                <div className="text-xs text-muted-foreground">Active Plan</div>
                <div className="text-lg font-semibold uppercase">{currentSub.planId}</div>
              </div>
              <div className="p-3 rounded-lg bg-muted/40 border border-border/40">
                <div className="text-xs text-muted-foreground">Billing Cycle</div>
                <div className="text-lg font-semibold capitalize">{currentSub.billingPeriod}</div>
              </div>
              <div className="p-3 rounded-lg bg-muted/40 border border-border/40">
                <div className="text-xs text-muted-foreground">Current Period Expiry</div>
                <div className="text-lg font-semibold">
                  {new Date(currentSub.currentPeriodEnd).toLocaleDateString()}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-sm text-muted-foreground">
              You are currently on the free default plan. Upgrade below to unlock additional features and higher team member limits.
            </div>
          )}
        </CardContent>
      </Card>

      {/* Interval Selector */}
      <div className="flex justify-center">
        <div className="inline-flex items-center p-1 rounded-xl bg-muted border border-border/60">
          <button
            onClick={() => setInterval("monthly")}
            className={`px-4 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              interval === "monthly"
                ? "bg-background text-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Monthly Billing
          </button>
          <button
            onClick={() => setInterval("yearly")}
            className={`px-4 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1 ${
              interval === "yearly"
                ? "bg-background text-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Yearly Billing
            <Badge variant="secondary" className="text-[10px] bg-primary/10 text-primary border-none">
              Save 2 Months
            </Badge>
          </button>
        </div>
      </div>

      {/* Pricing Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {Object.values(PRICING_PLANS).map((plan) => {
          const isYearly = interval === "yearly" && plan.interval !== "lifetime";
          const displayPrice = isYearly
            ? Math.round(plan.price * 10)
            : plan.price;
          const billingSuffix =
            plan.interval === "lifetime"
              ? "one-time"
              : isYearly
              ? "/ year"
              : "/ month";

          const isCurrentPlan = currentSub?.planId === plan.id && currentSub?.status === "active";

          return (
            <Card
              key={plan.id}
              className={`flex flex-col justify-between relative transition-all ${
                plan.isPopular ? "border-primary shadow-md ring-1 ring-primary/30" : "border-border/60"
              }`}
            >
              {plan.isPopular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge className="bg-primary text-primary-foreground text-xs shadow-xs">
                    <Sparkles className="h-3 w-3 mr-1" /> Most Popular
                  </Badge>
                </div>
              )}

              <CardHeader className="pt-6">
                <CardTitle className="text-xl font-bold">{plan.name}</CardTitle>
                <CardDescription className="min-h-10 text-xs">
                  {plan.description}
                </CardDescription>
                <div className="pt-4">
                  <span className="text-2xl lg:text-3xl font-extrabold tracking-tight">
                    {formatIDR(displayPrice)}
                  </span>
                  <span className="text-xs text-muted-foreground ml-1">{billingSuffix}</span>
                </div>
              </CardHeader>

              <CardContent className="space-y-3 pt-2">
                <div className="text-xs font-semibold text-foreground uppercase tracking-wider">
                  Features included:
                </div>
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
                <Button
                  className="w-full"
                  variant={plan.isPopular ? "default" : "outline"}
                  disabled={isCurrentPlan || isProcessing === plan.id}
                  onClick={() => handleCheckout(plan)}
                >
                  {isProcessing === plan.id ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Connecting Snap...
                    </>
                  ) : isCurrentPlan ? (
                    "Current Plan"
                  ) : plan.price === 0 ? (
                    "Active Free"
                  ) : (
                    "Upgrade with Midtrans"
                  )}
                </Button>
              </CardFooter>
            </Card>
          );
        })}
      </div>

      {/* Midtrans Sandbox Test Info */}
      <Card className="bg-muted/40 border-dashed border-border/80">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <HelpCircle className="h-4 w-4 text-primary" />
            Midtrans Payment Simulator Instructions
          </CardTitle>
          <CardDescription className="text-xs">
            In development and sandbox mode, you can test checkout transactions using Midtrans test accounts:
          </CardDescription>
        </CardHeader>
        <CardContent className="text-xs space-y-2 text-muted-foreground">
          <p>
            • <strong>Credit Card:</strong> Card number <code>4811 1111 1111 1114</code>, any valid expiry (e.g. 12/28), CVV <code>123</code>, OTP <code>112233</code>.
          </p>
          <p>
            • <strong>Bank Virtual Accounts (BCA / Mandiri / BRI / BNI):</strong> Complete simulated transfer via Midtrans Sandbox Payment Simulator at <code>https://simulator.sandbox.midtrans.com/openapi/va/index</code>.
          </p>
          <p>
            • <strong>QRIS / GoPay:</strong> Scan generated sandbox QR code with the Midtrans QRIS Mock App.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
