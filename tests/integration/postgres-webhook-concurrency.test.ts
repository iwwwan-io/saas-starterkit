import "../test-env.ts";
import { describe, it, before, after } from "node:test";
import assert from "node:assert/strict";
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import { eq, or } from "drizzle-orm";
import * as schema from "../../src/server/db/schema/index.ts";
import { order, subscription, paymentTransaction, webhookEvent } from "../../src/server/db/schema/billing.ts";
import { user } from "../../src/server/db/schema/auth.ts";
import { organization } from "../../src/server/db/schema/organizations.ts";
import { BillingService } from "../../src/modules/billing/service.ts";
import crypto from "crypto";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Dedicated integration test connection string — strictly requires INTEGRATION_TEST_DATABASE_URL
const integrationDbUrl = process.env.INTEGRATION_TEST_DATABASE_URL || "";

/**
 * Positive verification of disposable test database identity.
 * Fails closed on any ambiguous, remote, or production-like target.
 */
function verifyDisposableDatabase(urlStr: string): { isDisposable: boolean; reason: string } {
  if (!urlStr) {
    return { isDisposable: false, reason: "No database URL provided in INTEGRATION_TEST_DATABASE_URL." };
  }

  try {
    const parsed = new URL(urlStr);
    const dbName = parsed.pathname.replace(/^\//, "").toLowerCase();
    const hostname = parsed.hostname.toLowerCase();

    // Reject dangerous/production/staging names immediately
    const forbiddenPatterns = ["prod", "production", "main", "staging", "stage", "live", "master"];
    for (const pat of forbiddenPatterns) {
      if (
        dbName === pat ||
        dbName.startsWith(`${pat}_`) ||
        dbName.endsWith(`_${pat}`) ||
        dbName.includes(`${pat}-`)
      ) {
        return { isDisposable: false, reason: `Database name '${dbName}' matches forbidden environment pattern '${pat}'.` };
      }
    }

    // Require database name to explicitly indicate disposable/test status
    const hasDisposableName =
      dbName.includes("test") ||
      dbName.includes("disposable") ||
      dbName.includes("scratch");

    if (!hasDisposableName) {
      return {
        isDisposable: false,
        reason: `Target database '${dbName}' fails closed: name must explicitly contain 'test', 'disposable', or 'scratch'.`,
      };
    }

    // Verify host is local, containerized, or loopback unless explicit remote test flag is set
    const isLocalOrContainer =
      hostname === "localhost" ||
      hostname === "127.0.0.1" ||
      hostname === "::1" ||
      hostname === "postgres" ||
      hostname === "host.docker.internal";

    if (!isLocalOrContainer && process.env.ALLOW_REMOTE_DISPOSABLE_DB !== "true") {
      return {
        isDisposable: false,
        reason: `Target host '${hostname}' is not a local/container address. To use a remote test database, set ALLOW_REMOTE_DISPOSABLE_DB=true.`,
      };
    }

    return { isDisposable: true, reason: `Verified disposable test database '${dbName}' on host '${hostname}'.` };
  } catch (err) {
    return { isDisposable: false, reason: `Invalid database URL: ${err instanceof Error ? err.message : String(err)}` };
  }
}

describe("PostgreSQL Webhook Integration & Concurrency Verification (Phase 2.3.2)", () => {
  let isAvailable = false;
  let adminSql: postgres.Sql | null = null;
  let sharedDb: ReturnType<typeof drizzle<typeof schema>> | null = null;
  let executedScenarioCount = 0;
  const testServerKey = "SB-Mid-server-test-integration-key-32chars";

  // Track created entities for safe test-owned teardown
  const testUserIds: string[] = [];
  const testOrgIds: string[] = [];
  const testOrderIds: string[] = [];
  const testSubIds: string[] = [];
  const testEventIds: string[] = [];

  before(async () => {
    const safety = verifyDisposableDatabase(integrationDbUrl);
    if (!safety.isDisposable) {
      if (process.env.CI === "true") {
        throw new Error(`[CI FAILURE] Disposable database safety check failed in CI: ${safety.reason}`);
      }
      console.log(`\n[PREREQUISITE SKIPPED] Real PostgreSQL Integration Tests Skipped: ${safety.reason}`);
      console.log("To run real integration tests, set INTEGRATION_TEST_DATABASE_URL to a disposable PostgreSQL database.");
      return;
    }

    try {
      // Connect with retries to ensure container/host socket readiness
      let lastErr: unknown = null;
      for (let attempt = 1; attempt <= 10; attempt++) {
        try {
          adminSql = postgres(integrationDbUrl, {
            max: 5,
            connect_timeout: 10,
            idle_timeout: 10,
            prepare: false,
          });
          await adminSql`SELECT 1 as connected`;
          lastErr = null;
          break;
        } catch (err) {
          lastErr = err;
          if (adminSql) {
            await adminSql.end({ timeout: 1 }).catch(() => {});
            adminSql = null;
          }
          if (attempt < 10) {
            await new Promise((resolve) => setTimeout(resolve, 1000));
          }
        }
      }

      if (lastErr || !adminSql) {
        throw lastErr || new Error("Failed to connect to PostgreSQL after 10 attempts");
      }

      sharedDb = drizzle(adminSql, { schema });

      // Apply migrations safely to the verified disposable database
      const migrationsDir = path.resolve(__dirname, "../../src/server/db/migrations");
      await migrate(sharedDb, { migrationsFolder: migrationsDir });

      isAvailable = true;
    } catch (connErr) {
      if (process.env.CI === "true") {
        throw new Error(
          `[CI FAILURE] PostgreSQL integration setup failed in CI: ${connErr instanceof Error ? connErr.message : String(connErr)}`
        );
      }
      console.log(`\n[PREREQUISITE SKIPPED] Cannot connect to PostgreSQL at ${integrationDbUrl}: ${connErr instanceof Error ? connErr.message : String(connErr)}`);
      isAvailable = false;
      if (adminSql) {
        await adminSql.end({ timeout: 1 }).catch(() => {});
        adminSql = null;
      }
    }
  });

  after(async () => {
    // Fail CI if not all 6 required integration scenarios were executed and passed
    if (process.env.CI === "true" && executedScenarioCount < 6) {
      throw new Error(
        `[CI FAILURE] Incomplete integration run in CI: expected 6 scenarios to execute and pass, but only ${executedScenarioCount} completed.`
      );
    }

    if (!isAvailable || !sharedDb || !adminSql) return;

    // Clean up only test-owned records
    try {
      if (testEventIds.length > 0) {
        await sharedDb.delete(webhookEvent).where(or(...testEventIds.map((id) => eq(webhookEvent.id, id))));
      }
      if (testSubIds.length > 0) {
        await sharedDb.delete(subscription).where(or(...testSubIds.map((id) => eq(subscription.id, id))));
      }
      if (testOrderIds.length > 0) {
        await sharedDb.delete(paymentTransaction).where(or(...testOrderIds.map((id) => eq(paymentTransaction.orderId, id))));
        await sharedDb.delete(order).where(or(...testOrderIds.map((id) => eq(order.id, id))));
      }
      if (testOrgIds.length > 0) {
        await sharedDb.delete(organization).where(or(...testOrgIds.map((id) => eq(organization.id, id))));
      }
      if (testUserIds.length > 0) {
        await sharedDb.delete(user).where(or(...testUserIds.map((id) => eq(user.id, id))));
      }
    } catch (cleanupErr) {
      console.error("Test cleanup error:", cleanupErr);
    } finally {
      await adminSql.end({ timeout: 2 }).catch(() => {});
    }
  });

  function createSignedPayload(params: {
    orderId: string;
    grossAmount: number;
    statusCode?: string;
    transactionStatus?: string;
    fraudStatus?: string;
    transactionId?: string;
  }) {
    const statusCode = params.statusCode || "200";
    const grossAmountStr = `${params.grossAmount}.00`;
    const raw = `${params.orderId}${statusCode}${grossAmountStr}${testServerKey}`;
    const signature = crypto.createHash("sha512").update(raw).digest("hex");

    return {
      order_id: params.orderId,
      status_code: statusCode,
      gross_amount: grossAmountStr,
      signature_key: signature,
      transaction_id: params.transactionId || `trx_${params.orderId}`,
      transaction_status: params.transactionStatus || "settlement",
      fraud_status: params.fraudStatus || "accept",
      payment_type: "credit_card",
      transaction_time: new Date().toISOString(),
    };
  }

  async function seedTestOrder(orderId: string, amount = 149000, initialStatus = "pending") {
    if (!sharedDb) throw new Error("Database not connected");

    const userId = `usr_${orderId}`;
    testUserIds.push(userId);
    testOrderIds.push(orderId);

    await sharedDb.insert(user).values({
      id: userId,
      name: "Integration Test User",
      email: `${userId}@example.com`,
      emailVerified: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await sharedDb.insert(order).values({
      id: orderId,
      userId,
      organizationId: null,
      itemType: "subscription",
      planId: "starter",
      billingPeriod: "monthly",
      amount,
      currency: "IDR",
      status: initialStatus,
      metadata: {},
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  // --- SCENARIO A: Webhook Idempotency ---
  it("Scenario A: Repeated settlement delivery is idempotent and creates exactly one subscription", async (t) => {
    if (!isAvailable || !sharedDb) {
      if (process.env.CI === "true") {
        assert.fail("[CI FAILURE] Integration scenario A was reached without an active PostgreSQL connection.");
      }
      t.skip("PostgreSQL test database not available");
      return;
    }

    const orderId = `ord_test_idemp_${Date.now()}`;
    await seedTestOrder(orderId, 149000);
    const service = new BillingService(sharedDb);
    const payload = createSignedPayload({ orderId, grossAmount: 149000 });

    // 1st delivery
    const res1 = await service.processWebhookNotification(payload);
    assert.equal(res1.success, true);
    assert.equal(res1.duplicate, false);

    // 2nd delivery (identical payload)
    const res2 = await service.processWebhookNotification(payload);
    assert.equal(res2.success, true);
    assert.equal(res2.duplicate, true);

    // 3rd delivery with alternate decimal format ("149000")
    const payloadCanonical = { ...payload, gross_amount: "149000" };
    const res3 = await service.processWebhookNotification(payloadCanonical);
    assert.equal(res3.success, true);
    assert.equal(res3.duplicate, true);

    // Verify database state: exactly 1 subscription, 1 settled order
    const subscriptions = await sharedDb.select().from(subscription).where(eq(subscription.orderId, orderId));
    assert.equal(subscriptions.length, 1);
    assert.equal(subscriptions[0].orderId, orderId);
    assert.equal(subscriptions[0].status, "active");
    testSubIds.push(subscriptions[0].id);

    const [persistedOrder] = await sharedDb.select().from(order).where(eq(order.id, orderId));
    assert.equal(persistedOrder.status, "settlement");
    assert.ok(persistedOrder.paidAt);

    executedScenarioCount++;
  });

  // --- SCENARIO B: Concurrent Duplicate Delivery ---
  it("Scenario B: Concurrent duplicate delivery via separate connections creates at most one subscription", async (t) => {
    if (!isAvailable || !sharedDb || !integrationDbUrl) {
      if (process.env.CI === "true") {
        assert.fail("[CI FAILURE] Integration scenario B was reached without an active PostgreSQL connection.");
      }
      t.skip("PostgreSQL test database not available");
      return;
    }

    const orderId = `ord_test_concurr_${Date.now()}`;
    await seedTestOrder(orderId, 149000);

    // Create 3 separate physical database connections
    const sqlClients = [
      postgres(integrationDbUrl, { max: 1, prepare: false }),
      postgres(integrationDbUrl, { max: 1, prepare: false }),
      postgres(integrationDbUrl, { max: 1, prepare: false }),
    ];

    try {
      // Verify all 3 clients represent genuinely distinct PostgreSQL backend sessions
      const pids = await Promise.all(
        sqlClients.map(async (client) => {
          const [row] = await client<{ pid: number }[]>`SELECT pg_backend_pid() as pid`;
          return row.pid;
        })
      );
      assert.equal(new Set(pids).size, 3, "Concurrent clients must have distinct PostgreSQL backend PIDs");

      const services = sqlClients.map((client) => new BillingService(drizzle(client, { schema })));
      const payload = createSignedPayload({ orderId, grossAmount: 149000 });

      // Execute all 3 deliveries concurrently
      const results = await Promise.all(services.map((svc) => svc.processWebhookNotification(payload)));

      // Assert all reported success
      assert.equal(results.every((r) => r.success), true);

      // Verify that exactly 1 logical subscription exists in PostgreSQL
      const subs = await sharedDb.select().from(subscription).where(eq(subscription.orderId, orderId));
      assert.equal(subs.length, 1);
      assert.equal(subs[0].orderId, orderId);
      testSubIds.push(subs[0].id);

      // Verify order status
      const [persistedOrder] = await sharedDb.select().from(order).where(eq(order.id, orderId));
      assert.equal(persistedOrder.status, "settlement");

      executedScenarioCount++;
    } finally {
      await Promise.all(sqlClients.map((c) => c.end({ timeout: 1 }).catch(() => {})));
    }
  });

  // --- SCENARIO C: Concurrent Competing Settlement & Out-of-order Events ---
  it("Scenario C: Delayed expire/deny notifications cannot regress settled order in database", async (t) => {
    if (!isAvailable || !sharedDb || !integrationDbUrl) {
      if (process.env.CI === "true") {
        assert.fail("[CI FAILURE] Integration scenario C was reached without an active PostgreSQL connection.");
      }
      t.skip("PostgreSQL test database not available");
      return;
    }

    const orderId = `ord_test_compete_${Date.now()}`;
    await seedTestOrder(orderId, 149000);

    const client1 = postgres(integrationDbUrl, { max: 1, prepare: false });
    const client2 = postgres(integrationDbUrl, { max: 1, prepare: false });

    try {
      const svc1 = new BillingService(drizzle(client1, { schema }));
      const svc2 = new BillingService(drizzle(client2, { schema }));

      // Svc1 processes settlement
      const settlementPayload = createSignedPayload({
        orderId,
        grossAmount: 149000,
        transactionStatus: "settlement",
        statusCode: "200",
      });
      await svc1.processWebhookNotification(settlementPayload);

      // Svc2 attempts to process a stale delayed expire event
      const expirePayload = createSignedPayload({
        orderId,
        grossAmount: 149000,
        transactionStatus: "expire",
        statusCode: "202",
        transactionId: `trx_expire_${orderId}`,
      });
      await svc2.processWebhookNotification(expirePayload);

      // Assert order status in PostgreSQL is STILL settlement
      const [persistedOrder] = await sharedDb.select().from(order).where(eq(order.id, orderId));
      assert.equal(persistedOrder.status, "settlement");

      // Verify paymentTransaction table did not regress
      const trxs = await sharedDb.select().from(paymentTransaction).where(eq(paymentTransaction.orderId, orderId));
      const settlementTrx = trxs.find((t) => t.transactionStatus === "settlement");
      assert.ok(settlementTrx, "Settlement transaction record must remain intact");

      // Next: verify legitimate refund event transitions order to refund
      const refundPayload = createSignedPayload({
        orderId,
        grossAmount: 149000,
        transactionStatus: "refund",
        statusCode: "200",
        transactionId: `trx_refund_${orderId}`,
      });
      await svc1.processWebhookNotification(refundPayload);

      const [refundedOrder] = await sharedDb.select().from(order).where(eq(order.id, orderId));
      assert.equal(refundedOrder.status, "refund");

      executedScenarioCount++;
    } finally {
      await Promise.all([client1.end({ timeout: 1 }), client2.end({ timeout: 1 })]);
    }
  });

  // --- SCENARIO D: Transaction Atomicity & Failure Audit Decoupling ---
  it("Scenario D: Processing failure rolls back business changes and persists failure audit independently", async (t) => {
    if (!isAvailable || !sharedDb) {
      if (process.env.CI === "true") {
        assert.fail("[CI FAILURE] Integration scenario D was reached without an active PostgreSQL connection.");
      }
      t.skip("PostgreSQL test database not available");
      return;
    }

    const orderId = `ord_test_atomic_${Date.now()}`;
    await seedTestOrder(orderId, 149000);
    const service = new BillingService(sharedDb);

    // Send payload with gross_amount mismatch (e.g. 999999 instead of 149000)
    const invalidAmountPayload = createSignedPayload({
      orderId,
      grossAmount: 999999, // Mismatch with order amount 149000
    });

    await assert.rejects(
      async () => {
        await service.processWebhookNotification(invalidAmountPayload);
      },
      /Gross amount mismatch/
    );

    // 1. Confirm business changes rolled back: order is STILL pending
    const [persistedOrder] = await sharedDb.select().from(order).where(eq(order.id, orderId));
    assert.equal(persistedOrder.status, "pending");
    assert.equal(persistedOrder.paidAt, null);

    // 2. Confirm no subscription was created
    const subs = await sharedDb.select().from(subscription).where(eq(subscription.orderId, orderId));
    assert.equal(subs.length, 0);

    // 3. Confirm failure audit was persisted independently in webhook_event
    const events = await sharedDb.select().from(webhookEvent).where(eq(webhookEvent.orderId, orderId));
    assert.ok(events.length > 0, "Failure audit event must be recorded");
    const failedEvent = events[0];
    assert.equal(failedEvent.processed, false);
    assert.match(failedEvent.processingError || "", /Gross amount mismatch/);
    testEventIds.push(failedEvent.id);

    executedScenarioCount++;
  });

  // --- SCENARIO E: Distinct Orders Concurrency ---
  it("Scenario E: Concurrent settlements for distinct orders maintain correct isolation and 1:1 mapping", async (t) => {
    if (!isAvailable || !sharedDb || !integrationDbUrl) {
      if (process.env.CI === "true") {
        assert.fail("[CI FAILURE] Integration scenario E was reached without an active PostgreSQL connection.");
      }
      t.skip("PostgreSQL test database not available");
      return;
    }

    const orderId1 = `ord_test_dist1_${Date.now()}`;
    const orderId2 = `ord_test_dist2_${Date.now()}`;
    await seedTestOrder(orderId1, 149000);
    await seedTestOrder(orderId2, 299000);

    const client1 = postgres(integrationDbUrl, { max: 1, prepare: false });
    const client2 = postgres(integrationDbUrl, { max: 1, prepare: false });

    try {
      // Verify both clients represent genuinely distinct PostgreSQL backend sessions
      const [pid1Res, pid2Res] = await Promise.all([
        client1<{ pid: number }[]>`SELECT pg_backend_pid() as pid`,
        client2<{ pid: number }[]>`SELECT pg_backend_pid() as pid`,
      ]);
      assert.notEqual(pid1Res[0].pid, pid2Res[0].pid, "Distinct order settlement clients must have distinct PostgreSQL backend PIDs");

      const svc1 = new BillingService(drizzle(client1, { schema }));
      const svc2 = new BillingService(drizzle(client2, { schema }));

      const p1 = createSignedPayload({ orderId: orderId1, grossAmount: 149000 });
      const p2 = createSignedPayload({ orderId: orderId2, grossAmount: 299000 });

      // Run distinct settlements concurrently
      const [r1, r2] = await Promise.all([svc1.processWebhookNotification(p1), svc2.processWebhookNotification(p2)]);

      assert.equal(r1.success, true);
      assert.equal(r2.success, true);

      // Verify each subscription has the correct distinct orderId
      const [sub1] = await sharedDb.select().from(subscription).where(eq(subscription.orderId, orderId1));
      const [sub2] = await sharedDb.select().from(subscription).where(eq(subscription.orderId, orderId2));

      assert.ok(sub1, "Sub 1 must exist");
      assert.ok(sub2, "Sub 2 must exist");
      assert.notEqual(sub1.id, sub2.id);
      assert.equal(sub1.orderId, orderId1);
      assert.equal(sub2.orderId, orderId2);
      testSubIds.push(sub1.id, sub2.id);

      executedScenarioCount++;
    } finally {
      await Promise.all([client1.end({ timeout: 1 }), client2.end({ timeout: 1 })]);
    }
  });

  // --- SCENARIO F: Database Constraints and Deletion Behavior ---
  it("Scenario F: Nullable order_id foreign key preserves subscription on order deletion (SET NULL)", async (t) => {
    if (!isAvailable || !sharedDb) {
      if (process.env.CI === "true") {
        assert.fail("[CI FAILURE] Integration scenario F was reached without an active PostgreSQL connection.");
      }
      t.skip("PostgreSQL test database not available");
      return;
    }

    const orderId = `ord_test_del_${Date.now()}`;
    await seedTestOrder(orderId, 149000);
    const service = new BillingService(sharedDb);
    const payload = createSignedPayload({ orderId, grossAmount: 149000 });

    await service.processWebhookNotification(payload);

    const [sub] = await sharedDb.select().from(subscription).where(eq(subscription.orderId, orderId));
    assert.ok(sub);
    testSubIds.push(sub.id);

    // Delete the order fixture; FK constraint is ON DELETE SET NULL
    await sharedDb.delete(order).where(eq(order.id, orderId));

    // Subscription must still exist with orderId set to null
    const [preservedSub] = await sharedDb.select().from(subscription).where(eq(subscription.id, sub.id));
    assert.ok(preservedSub, "Subscription must not be cascaded/deleted");
    assert.equal(preservedSub.orderId, null, "orderId must be set to null per ON DELETE SET NULL");

    executedScenarioCount++;
  });
});
