import { db } from "@/server/db";
import { order, subscription, paymentTransaction, webhookEvent } from "@/server/db/schema/billing";
import { eq, and, desc } from "drizzle-orm";
import { getPlanById } from "./plans";
import { midtrans } from "./midtrans-client";
import {
  CreateCheckoutInput,
  CheckoutSessionResponse,
  MidtransNotificationPayload,
} from "./types";
import crypto from "crypto";

export class BillingService {
  async createCheckoutSession(input: CreateCheckoutInput): Promise<CheckoutSessionResponse> {
    const plan = getPlanById(input.planId);
    if (!plan) {
      throw new Error(`Invalid plan ID: ${input.planId}`);
    }

    if (plan.price <= 0) {
      throw new Error("Free plans do not require payment checkout.");
    }

    // Calculate period amount
    let totalAmount = plan.price;
    if (input.interval === "yearly" && plan.interval !== "lifetime") {
      totalAmount = Math.round(plan.price * 10); // 2 months free discount
    }

    const orderId = `ORD-${Date.now()}-${crypto.randomBytes(4).toString("hex").toUpperCase()}`;
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    // Call Midtrans Snap
    const snap = await midtrans.createSnapTransaction({
      transaction_details: {
        order_id: orderId,
        gross_amount: totalAmount,
      },
      item_details: [
        {
          id: plan.id,
          name: `${plan.name} Plan (${input.interval})`,
          price: totalAmount,
          quantity: 1,
        },
      ],
      customer_details: {
        first_name: input.userName || "Customer",
        email: input.userEmail,
      },
      callbacks: {
        finish: `${appUrl}/dashboard/billing?status=success&order_id=${orderId}`,
      },
    });

    // Save order in database
    await db.insert(order).values({
      id: orderId,
      userId: input.userId,
      organizationId: input.organizationId || null,
      itemType: input.interval === "lifetime" ? "one_time" : "subscription",
      planId: plan.id,
      billingPeriod: input.interval,
      amount: totalAmount,
      currency: "IDR",
      status: "pending",
      snapToken: snap.token,
      snapRedirectUrl: snap.redirect_url,
      metadata: {
        userEmail: input.userEmail,
      },
    });

    return {
      orderId,
      snapToken: snap.token,
      snapRedirectUrl: snap.redirect_url,
      amount: totalAmount,
    };
  }

  async processWebhookNotification(payload: MidtransNotificationPayload): Promise<{
    success: boolean;
    orderId: string;
    status: string;
  }> {
    const {
      order_id,
      status_code,
      gross_amount,
      signature_key,
      transaction_id,
      transaction_status,
      fraud_status,
      payment_type,
    } = payload;

    // 1. Verify Signature
    const isValidSignature = midtrans.verifySignature(
      order_id,
      status_code,
      gross_amount,
      signature_key
    );

    const eventId = `wh_${crypto.randomBytes(12).toString("hex")}`;

    // Record webhook event
    await db.insert(webhookEvent).values({
      id: eventId,
      gateway: "midtrans",
      orderId: order_id,
      signature: signature_key,
      payload,
      processed: isValidSignature,
      processingError: isValidSignature ? null : "Invalid SHA-512 signature",
    });

    if (!isValidSignature) {
      throw new Error(`Invalid signature for order ${order_id}`);
    }

    // 2. Lookup corresponding Order
    const [existingOrder] = await db
      .select()
      .from(order)
      .where(eq(order.id, order_id))
      .limit(1);

    if (!existingOrder) {
      throw new Error(`Order with ID ${order_id} not found in database.`);
    }

    // 3. Determine Final Status
    let finalStatus = "pending";
    const isSuccess =
      transaction_status === "settlement" ||
      (transaction_status === "capture" && fraud_status === "accept");

    if (isSuccess) {
      finalStatus = "settlement";
    } else if (transaction_status === "pending") {
      finalStatus = "pending";
    } else if (
      transaction_status === "deny" ||
      transaction_status === "cancel" ||
      transaction_status === "expire"
    ) {
      finalStatus = transaction_status;
    } else {
      finalStatus = "failure";
    }

    // 4. Record Transaction log
    if (transaction_id) {
      await db
        .insert(paymentTransaction)
        .values({
          id: transaction_id,
          orderId: order_id,
          grossAmount: Math.round(Number(gross_amount)),
          paymentType: payment_type || "unknown",
          transactionStatus: transaction_status,
          fraudStatus: fraud_status || null,
          statusCode: status_code,
          statusMessage: payload.status_message || null,
          rawPayload: payload,
        })
        .onConflictDoNothing();
    }

    // 5. Update Order status
    await db
      .update(order)
      .set({
        status: finalStatus,
        paymentType: payment_type,
        paidAt: isSuccess ? new Date() : null,
        updatedAt: new Date(),
      })
      .where(eq(order.id, order_id));

    // 6. If payment settled, activate/update subscription
    if (isSuccess) {
      await this.activateSubscriptionFromOrder(existingOrder);
    }

    return {
      success: true,
      orderId: order_id,
      status: finalStatus,
    };
  }

  private async activateSubscriptionFromOrder(ord: typeof order.$inferSelect): Promise<void> {
    const periodStart = new Date();
    const periodEnd = new Date(periodStart);

    if (ord.billingPeriod === "yearly") {
      periodEnd.setFullYear(periodEnd.getFullYear() + 1);
    } else if (ord.billingPeriod === "lifetime") {
      periodEnd.setFullYear(periodEnd.getFullYear() + 100); // 100 years for lifetime deal
    } else {
      periodEnd.setMonth(periodEnd.getMonth() + 1);
    }

    const subId = `sub_${crypto.randomBytes(12).toString("hex")}`;

    await db.insert(subscription).values({
      id: subId,
      userId: ord.userId,
      organizationId: ord.organizationId,
      planId: ord.planId,
      status: "active",
      billingPeriod: ord.billingPeriod || "monthly",
      currentPeriodStart: periodStart,
      currentPeriodEnd: periodEnd,
      cancelAtPeriodEnd: false,
      metadata: {
        originOrderId: ord.id,
      },
    });
  }

  async getActiveSubscription(identifier: {
    userId?: string;
    organizationId?: string | null;
  }) {
    if (identifier.organizationId) {
      const [orgSub] = await db
        .select()
        .from(subscription)
        .where(
          and(
            eq(subscription.organizationId, identifier.organizationId),
            eq(subscription.status, "active")
          )
        )
        .orderBy(desc(subscription.createdAt))
        .limit(1);

      if (orgSub) return orgSub;
    }

    if (identifier.userId) {
      const [userSub] = await db
        .select()
        .from(subscription)
        .where(
          and(
            eq(subscription.userId, identifier.userId),
            eq(subscription.status, "active")
          )
        )
        .orderBy(desc(subscription.createdAt))
        .limit(1);

      return userSub || null;
    }

    return null;
  }
}

export const billingService = new BillingService();
