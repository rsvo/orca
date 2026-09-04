import type { OwnerRepo } from '../../gh-utils'
import type { GitHubIssueBlockedByRef } from '../../../../shared/github/work-item-types'
import {
  authorFieldsFromUnknown,
  extractHeadOwnerLogin,
  usersFromUnknown,
  latestReviewsFromUnknown,
  numberFromUnknown,
  normalizePRMergeable,
  normalizeReviewDecision,
  isAutoMergeEnabled,
  deriveWorkItemCheckSummary,
  type MainWorkItem
} from './work-item-field-coercion'

function blockedByRefsFromUnknown(
  item: Record<string, unknown>
): GitHubIssueBlockedByRef[] | undefined {
  const blockedBy = item.blockedBy
  if (typeof blockedBy !== 'object' || blockedBy === null) {
    return undefined
  }
  const nodes = (blockedBy as { nodes?: unknown }).nodes
  if (!Array.isArray(nodes)) {
    return undefined
  }
  const refs: GitHubIssueBlockedByRef[] = []
  for (const node of nodes) {
    if (typeof node !== 'object' || node === null) {
      continue
    }
    const number = numberFromUnknown((node as { number?: unknown }).number)
    if (number === undefined) {
      continue
    }
    refs.push({
      number,
      title: String((node as { title?: unknown }).title ?? ''),
      url: String(
        (node as { url?: unknown; html_url?: unknown }).url ??
          (node as { html_url?: unknown }).html_url ??
          ''
      )
    })
  }
  return refs.length > 0 ? refs : undefined
}

function blockedByCountFromUnknown(item: Record<string, unknown>): number | undefined {
  const summary = item.issue_dependencies_summary ?? item.issueDependenciesSummary
  if (typeof summary === 'object' && summary !== null) {
    const count = numberFromUnknown(
      (summary as { blocked_by?: unknown; blockedBy?: unknown }).blocked_by ??
        (summary as { blockedBy?: unknown }).blockedBy
    )
    if (count !== undefined) {
      return count
    }
  }
  // Why: `gh issue view/list --json blockedBy` returns `{ totalCount, nodes }`.
  const blockedBy = item.blockedBy
  if (typeof blockedBy === 'object' && blockedBy !== null) {
    const total = numberFromUnknown((blockedBy as { totalCount?: unknown }).totalCount)
    if (total !== undefined) {
      return total
    }
  }
  return blockedByRefsFromUnknown(item)?.length
}

export function mapIssueWorkItem(item: Record<string, unknown>): MainWorkItem {
  const blockedBy = blockedByRefsFromUnknown(item)
  const blockedByCount = blockedByCountFromUnknown(item) ?? blockedBy?.length
  return {
    id: `issue:${String(item.number)}`,
    type: 'issue',
    number: Number(item.number),
    title: String(item.title ?? ''),
    state: String(item.state ?? 'open') === 'closed' ? 'closed' : 'open',
    url: String(item.html_url ?? item.url ?? ''),
    labels: Array.isArray(item.labels)
      ? item.labels
          .map((label) =>
            typeof label === 'object' && label !== null && 'name' in label
              ? String((label as { name?: unknown }).name ?? '')
              : ''
          )
          .filter(Boolean)
      : [],
    updatedAt: String(item.updated_at ?? item.updatedAt ?? ''),
    ...authorFieldsFromUnknown(item),
    ...(item.assignees !== undefined ? { assignees: usersFromUnknown(item.assignees) } : {}),
    ...(blockedByCount !== undefined ? { blockedByCount } : {}),
    ...(blockedBy !== undefined ? { blockedBy } : {})
  }
}

export function mapPullRequestWorkItem(
  item: Record<string, unknown>,
  baseOwnerRepo: OwnerRepo | null = null
): MainWorkItem {
  // Why: fork PRs are disabled in the Start-from picker; compare head owner to the selected repo's owner.
  const headOwnerLogin = extractHeadOwnerLogin(item)
  // Why: leave isCrossRepository undefined when the head owner is unknown, rather than falsely claiming "not a fork".
  const isCrossRepository =
    headOwnerLogin !== null && baseOwnerRepo !== null
      ? headOwnerLogin !== baseOwnerRepo.owner
      : null
  const state = String(item.state ?? '').toLowerCase()
  const additions = numberFromUnknown(item.additions)
  const deletions = numberFromUnknown(item.deletions)
  const changedFiles = numberFromUnknown(
    item.changedFiles ??
      item.changed_files ??
      (item.files as { totalCount?: unknown } | undefined)?.totalCount
  )
  const mergeable = normalizePRMergeable(item.mergeable)
  const headSha =
    typeof item.headRefOid === 'string'
      ? item.headRefOid
      : typeof item.head === 'object' && item.head !== null
        ? typeof (item.head as { sha?: unknown }).sha === 'string'
          ? (item.head as { sha: string }).sha
          : undefined
        : undefined
  return {
    id: `pr:${String(item.number)}`,
    type: 'pr',
    number: Number(item.number),
    title: String(item.title ?? ''),
    state:
      state === 'merged' || item.merged_at || item.mergedAt
        ? 'merged'
        : state === 'closed'
          ? 'closed'
          : item.isDraft || item.draft
            ? 'draft'
            : 'open',
    url: String(item.html_url ?? item.url ?? ''),
    labels: Array.isArray(item.labels)
      ? item.labels
          .map((label) =>
            typeof label === 'object' && label !== null && 'name' in label
              ? String((label as { name?: unknown }).name ?? '')
              : ''
          )
          .filter(Boolean)
      : [],
    updatedAt: String(item.updated_at ?? item.updatedAt ?? ''),
    ...authorFieldsFromUnknown(item),
    branchName:
      typeof item.head === 'object' && item.head !== null && 'ref' in item.head
        ? String((item.head as { ref?: unknown }).ref ?? '')
        : String(item.headRefName ?? ''),
    baseRefName:
      typeof item.base === 'object' && item.base !== null && 'ref' in item.base
        ? String((item.base as { ref?: unknown }).ref ?? '')
        : String(item.baseRefName ?? ''),
    ...(headSha ? { headSha } : {}),
    ...(baseOwnerRepo
      ? {
          prRepo: {
            owner: baseOwnerRepo.owner,
            repo: baseOwnerRepo.repo,
            ...(baseOwnerRepo.host ? { host: baseOwnerRepo.host } : {})
          }
        }
      : {}),
    ...(additions !== undefined ? { additions } : {}),
    ...(deletions !== undefined ? { deletions } : {}),
    ...(changedFiles !== undefined ? { changedFiles } : {}),
    ...('reviewDecision' in item
      ? { reviewDecision: normalizeReviewDecision(item.reviewDecision) }
      : {}),
    ...(item.reviewRequests !== undefined || item.requested_reviewers !== undefined
      ? { reviewRequests: usersFromUnknown(item.reviewRequests ?? item.requested_reviewers) }
      : {}),
    ...(item.latestReviews !== undefined
      ? { latestReviews: latestReviewsFromUnknown(item.latestReviews) }
      : {}),
    ...(item.assignees !== undefined ? { assignees: usersFromUnknown(item.assignees) } : {}),
    ...(item.statusCheckRollup !== undefined
      ? { checksSummary: deriveWorkItemCheckSummary(item.statusCheckRollup) }
      : {}),
    ...(mergeable ? { mergeable } : {}),
    ...('autoMergeRequest' in item
      ? { autoMergeEnabled: isAutoMergeEnabled(item.autoMergeRequest) }
      : {}),
    ...('mergeStateStatus' in item
      ? {
          mergeStateStatus: typeof item.mergeStateStatus === 'string' ? item.mergeStateStatus : null
        }
      : {}),
    ...(typeof item.maintainerCanModify === 'boolean'
      ? { maintainerCanModify: item.maintainerCanModify }
      : {}),
    ...(isCrossRepository !== null ? { isCrossRepository } : {})
  }
}
