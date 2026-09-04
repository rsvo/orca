import { describe, expect, it } from 'vitest'
import { parseTaskQuery } from '../../../../shared/task-query'
import { buildWorkItemListRequest } from './work-item-list-request'
import {
  buildIssueSearchIssuesApiPath,
  buildSearchQueryString,
  defaultOpenWorkItemQuery,
  shouldEmitBlockedSearchQualifier
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

describe('shouldEmitBlockedSearchQualifier', () => {
  it('emits only for github.com issue searches with a blocked flag', () => {
    expect(
      shouldEmitBlockedSearchQualifier({ host: undefined, forIssues: true, blocked: true })
    ).toBe(true)
    expect(
      shouldEmitBlockedSearchQualifier({
        host: 'ghe.example.com',
        forIssues: true,
        blocked: true
      })
    ).toBe(false)
    expect(
      shouldEmitBlockedSearchQualifier({ host: undefined, forIssues: false, blocked: true })
    ).toBe(false)
    expect(
      shouldEmitBlockedSearchQualifier({ host: undefined, forIssues: true, blocked: null })
    ).toBe(false)
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

  it('omits blocked qualifiers for PR scope and GHES hosts', () => {
    const ownerRepo = { owner: 'acme', repo: 'widgets' }
    expect(buildSearchQueryString(ownerRepo, parseTaskQuery('is:pr is:open is:blocked'))).toBe(
      'repo:acme/widgets is:pull-request is:open'
    )
    expect(
      buildSearchQueryString(
        { ...ownerRepo, host: 'ghe.example.com' },
        parseTaskQuery('is:issue is:open is:blocked')
      )
    ).toBe('repo:acme/widgets is:issue is:open')
  })
})

describe('buildWorkItemListRequest blocked qualifiers', () => {
  const ownerRepo = { owner: 'acme', repo: 'widgets' }
  const blockedQuery = parseTaskQuery('is:open is:blocked')

  it('emits is:blocked for github.com issue list requests only', () => {
    const issueRequest = buildWorkItemListRequest({
      kind: 'issue',
      ownerRepo,
      limit: 10,
      query: blockedQuery,
      page: 1
    })
    expect(issueRequest.args.join(' ')).toContain(
      encodeURIComponent('repo:acme/widgets is:issue is:open is:blocked')
    )

    const prRequest = buildWorkItemListRequest({
      kind: 'pr',
      ownerRepo,
      limit: 10,
      query: blockedQuery,
      page: 1
    })
    expect(prRequest.args.join(' ')).not.toContain('is:blocked')

    const ghesRequest = buildWorkItemListRequest({
      kind: 'issue',
      ownerRepo: { ...ownerRepo, host: 'ghe.example.com' },
      limit: 10,
      query: blockedQuery,
      page: 1
    })
    expect(ghesRequest.args.join(' ')).not.toContain('is:blocked')
  })
})
