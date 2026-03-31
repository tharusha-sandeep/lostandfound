describe('My Posts Page', () => {

  beforeEach(() => {
    cy.intercept('GET', '/api/posts/mine', {
      statusCode: 200,
      body: {
        posts: [
          { _id: '111', type: 'lost', status: 'open', title: 'My lost keys',
            category: 'Keys', zone: 'Library',
            incidentDate: '2026-03-25', imageUrls: [], matchCount: 0,
            isDeleted: false, authorId: '6601abc123def456789abcde' },
          { _id: '222', type: 'found', status: 'resolved', title: 'Found wallet',
            category: 'Other', zone: 'Canteen',
            incidentDate: '2026-03-20', imageUrls: [], matchCount: 0,
            isDeleted: false, authorId: '6601abc123def456789abcde' }
        ],
        total: 2
      }
    }).as('getMyPosts')
    cy.visit('/my-posts')
    cy.wait('@getMyPosts')
  })

  it('shows active posts in Active tab', () => {
    cy.get('[data-testid="tab-active"]').click()
    cy.contains('My lost keys').should('be.visible')
  })

  it('shows resolved posts in Resolved tab', () => {
    cy.get('[data-testid="tab-resolved"]').click()
    cy.contains('Found wallet').should('be.visible')
  })

  it('Report New Item button navigates to create page', () => {
    cy.contains('Report New Item').click()
    cy.url().should('include', '/posts/new')
  })
})
