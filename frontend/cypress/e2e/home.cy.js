describe('Homepage', () => {
  it('loads the app', () => {
    cy.visit('/');
    cy.contains('CampusLostFound'); // A loose guess of what might be on your page
  });
});
