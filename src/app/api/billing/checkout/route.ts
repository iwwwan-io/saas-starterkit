import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/server/auth";
import { billingService } from "@/modules/billing/service";
import { z } from "zod";

const checkoutSchema = z.object({
  planId: z.string().min(1),
  interval: z.enum(["monthly", "yearly", "lifetime"]).default("monthly"),
  organizationId: z.string().optional().nullable(),
});

export async function POST(req: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: req.headers,
    });

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const parsed = checkoutSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid checkout request", details: parsed.error.format() },
        { status: 400 }
      );
    }

    const checkout = await billingService.createCheckoutSession({
      userId: session.user.id,
      userEmail: session.user.email,
      userName: session.user.name,
      planId: parsed.data.planId,
      interval: parsed.data.interval,
      organizationId: parsed.data.organizationId,
    });

    return NextResponse.json(checkout);
  } catch (error) {
    console.error("❌ Checkout session creation failed:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create checkout" },
      { status: 500 }
    );
  }
}
