import { NextRequest, NextResponse } from "next/server";
import { billingService } from "@/modules/billing/service";
import { MidtransNotificationPayload } from "@/modules/billing/types";

export async function POST(req: NextRequest) {
  try {
    const payload = (await req.json()) as MidtransNotificationPayload;

    if (!payload.order_id || !payload.signature_key || !payload.status_code) {
      return NextResponse.json(
        { error: "Invalid Midtrans notification payload" },
        { status: 400 }
      );
    }

    const result = await billingService.processWebhookNotification(payload);

    return NextResponse.json({
      received: true,
      order_id: result.orderId,
      status: result.status,
    });
  } catch (error) {
    console.error("❌ Midtrans Webhook error:", error);
    return NextResponse.json(
      {
        received: false,
        error: error instanceof Error ? error.message : "Internal Server Error",
      },
      { status: 400 }
    );
  }
}
