describe('Post Browse Page', () => {

  beforeEach(() => {
    cy.intercept('GET', '/api/posts*', {
      statusCode: 200,
      body: {
        posts: [
          { _id: '111', type: 'lost', status: 'open', title: 'Black earphones',
            category: 'Electronics', zone: 'Library', 
            incidentDate: '2026-03-25', imageUrls: [], matchCount: 0 },
          { _id: '222', type: 'found', status: 'open', title: 'Found jacket',
            category: 'Clothing', zone: 'Canteen',
            incidentDate: '2026-03-26', imageUrls: [], matchCount: 0 }
        ],
        total: 2, page: 1, pages: 1
      }
    }).as('getPosts')
    cy.visit('/posts')
    cy.wait('@getPosts')
  })

  it('renders the post grid with items', () => {
    cy.get('[data-testid="post-grid"]').should('exist')
    cy.contains('Black earphones').should('be.visible')
    cy.contains('Found jacket').should('be.visible')
  })

  it('filters by Lost type updates URL', () => {
    cy.get('[data-testid="filter-type-lost"]').click()
    cy.url().should('include', 'type=lost')
  })

  it('keyword search debounces and updates URL', () => {
    cy.get('[data-testid="search-input"]').type('earphones')
    cy.url().should('include', 'q=earphones')
  })

  it('clear filters resets URL params', () => {
    cy.get('[data-testid="filter-type-lost"]').click()
    cy.get('[data-testid="clear-filters"]').click()
    cy.url().should('not.include', 'type=')
  })

  it('clicking a post card navigates to detail page', () => {
    cy.contains('Black earphones').click()
    cy.url().should('include', '/posts/111')
  })
})
