import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/server/auth";
import { billingService } from "@/modules/billing/service";
import { getPlanById } from "@/modules/billing/plans";
import { verifyUserOrgMembership } from "@/server/auth/org-auth";
import { z } from "zod";

const checkoutSchema = z.object({
  planId: z.string().trim().min(1, "Plan ID is required"),
  interval: z.enum(["monthly", "yearly", "lifetime"]).default("monthly"),
  organizationId: z.string().trim().nullable().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: req.headers,
    });

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON request body" }, { status: 400 });
    }

    const parsed = checkoutSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid checkout request", details: parsed.error.format() },
        { status: 400 }
      );
    }

    const { planId, interval, organizationId } = parsed.data;

    // Validate plan
    const plan = getPlanById(planId);
    if (!plan) {
      return NextResponse.json({ error: `Invalid plan ID: ${planId}` }, { status: 400 });
    }

    if (plan.price <= 0) {
      return NextResponse.json(
        { error: "Free plans do not require payment checkout." },
        { status: 400 }
      );
    }

    let resolvedOrgId: string | null = null;

    // Enforce organization authorization if organizationId is supplied
    if (organizationId) {
      const orgAuth = await verifyUserOrgMembership(session.user.id, organizationId, {
        requireBillingAccess: true,
      });

      if (!orgAuth.success) {
        return NextResponse.json({ error: orgAuth.error }, { status: orgAuth.status });
      }

      resolvedOrgId = orgAuth.organization.id;
    }

    const checkout = await billingService.createCheckoutSession({
      userId: session.user.id,
      userEmail: session.user.email,
      userName: session.user.name,
      planId: plan.id,
      interval,
      organizationId: resolvedOrgId,
    });

    return NextResponse.json(checkout);
  } catch (error) {
    console.error(
      "❌ Checkout session creation failed:",
      error instanceof Error ? error.message : "Internal Error"
    );
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create checkout" },
      { status: 500 }
    );
  }
}
