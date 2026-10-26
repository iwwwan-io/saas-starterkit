import { and, eq, inArray, isNotNull, ne } from "drizzle-orm";
import { db } from "@/server/db";
import { member, organization } from "@/server/db/schema/organizations";
import { order, subscription } from "@/server/db/schema/billing";

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
  /** True when the deleting user is the payer on an order or subscription owned by this organization. */
  isPayer: boolean;
}

/**
 * Decides whether deleting a user would harm a workspace they share with others.
 *
 * `order.userId` and `subscription.userId` cascade on user delete, so when a user is
 * the payer for an organization's plan, removing that user also removes the plan and
 * its payment history. `member` rows cascade too, so a sole owner leaves an
 * organization nobody can administer.
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

    if (fact.isPayer) {
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
        ? `you are the only owner of "${blocker.organizationName}", which still has other members`
        : `you are the billing contact for "${blocker.organizationName}", and other members still use that plan`
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

  const payerOrgIds = await findPayerOrganizationIds(userId, dbClient);

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
      isPayer: payerOrgIds.has(membership.organizationId),
    };
  });
}

/**
 * A cancelled order never delivered a plan, so it does not make the user a billing
 * contact. Every other status is treated as a real commitment and fails closed.
 */
async function findPayerOrganizationIds(
  userId: string,
  dbClient: typeof db
): Promise<Set<string>> {
  const [orderRows, subscriptionRows] = await Promise.all([
    dbClient
      .select({ organizationId: order.organizationId })
      .from(order)
      .where(
        and(
          eq(order.userId, userId),
          isNotNull(order.organizationId),
          ne(order.status, "expire")
        )
      ),
    dbClient
      .select({ organizationId: subscription.organizationId })
      .from(subscription)
      .where(
        and(eq(subscription.userId, userId), isNotNull(subscription.organizationId))
      ),
  ]);

  const ids = new Set<string>();
  for (const row of [...orderRows, ...subscriptionRows]) {
    if (row.organizationId) ids.add(row.organizationId);
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
