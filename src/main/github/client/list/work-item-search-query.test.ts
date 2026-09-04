import { describe, expect, it } from 'vitest'
import { parseTaskQuery } from '../../../../shared/task-query'
import {
  buildIssueSearchIssuesApiPath,
  buildSearchQueryString,
  defaultOpenWorkItemQuery
} from './work-item-search-query'

describe('buildIssueSearchIssuesApiPath', () => {
  it('pins advanced_search on github.com so is:blocked is honored', () => {
    expect(
      buildIssueSearchIssuesApiPath({
        query: 'repo:acme/widgets is:issue is:open',
        sort: 'created',
        order: 'desc',
        perPage: 10,
        page: 1
      })
    ).toBe(
      `search/issues?q=${encodeURIComponent('repo:acme/widgets is:issue is:open')}&sort=created&order=desc&per_page=10&page=1&advanced_search=true`
    )
  })

  it('omits advanced_search on GHES hosts', () => {
    expect(
      buildIssueSearchIssuesApiPath({
        query: 'repo:acme/widgets is:issue is:open',
        perPage: 1,
        host: 'ghe.example.com'
      })
    ).toBe(`search/issues?q=${encodeURIComponent('repo:acme/widgets is:issue is:open')}&per_page=1`)
  })
})

describe('buildSearchQueryString', () => {
  it('emits is:blocked and -is:blocked from the parsed blocked flag', () => {
    const ownerRepo = { owner: 'acme', repo: 'widgets' }
    expect(buildSearchQueryString(ownerRepo, parseTaskQuery('is:issue is:open is:blocked'))).toBe(
      'repo:acme/widgets is:issue is:open is:blocked'
    )
    expect(buildSearchQueryString(ownerRepo, parseTaskQuery('is:issue is:open -is:blocked'))).toBe(
      'repo:acme/widgets is:issue is:open -is:blocked'
    )
    expect(buildSearchQueryString(ownerRepo, defaultOpenWorkItemQuery())).toBe(
      'repo:acme/widgets is:open'
    )
  })
})
