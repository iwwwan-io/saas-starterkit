import { and, eq, inArray, isNotNull } from "drizzle-orm";
import { db } from "@/server/db";
import { member, organization } from "@/server/db/schema/organizations";
import { subscription } from "@/server/db/schema/billing";
import { isSubscriptionActive } from "@/modules/billing/service";

export type DeletionBlockerReason = "sole_owner" | "organization_payer";

export interface DeletionBlocker {
  reason: DeletionBlockerReason;
  organizationId: string;
  organizationName: string;
}

export interface OrgMembershipFacts {
  organizationId: string;
  organizationName: string;
  /** Role the deleting user holds in this organization. */
  role: string;
  /** Total members in the organization, including the deleting user. */
  memberCount: number;
  ownerCount: number;
  /**
   * True when the organization is currently entitled to a plan this user paid for, so
   * deleting the user would strip a live plan from the other members.
   */
  hasActivePaidPlan: boolean;
}

/**
 * Decides whether deleting a user would harm a workspace they share with others.
 *
 * `subscription.userId` cascades on user delete, so when a user is the payer for an
 * organization's live plan, removing that user also removes the plan the other members
 * are using. `member` rows cascade too, so a sole owner leaves an organization nobody
 * can administer.
 *
 * Only a currently entitled plan blocks deletion. A lapsed or cancelled subscription
 * destroys nothing of value, and blocking on it would strand the user forever with no
 * self-serve way out.
 *
 * An organization whose only member is the deleting user is not a blocker: the
 * organization and everything in it cascades away with the account.
 */
export function evaluateDeletionBlockers(
  facts: OrgMembershipFacts[]
): DeletionBlocker[] {
  const blockers: DeletionBlocker[] = [];

  for (const fact of facts) {
    if (fact.memberCount <= 1) continue;

    if (fact.role === "owner" && fact.ownerCount <= 1) {
      blockers.push({
        reason: "sole_owner",
        organizationId: fact.organizationId,
        organizationName: fact.organizationName,
      });
      continue;
    }

    if (fact.hasActivePaidPlan) {
      blockers.push({
        reason: "organization_payer",
        organizationId: fact.organizationId,
        organizationName: fact.organizationName,
      });
    }
  }

  return blockers;
}

export function describeDeletionBlockers(blockers: DeletionBlocker[]): string {
  return blockers
    .map((blocker) =>
      blocker.reason === "sole_owner"
        ? `you are the only owner of "${blocker.organizationName}", which still has other members (promote another member to owner first)`
        : `you pay for "${blocker.organizationName}", and other members are still using that plan (it must lapse, or billing must move to another owner or admin, before this account can go)`
    )
    .join("; ");
}

/**
 * Collects the facts `evaluateDeletionBlockers` needs for a user.
 * Only organizations the user actually belongs to are inspected.
 */
export async function collectOrgMembershipFacts(
  userId: string,
  dbClient: typeof db = db
): Promise<OrgMembershipFacts[]> {
  const memberships = await dbClient
    .select({
      organizationId: member.organizationId,
      role: member.role,
      organizationName: organization.name,
    })
    .from(member)
    .innerJoin(organization, eq(member.organizationId, organization.id))
    .where(eq(member.userId, userId));

  if (memberships.length === 0) return [];

  const organizationIds = memberships.map((row) => row.organizationId);

  const allMembers = await dbClient
    .select({
      organizationId: member.organizationId,
      role: member.role,
    })
    .from(member)
    .where(inArray(member.organizationId, organizationIds));

  const payerOrgIds = await findEntitledPayerOrganizationIds(userId, dbClient);

  return memberships.map((membership) => {
    const rows = allMembers.filter(
      (row) => row.organizationId === membership.organizationId
    );

    return {
      organizationId: membership.organizationId,
      organizationName: membership.organizationName,
      role: membership.role,
      memberCount: rows.length,
      ownerCount: rows.filter((row) => row.role === "owner").length,
      hasActivePaidPlan: payerOrgIds.has(membership.organizationId),
    };
  });
}

/**
 * Organizations this user pays for that are still entitled right now.
 *
 * `isSubscriptionActive` is the same predicate the billing code uses to decide
 * entitlement, so the guard and the product agree on what "has a plan" means: a row
 * whose period ended, or whose status is no longer `active`, is not a live plan.
 */
async function findEntitledPayerOrganizationIds(
  userId: string,
  dbClient: typeof db,
  now = new Date()
): Promise<Set<string>> {
  const rows = await dbClient
    .select({
      organizationId: subscription.organizationId,
      status: subscription.status,
      billingPeriod: subscription.billingPeriod,
      currentPeriodEnd: subscription.currentPeriodEnd,
    })
    .from(subscription)
    .where(
      and(eq(subscription.userId, userId), isNotNull(subscription.organizationId))
    );

  const ids = new Set<string>();
  for (const row of rows) {
    if (row.organizationId && isSubscriptionActive(row, now)) {
      ids.add(row.organizationId);
    }
  }
  return ids;
}

export async function findDeletionBlockers(
  userId: string,
  dbClient: typeof db = db
): Promise<DeletionBlocker[]> {
  return evaluateDeletionBlockers(
    await collectOrgMembershipFacts(userId, dbClient)
  );
}

/**
 * Removes workspaces that exist only for the user being deleted.
 *
 * No foreign key links `user` to `organization`; only `member.userId` cascades. Left
 * alone, deleting a sole member would strand an organization row with no members that
 * still holds its unique slug, so nobody could ever reuse it.
 *
 * Must run before the user row is deleted, while membership is still readable.
 */
export async function deleteSoleMemberOrganizations(
  facts: OrgMembershipFacts[],
  dbClient: typeof db = db
): Promise<string[]> {
  const soleOrganizationIds = facts
    .filter((fact) => fact.memberCount <= 1)
    .map((fact) => fact.organizationId);

  if (soleOrganizationIds.length === 0) return [];

  await dbClient
    .delete(organization)
    .where(inArray(organization.id, soleOrganizationIds));

  return soleOrganizationIds;
}
