import { NextRequest, NextResponse } from "next/server";
import { billingService } from "@/modules/billing/service";

export async function POST(req: NextRequest) {
  try {
    // If CRON_SECRET is configured, enforce Bearer authorization
    const cronSecret = process.env.CRON_SECRET;
    if (cronSecret) {
      const authHeader = req.headers.get("authorization");
      if (authHeader !== `Bearer ${cronSecret}`) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
    }

    const result = await billingService.syncExpiredSubscriptions();

    return NextResponse.json({
      success: true,
      updatedCount: result.updatedCount,
      expiredSubscriptionIds: result.expiredSubscriptionIds,
    });
  } catch (error) {
    console.error(
      "❌ Subscription expiry sync failed:",
      error instanceof Error ? error.message : "Internal Error"
    );
    return NextResponse.json(
      { error: "Failed to sync expired subscriptions" },
      { status: 500 }
    );
  }
}

// Allow GET for Vercel Cron triggers if configured
export async function GET(req: NextRequest) {
  return POST(req);
}
