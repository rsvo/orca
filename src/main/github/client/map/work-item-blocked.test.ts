import { describe, expect, it } from 'vitest'
import { mapIssueWorkItem } from './work-item'

describe('mapIssueWorkItem blockedByCount', () => {
  it('maps REST issue_dependencies_summary.blocked_by', () => {
    const item = mapIssueWorkItem({
      number: 12,
      title: 'Blocked work',
      state: 'open',
      html_url: 'https://github.com/acme/widgets/issues/12',
      labels: [],
      updated_at: '2026-03-29T00:00:00Z',
      user: { login: 'octocat' },
      issue_dependencies_summary: {
        blocked_by: 2,
        blocking: 0,
        total_blocked_by: 2,
        total_blocking: 0
      }
    })
    expect(item.blockedByCount).toBe(2)
  })

  it('maps gh blockedBy.totalCount', () => {
    const item = mapIssueWorkItem({
      number: 12,
      title: 'Blocked work',
      state: 'open',
      url: 'https://github.com/acme/widgets/issues/12',
      labels: [],
      updatedAt: '2026-03-29T00:00:00Z',
      author: { login: 'octocat' },
      blockedBy: { totalCount: 1, nodes: [{ number: 11 }] }
    })
    expect(item.blockedByCount).toBe(1)
  })

  it('omits blockedByCount when the summary is absent', () => {
    const item = mapIssueWorkItem({
      number: 12,
      title: 'Plain work',
      state: 'open',
      html_url: 'https://github.com/acme/widgets/issues/12',
      labels: [],
      updated_at: '2026-03-29T00:00:00Z',
      user: { login: 'octocat' }
    })
    expect(item.blockedByCount).toBeUndefined()
  })
})
