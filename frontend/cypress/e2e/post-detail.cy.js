describe('Post Detail Page', () => {

  const MOCK_POST = {
    _id: 'abc123',
    type: 'lost', status: 'open',
    title: 'Black Sony earphones',
    description: 'Lost near library reading section with scratch on left cup',
    category: 'Electronics', zone: 'Library',
    incidentDate: '2026-03-25T00:00:00Z',
    imageUrls: [], matchCount: 0,
    authorId: '6601abc123def456789abcde',  // matches mock student _id
    createdAt: '2026-03-25T14:00:00Z'
  }

  beforeEach(() => {
    cy.intercept('GET', '/api/posts/abc123', {
      statusCode: 200, body: MOCK_POST
    }).as('getPost')
    cy.intercept('GET', '/api/posts/abc123/matches', {
      statusCode: 200, body: { matches: [], count: 0 }
    }).as('getMatches')
    cy.visit('/posts/abc123')
    cy.wait('@getPost')
  })

  it('displays post details correctly', () => {
    cy.get('[data-testid="post-title"]').should('contain', 'Black Sony earphones')
    cy.get('[data-testid="post-status"]').should('contain', 'Open')
    cy.contains('Electronics').should('be.visible')
    cy.contains('Library').should('be.visible')
  })

  it('shows edit and delete buttons for post owner', () => {
    cy.get('[data-testid="edit-button"]').should('be.visible')
    cy.get('[data-testid="delete-button"]').should('be.visible')
  })

  it('shows match suggestions panel for post owner', () => {
    cy.get('[data-testid="match-panel"]').should('exist')
  })

  it('delete confirmation modal appears and cancels', () => {
    cy.get('[data-testid="delete-button"]').click()
    cy.contains('Are you sure').should('be.visible')
    cy.contains('Cancel').click()
    cy.contains('Are you sure').should('not.exist')
  })

  it('confirms delete and redirects to browse', () => {
    cy.intercept('DELETE', '/api/posts/abc123', {
      statusCode: 200, body: { message: 'Post removed successfully' }
    }).as('deletePost')
    cy.get('[data-testid="delete-button"]').click()
    cy.get('[data-testid="delete-confirm"]').click()
    cy.wait('@deletePost')
    cy.url().should('eq', Cypress.config().baseUrl + '/posts')
  })
})
