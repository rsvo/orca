import React from 'react'
import { Ban } from 'lucide-react'
import { cn } from '@/lib/utils'
import { translate } from '@/i18n/i18n'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import type { GitHubIssueBlockedByRef } from '../../../../shared/github/work-item-types'
import {
  GITHUB_ISSUE_BLOCKED_BADGE_CLASS,
  GITHUB_ISSUE_BLOCKED_PILL_CLASS,
  githubIssueBlockedByCount,
  isGitHubIssueBlocked
} from './github-issue-blocked-presentation'

type BlockedItem = {
  type?: string
  blockedByCount?: number
  blockedBy?: readonly GitHubIssueBlockedByRef[]
}

/** Compact list marker: sits beside the #id pill, matching GitHub's issues-list icon. */
export function GitHubIssueBlockedListMarker({
  item
}: {
  item: BlockedItem
}): React.JSX.Element | null {
  if (!isGitHubIssueBlocked(item)) {
    return null
  }
  const count = githubIssueBlockedByCount(item)
  const label = translate('auto.components.TaskPage.blocked', 'Blocked')
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span
          className={cn(
            'inline-flex shrink-0 items-center gap-1 rounded-md border px-1.5 py-0.5 text-[11px] font-medium',
            GITHUB_ISSUE_BLOCKED_BADGE_CLASS
          )}
          aria-label={translate('auto.components.TaskPage.blockedByCount', 'Blocked by {{count}}', {
            count
          })}
        >
          <Ban className="size-3" aria-hidden="true" />
          <span>{label}</span>
        </span>
      </TooltipTrigger>
      <TooltipContent side="bottom" sideOffset={6}>
        {translate('auto.components.TaskPage.blockedByCount', 'Blocked by {{count}}', { count })}
      </TooltipContent>
    </Tooltip>
  )
}

/** Detail header pill next to Open/Closed — same weight as GitHub's status chip. */
export function GitHubIssueBlockedStatusPill({
  item
}: {
  item: BlockedItem
}): React.JSX.Element | null {
  if (!isGitHubIssueBlocked(item)) {
    return null
  }
  const count = githubIssueBlockedByCount(item)
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[12px] font-medium',
        GITHUB_ISSUE_BLOCKED_PILL_CLASS
      )}
      title={translate('auto.components.TaskPage.blockedByCount', 'Blocked by {{count}}', {
        count
      })}
    >
      <Ban className="size-3.5" aria-hidden="true" />
      {translate('auto.components.TaskPage.blocked', 'Blocked')}
    </span>
  )
}

/** Relationships column body: GitHub's "Blocked by" list when nodes exist. */
export function GitHubIssueBlockedByRelationships({
  item
}: {
  item: BlockedItem
}): React.JSX.Element | null {
  if (!isGitHubIssueBlocked(item)) {
    return null
  }
  const count = githubIssueBlockedByCount(item)
  const refs = item.blockedBy ?? []
  if (refs.length === 0) {
    return (
      <div className="text-[12px] text-muted-foreground">
        {translate('auto.components.GitHubItemDialog.blockedByOpenCount', '{{count}} open', {
          count
        })}
      </div>
    )
  }
  return (
    <ul className="flex min-w-0 flex-col gap-1">
      {refs.map((ref) => (
        <li key={ref.number} className="min-w-0">
          {ref.url ? (
            <button
              type="button"
              className="inline-flex max-w-full items-center gap-1 truncate text-left text-[12px] text-foreground hover:underline"
              onClick={(event) => {
                event.preventDefault()
                event.stopPropagation()
                void window.api.shell.openUrl(ref.url)
              }}
            >
              <Ban
                className="size-3 shrink-0 text-amber-700 dark:text-amber-300"
                aria-hidden="true"
              />
              <span className="truncate">
                #{ref.number}
                {ref.title ? ` ${ref.title}` : ''}
              </span>
            </button>
          ) : (
            <span className="inline-flex max-w-full items-center gap-1 truncate text-[12px] text-muted-foreground">
              <Ban className="size-3 shrink-0" aria-hidden="true" />#{ref.number}
              {ref.title ? ` ${ref.title}` : ''}
            </span>
          )}
        </li>
      ))}
    </ul>
  )
}
