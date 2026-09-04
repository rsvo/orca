import type { GitHubIssueBlockedByRef } from '../../../../shared/github/work-item-types'

/** Amber: blocked is workflow state, distinct from open (emerald) and closed (rose). */
export const GITHUB_ISSUE_BLOCKED_BADGE_CLASS =
  'border-amber-500/35 bg-amber-500/10 text-amber-800 dark:text-amber-200'

export const GITHUB_ISSUE_BLOCKED_PILL_CLASS = 'bg-amber-600 text-white'

export function githubIssueBlockedByCount(item: {
  blockedByCount?: number
  blockedBy?: readonly GitHubIssueBlockedByRef[]
}): number {
  if (typeof item.blockedByCount === 'number') {
    return item.blockedByCount
  }
  return item.blockedBy?.length ?? 0
}

export function isGitHubIssueBlocked(item: {
  type?: string
  blockedByCount?: number
  blockedBy?: readonly GitHubIssueBlockedByRef[]
}): boolean {
  return item.type === 'issue' && githubIssueBlockedByCount(item) > 0
}
