describe('Post Create Page', () => {

  beforeEach(() => {
    cy.visit('/posts/new')
  })

  it('shows validation errors on empty submit', () => {
    cy.get('[data-testid="submit-button"]').click()
    cy.contains('Please select Lost or Found').should('be.visible')
    cy.contains('Title must be at least 5 characters').should('be.visible')
    cy.contains('Please select a category').should('be.visible')
    cy.contains('Please select a campus zone').should('be.visible')
    cy.contains('Description must be at least 20 characters').should('be.visible')
  })

  it('rejects title shorter than 5 characters', () => {
    cy.get('[data-testid="title-input"]').type('Hi')
    cy.get('[data-testid="submit-button"]').click()
    cy.contains('Title must be at least 5 characters').should('be.visible')
  })

  it('rejects future incident date', () => {
    cy.get('[data-testid="date-input"]').type('2030-01-01')
    cy.get('[data-testid="submit-button"]').click()
    cy.contains('Incident date cannot be in the future').should('be.visible')
  })

  it('creates a post successfully and redirects', () => {
    cy.intercept('POST', '/api/posts', {
      statusCode: 201,
      body: { post: { _id: 'new123', status: 'open' }, matchCount: 0 }
    }).as('createPost')

    cy.get('[data-testid="type-lost"]').click({ force: true })
    cy.get('[data-testid="title-input"]').type('Lost black earphones')
    cy.get('[data-testid="category-select"]').select('Electronics')
    cy.get('[data-testid="zone-select"]').select('Library')
    cy.get('[data-testid="date-input"]').type('2026-03-25')
    cy.get('[data-testid="description-input"]')
      .type('Lost my black Sony earphones near the reading section')
    cy.get('[data-testid="submit-button"]').click()

    cy.wait('@createPost')
    cy.url().should('include', '/posts/new123')
  })
})
