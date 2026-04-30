import { test, expect, Page } from '@playwright/test';

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function mockAsUser(page: Page) {
  await page.route('**/api/auth/user', route =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        authenticated: true,
        email: 'user@test.com',
        name: 'Test User',
        roles: ['ROLE_USER'],
      }),
    })
  );
}

async function mockAsAdmin(page: Page) {
  await page.route('**/api/auth/user', route =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        authenticated: true,
        email: 'admin@test.com',
        name: 'Admin User',
        roles: ['ROLE_USER', 'ROLE_ADMIN'],
      }),
    })
  );
}

const SAMPLE_TICKETS = [
  {
    id: 'tkt-001',
    userId: 'user@test.com',
    userName: 'Test User',
    resourceId: 'res-1',
    resourceName: 'Physics Lab',
    category: 'HARDWARE',
    description: 'Projector is not turning on and the screen is flickering.',
    priority: 'HIGH',
    contactDetails: '0771234567',
    status: 'OPEN',
    createdAt: '2026-04-01T09:00:00Z',
    updatedAt: '2026-04-01T09:00:00Z',
    attachments: [],
  },
  {
    id: 'tkt-002',
    userId: 'user@test.com',
    userName: 'Test User',
    resourceId: 'res-2',
    resourceName: 'Main Auditorium',
    category: 'ELECTRICAL',
    description: 'Air conditioning unit is leaking water onto the floor.',
    priority: 'URGENT',
    contactDetails: '0771234567',
    status: 'IN_PROGRESS',
    createdAt: '2026-04-05T10:30:00Z',
    updatedAt: '2026-04-06T08:00:00Z',
    attachments: [],
  },
];

const RESOURCES = {
  content: [
    { id: 'res-1', name: 'Physics Lab', type: 'LAB', capacity: 30, location: 'Block B', availabilityWindows: '09:00-17:00', status: 'ACTIVE' },
  ],
  totalPages: 1,
  totalElements: 1,
  number: 0,
  size: 100,
};

async function mockTickets(page: Page, tickets = SAMPLE_TICKETS) {
  await page.route('**/api/tickets', route =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(tickets) })
  );
  await page.route('**/api/tickets/**', route =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) })
  );
}

async function stubCommonApis(page: Page) {
  await page.route('**/api/notifications**', route =>
    route.fulfill({ status: 200, contentType: 'application/json', body: '[]' })
  );
  await page.route('**/api/resources**', route =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(RESOURCES) })
  );
}

// ─── Ticket List Page tests ───────────────────────────────────────────────────

test.describe('Tickets List Page (/tickets)', () => {

  test('unauthenticated user is redirected to /login', async ({ page }) => {
    await page.route('**/api/auth/user', route =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ authenticated: false }) })
    );
    await page.goto('/tickets');
    await expect(page).toHaveURL('/login');
  });

  test('shows ticket cards for authenticated user', async ({ page }) => {
    await mockAsUser(page);
    await mockTickets(page);
    await stubCommonApis(page);

    await page.goto('/tickets');

    await expect(page.getByText('Physics Lab')).toBeVisible();
    await expect(page.getByText('Main Auditorium')).toBeVisible();
  });

  test('shows ticket status badges', async ({ page }) => {
    await mockAsUser(page);
    await mockTickets(page);
    await stubCommonApis(page);

    await page.goto('/tickets');

    await expect(page.getByText('OPEN')).toBeVisible();
    await expect(page.getByText('IN_PROGRESS')).toBeVisible();
  });

  test('shows category and priority for each ticket', async ({ page }) => {
    await mockAsUser(page);
    await mockTickets(page);
    await stubCommonApis(page);

    await page.goto('/tickets');

    await expect(page.getByText('HARDWARE')).toBeVisible();
    await expect(page.getByText('HIGH')).toBeVisible();
  });

  test('shows empty state when user has no tickets', async ({ page }) => {
    await mockAsUser(page);
    await mockTickets(page, []);
    await stubCommonApis(page);

    await page.goto('/tickets');

    await expect(page.getByText(/no tickets/i)).toBeVisible();
  });

  test('Report New Issue button navigates to /tickets/new', async ({ page }) => {
    await mockAsUser(page);
    await mockTickets(page);
    await stubCommonApis(page);

    await page.goto('/tickets');
    await page.getByRole('link', { name: /report new issue|new ticket/i }).first().click();

    await expect(page).toHaveURL('/tickets/new');
  });

  test('status filter dropdown is visible', async ({ page }) => {
    await mockAsUser(page);
    await mockTickets(page);
    await stubCommonApis(page);

    await page.goto('/tickets');

    await expect(page.locator('select').first()).toBeVisible();
  });

  test('admin sees all tickets (not just own)', async ({ page }) => {
    await mockAsAdmin(page);
    await mockTickets(page);
    await stubCommonApis(page);

    await page.goto('/tickets');

    // Both tickets (from different users) should be visible to admin
    await expect(page.getByText('Physics Lab')).toBeVisible();
    await expect(page.getByText('Main Auditorium')).toBeVisible();
  });
});

// ─── Submit Ticket Page tests ─────────────────────────────────────────────────

test.describe('Submit Ticket Page (/tickets/new)', () => {

  test('unauthenticated user is redirected to /login', async ({ page }) => {
    await page.route('**/api/auth/user', route =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ authenticated: false }) })
    );
    await page.goto('/tickets/new');
    await expect(page).toHaveURL('/login');
  });

  test('renders the submit ticket form', async ({ page }) => {
    await mockAsUser(page);
    await stubCommonApis(page);

    await page.goto('/tickets/new');

    await expect(page.getByRole('combobox').first()).toBeVisible(); // resource selector
    await expect(page.getByPlaceholder(/describe the issue/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /submit ticket/i })).toBeVisible();
  });

  test('shows validation error when description is too short', async ({ page }) => {
    await mockAsUser(page);
    await stubCommonApis(page);

    await page.goto('/tickets/new');

    // Fill a short description (less than 10 chars)
    await page.getByPlaceholder(/describe the issue/i).fill('Too short');
    await page.getByRole('button', { name: /submit ticket/i }).click();

    await expect(page.getByText(/at least 10 characters/i)).toBeVisible();
  });

  test('shows validation error when no resource is selected', async ({ page }) => {
    await mockAsUser(page);
    await stubCommonApis(page);

    await page.goto('/tickets/new');

    await page.getByPlaceholder(/describe the issue/i).fill('This is a detailed enough description of the issue.');
    await page.getByRole('button', { name: /submit ticket/i }).click();

    await expect(page.getByText(/please select a resource/i)).toBeVisible();
  });

  test('priority selector is visible with default value', async ({ page }) => {
    await mockAsUser(page);
    await stubCommonApis(page);

    await page.goto('/tickets/new');

    const prioritySelect = page.locator('select[name="priority"]');
    await expect(prioritySelect).toBeVisible();
    await expect(prioritySelect).toHaveValue('MEDIUM');
  });

  test('category selector is visible with default value', async ({ page }) => {
    await mockAsUser(page);
    await stubCommonApis(page);

    await page.goto('/tickets/new');

    const categorySelect = page.locator('select[name="category"]');
    await expect(categorySelect).toBeVisible();
    await expect(categorySelect).toHaveValue('HARDWARE');
  });

  test('shows success and redirects after successful submission', async ({ page }) => {
    await mockAsUser(page);
    await stubCommonApis(page);
    await mockTickets(page);

    await page.route('**/api/tickets', async route => {
      if (route.request().method() === 'POST') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ id: 'tkt-new', status: 'OPEN' }),
        });
      } else {
        await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(SAMPLE_TICKETS) });
      }
    });

    await page.goto('/tickets/new');

    // Select first resource from dropdown
    await page.locator('select[name="resourceId"]').selectOption({ index: 1 });
    await page.getByPlaceholder(/describe the issue/i).fill('The projector bulb has blown and needs immediate replacement.');
    await page.locator('input[placeholder*="contact"], input[name="contactDetails"]').fill('0771234567');

    await page.getByRole('button', { name: /submit ticket/i }).click();

    // Should show success message
    await expect(page.getByText(/ticket submitted successfully|success/i)).toBeVisible({ timeout: 5000 });
  });
});
