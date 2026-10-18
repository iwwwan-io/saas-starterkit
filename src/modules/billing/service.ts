import { db } from "@/server/db";
import { order, subscription, paymentTransaction, webhookEvent } from "@/server/db/schema/billing";
import { eq, and, desc, isNull, or, sql } from "drizzle-orm";
import { getPlanById } from "./plans";
import { midtrans } from "./midtrans-client";
import type {
  CreateCheckoutInput,
  CheckoutSessionResponse,
  MidtransNotificationPayload,
} from "./types";
import { WebhookValidationError } from "./types";
import crypto from "crypto";

export function validateGrossAmount(
  grossAmountInput: unknown,
  expectedOrderAmount: number
): { valid: boolean; normalizedAmount: string; error?: string } {
  if (grossAmountInput === undefined || grossAmountInput === null) {
    return { valid: false, normalizedAmount: "", error: "Missing gross_amount" };
  }

  const grossAmountStr = String(grossAmountInput).trim();
  // Deterministic IDR regex: non-negative integer digits optionally followed by .0 or .00
  if (!/^(?:0|[1-9]\d*)(?:\.00?)?$/.test(grossAmountStr)) {
    return { valid: false, normalizedAmount: "", error: `Malformed gross_amount format: ${grossAmountStr}` };
  }

  const numericVal = Math.round(Number(grossAmountStr));
  if (numericVal !== expectedOrderAmount) {
    return {
      valid: false,
      normalizedAmount: String(numericVal),
      error: `Gross amount mismatch: expected ${expectedOrderAmount}, received ${grossAmountStr}`,
    };
  }

  return { valid: true, normalizedAmount: String(expectedOrderAmount) };
}

export function computeWebhookFingerprint(payload: {
  transaction_id?: string;
  order_id: string;
  transaction_status: string;
  status_code: string;
  fraud_status?: string;
  gross_amount: string | number;
}): { eventId: string; rawFingerprint: string } {
  const transactionId = (payload.transaction_id || "").trim();
  const orderId = (payload.order_id || "").trim();
  const transactionStatus = (payload.transaction_status || "").trim().toLowerCase();
  const statusCode = (payload.status_code || "").trim();
  const fraudStatus = (payload.fraud_status || "").trim().toLowerCase();

  // Canonicalize gross_amount: if valid numeric string, use integer string
  const rawAmountStr = String(payload.gross_amount).trim();
  let canonicalAmount = rawAmountStr;
  if (/^(?:0|[1-9]\d*)(?:\.00?)?$/.test(rawAmountStr)) {
    canonicalAmount = String(Math.round(Number(rawAmountStr)));
  }

  const rawFingerprint = `${transactionId}:${orderId}:${transactionStatus}:${statusCode}:${fraudStatus}:${canonicalAmount}`;
  const eventFingerprint = crypto.createHash("sha256").update(rawFingerprint).digest("hex");
  return { eventId: `wh_${eventFingerprint}`, rawFingerprint };
}

export function determinePaymentStatus(
  transactionStatus: string,
  fraudStatus?: string
): { isSuccess: boolean; finalStatus: string } {
  const isSuccess =
    transactionStatus === "settlement" ||
    (transactionStatus === "capture" && fraudStatus === "accept");

  let finalStatus = "pending";
  if (isSuccess) {
    finalStatus = "settlement";
  } else if (transactionStatus === "capture" && fraudStatus === "challenge") {
    finalStatus = "challenge";
  } else if (transactionStatus === "pending") {
    finalStatus = "pending";
  } else if (
    transactionStatus === "deny" ||
    transactionStatus === "cancel" ||
    transactionStatus === "expire"
  ) {
    finalStatus = transactionStatus;
  } else if (
    transactionStatus === "refund" ||
    transactionStatus === "partial_refund"
  ) {
    finalStatus = "refund";
  } else {
    finalStatus = "failure";
  }

  return { isSuccess, finalStatus };
}

export function shouldUpdateOrderStatus(
  currentStatus: string,
  incomingFinalStatus: string
): boolean {
  if (currentStatus === "settlement") {
    // Legitimate refund transitions settled order to refund
    if (incomingFinalStatus === "refund") return true;
    // Repeated settlement is idempotent
    if (incomingFinalStatus === "settlement") return true;
    // Stale/delayed out-of-order events (pending, expire, deny, cancel, challenge) are ignored
    return false;
  }

  if (currentStatus === "refund") {
    // Once refunded, only another refund event is permitted
    return incomingFinalStatus === "refund";
  }

  if (currentStatus === "deny" || currentStatus === "cancel" || currentStatus === "expire") {
    // Terminal failure before settlement cannot regress to pending
    if (incomingFinalStatus === "pending") return false;
    return true;
  }

  // From pending or challenge, any valid status update is permitted
  return true;
}

export class BillingService {
  private dbInstance: typeof db;

  constructor(dbInstance?: typeof db) {
    this.dbInstance = dbInstance ?? db;
  }

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
    await this.dbInstance.insert(order).values({
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
    duplicate?: boolean;
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

    if (!order_id || !status_code || !gross_amount || !signature_key || !transaction_status) {
      throw new WebhookValidationError("Missing required fields in Midtrans notification payload");
    }

    // 1. Verify Signature using constant-time comparison before modifying state
    const isValidSignature = midtrans.verifySignature(
      order_id,
      status_code,
      gross_amount,
      signature_key
    );

    // Compute canonical, deterministic idempotency key for this event
    const { eventId } = computeWebhookFingerprint({
      transaction_id,
      order_id,
      transaction_status,
      status_code,
      fraud_status,
      gross_amount,
    });

    if (!isValidSignature) {
      // Record rejected audit event without exposing signing keys or secrets
      try {
        await this.dbInstance
          .insert(webhookEvent)
          .values({
            id: eventId,
            gateway: "midtrans",
            orderId: order_id,
            signature: signature_key,
            payload,
            processed: false,
            processingError: "Invalid SHA-512 signature",
          })
          .onConflictDoNothing();
      } catch (auditErr) {
        console.error("Failed to record signature failure audit:", auditErr);
      }

      throw new WebhookValidationError(`Invalid signature for order ${order_id}`);
    }

    // 2. Process notification atomically in database transaction
    try {
      return await this.dbInstance.transaction(async (tx) => {
        // Check if this exact event was already processed
        const [existingEvent] = await tx
          .select()
          .from(webhookEvent)
          .where(eq(webhookEvent.id, eventId))
          .limit(1);

        if (existingEvent && existingEvent.processed) {
          return {
            success: true,
            orderId: order_id,
            status: transaction_status,
            duplicate: true,
          };
        }

        // Concurrency lock: lock the order row using SELECT ... FOR UPDATE
        const [existingOrder] = await tx
          .select()
          .from(order)
          .where(eq(order.id, order_id))
          .for("update");

        if (!existingOrder) {
          throw new WebhookValidationError(`Order with ID ${order_id} not found in database.`);
        }

        // Validate gross_amount against authoritative order amount
        const amountCheck = validateGrossAmount(gross_amount, existingOrder.amount);
        if (!amountCheck.valid) {
          throw new WebhookValidationError(amountCheck.error || `Gross amount mismatch for order ${order_id}`);
        }

        // Validate currency if provided
        if (
          payload.currency &&
          payload.currency.trim().toUpperCase() !== existingOrder.currency.toUpperCase()
        ) {
          throw new WebhookValidationError(
            `Currency mismatch for order ${order_id}: expected ${existingOrder.currency}, received ${payload.currency}`
          );
        }

        // Determine Final Status based on Midtrans semantics
        const { isSuccess, finalStatus } = determinePaymentStatus(
          transaction_status,
          fraud_status
        );

        // Record or update transaction log with state monotonicity guard
        if (transaction_id) {
          await tx
            .insert(paymentTransaction)
            .values({
              id: transaction_id,
              orderId: order_id,
              grossAmount: existingOrder.amount,
              paymentType: payment_type || "unknown",
              transactionStatus: transaction_status,
              fraudStatus: fraud_status || null,
              statusCode: status_code,
              statusMessage: payload.status_message || null,
              rawPayload: payload,
            })
            .onConflictDoUpdate({
              target: paymentTransaction.id,
              set: {
                transactionStatus: transaction_status,
                fraudStatus: fraud_status || null,
                statusCode: status_code,
                statusMessage: payload.status_message || null,
                rawPayload: payload,
              },
              where: sql`payment_transaction.transaction_status != 'settlement' OR ${transaction_status} IN ('settlement', 'refund', 'partial_refund')`,
            });
        }

        // Check if order status should be updated
        const canUpdate = shouldUpdateOrderStatus(existingOrder.status, finalStatus);
        if (canUpdate) {
          await tx
            .update(order)
            .set({
              status: finalStatus,
              paymentType: payment_type || existingOrder.paymentType,
              paidAt: isSuccess ? (existingOrder.paidAt || new Date()) : existingOrder.paidAt,
              updatedAt: new Date(),
            })
            .where(eq(order.id, order_id));
        }

        // Activate subscription idempotently using orderId foreign key and deterministic sub_id
        if (isSuccess && existingOrder.status !== "settlement" && existingOrder.status !== "refund") {
          const subId = `sub_${existingOrder.id}`;
          const [existingSub] = await tx
            .select()
            .from(subscription)
            .where(or(eq(subscription.id, subId), eq(subscription.orderId, existingOrder.id)))
            .limit(1);

          if (!existingSub) {
            const periodStart = new Date();
            const periodEnd = new Date(periodStart);

            if (existingOrder.billingPeriod === "yearly") {
              periodEnd.setFullYear(periodEnd.getFullYear() + 1);
            } else if (existingOrder.billingPeriod === "lifetime") {
              periodEnd.setFullYear(periodEnd.getFullYear() + 100);
            } else {
              periodEnd.setMonth(periodEnd.getMonth() + 1);
            }

            await tx
              .insert(subscription)
              .values({
                id: subId,
                orderId: existingOrder.id,
                userId: existingOrder.userId,
                organizationId: existingOrder.organizationId,
                planId: existingOrder.planId,
                status: "active",
                billingPeriod: existingOrder.billingPeriod || "monthly",
                currentPeriodStart: periodStart,
                currentPeriodEnd: periodEnd,
                cancelAtPeriodEnd: false,
                metadata: {
                  originOrderId: existingOrder.id,
                },
              })
              .onConflictDoNothing();
          }
        }

        // Persist successful event processing state
        await tx
          .insert(webhookEvent)
          .values({
            id: eventId,
            gateway: "midtrans",
            orderId: order_id,
            signature: signature_key,
            payload,
            processed: true,
            processingError: null,
          })
          .onConflictDoUpdate({
            target: webhookEvent.id,
            set: {
              processed: true,
              processingError: null,
            },
          });

        return {
          success: true,
          orderId: order_id,
          status: finalStatus,
          duplicate: false,
        };
      });
    } catch (error) {
      // Transaction was rolled back!
      // In a separate persistence path outside the transaction, record failure audit record:
      try {
        await this.dbInstance
          .insert(webhookEvent)
          .values({
            id: eventId,
            gateway: "midtrans",
            orderId: order_id || null,
            signature: signature_key,
            payload,
            processed: false,
            processingError: error instanceof Error ? error.message : "Processing error",
          })
          .onConflictDoUpdate({
            target: webhookEvent.id,
            set: {
              processed: false,
              processingError: error instanceof Error ? error.message : "Processing error",
            },
          });
      } catch (auditErr) {
        console.error(
          "Failed to persist webhook error audit record:",
          auditErr instanceof Error ? auditErr.message : auditErr
        );
      }

      throw error;
    }
  }

  async getActiveSubscription(identifier: {
    userId?: string;
    organizationId?: string | null;
  }) {
    if (identifier.organizationId) {
      const [orgSub] = await this.dbInstance
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

      return orgSub || null;
    }

    if (identifier.userId) {
      const [userSub] = await this.dbInstance
        .select()
        .from(subscription)
        .where(
          and(
            eq(subscription.userId, identifier.userId),
            isNull(subscription.organizationId),
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
