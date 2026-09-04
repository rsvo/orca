import { describe, expect, it } from 'vitest'
import {
  githubIssueBlockedByCount,
  isGitHubIssueBlocked
} from './github-issue-blocked-presentation'

describe('github issue blocked presentation', () => {
  it('treats only issues with open blockers as blocked', () => {
    expect(isGitHubIssueBlocked({ type: 'issue', blockedByCount: 2 })).toBe(true)
    expect(isGitHubIssueBlocked({ type: 'issue', blockedByCount: 0 })).toBe(false)
    expect(isGitHubIssueBlocked({ type: 'pr', blockedByCount: 2 })).toBe(false)
  })

  it('prefers blockedByCount over blockedBy length', () => {
    expect(
      githubIssueBlockedByCount({
        blockedByCount: 3,
        blockedBy: [{ number: 1, title: 'a', url: 'https://example.com/1' }]
      })
    ).toBe(3)
  })
})
