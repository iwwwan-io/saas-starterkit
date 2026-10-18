import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/server/auth";
import { billingService } from "@/modules/billing/service";
import { getPlanById } from "@/modules/billing/plans";

export async function GET(req: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: req.headers,
    });

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const orgId = searchParams.get("organizationId");

    const sub = await billingService.getActiveSubscription({
      userId: session.user.id,
      organizationId: orgId,
    });

    const plan = sub ? getPlanById(sub.planId) : getPlanById("free");

    return NextResponse.json({
      subscription: sub,
      plan: plan || null,
    });
  } catch (error) {
    if (
      typeof error === "object" &&
      error !== null &&
      "digest" in error &&
      (error as { digest?: string }).digest === "NEXT_PRERENDER_INTERRUPTED"
    ) {
      throw error;
    }
    console.error("❌ Failed to fetch subscription:", error);
    return NextResponse.json(
      { error: "Failed to retrieve subscription" },
      { status: 500 }
    );
  }
}
