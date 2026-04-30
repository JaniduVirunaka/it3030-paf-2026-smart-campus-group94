import { test, expect, Page } from '@playwright/test';

// ─── Shared mock helpers ──────────────────────────────────────────────────────

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

const RESOURCES_PAGE = {
  content: [
    { id: 'res-1', name: 'Main Auditorium', type: 'LECTURE_HALL', capacity: 200, location: 'Block A', availabilityWindows: '08:00-17:00', status: 'ACTIVE' },
    { id: 'res-2', name: 'Physics Lab', type: 'LAB', capacity: 30, location: 'Block B', availabilityWindows: '09:00-16:00', status: 'ACTIVE' },
    { id: 'res-3', name: 'Epson Projector', type: 'EQUIPMENT', capacity: 0, location: 'IT Office', availabilityWindows: '08:00-17:00', status: 'OUT_OF_SERVICE' },
  ],
  totalPages: 1,
  totalElements: 3,
  number: 0,
  size: 10,
};

const EMPTY_PAGE = { content: [], totalPages: 0, totalElements: 0, number: 0, size: 10 };

async function mockResources(page: Page, data = RESOURCES_PAGE) {
  await page.route('**/api/resources**', route =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(data) })
  );
}

async function mockStats(page: Page) {
  await page.route('**/api/resources/stats**', route =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ total: 3, active: 2, outOfService: 1 }),
    })
  );
}

// ─── Tests ────────────────────────────────────────────────────────────────────

test.describe('Resources / Facilities Page', () => {

  // ── Access control ────────────────────────────────────────────────────────

  test('unauthenticated user is redirected to /login', async ({ page }) => {
    await page.route('**/api/auth/user', route =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ authenticated: false }) })
    );
    await page.goto('/facilities');
    await expect(page).toHaveURL('/login');
  });

  // ── Rendering ─────────────────────────────────────────────────────────────

  test('shows all resource cards for authenticated user', async ({ page }) => {
    await mockAsUser(page);
    await mockResources(page);

    await page.goto('/facilities');

    await expect(page.getByText('Main Auditorium')).toBeVisible();
    await expect(page.getByText('Physics Lab')).toBeVisible();
    await expect(page.getByText('Epson Projector')).toBeVisible();
  });

  test('shows resource type and location details', async ({ page }) => {
    await mockAsUser(page);
    await mockResources(page);

    await page.goto('/facilities');

    await expect(page.getByText('LECTURE_HALL')).toBeVisible();
    await expect(page.getByText('Block A')).toBeVisible();
  });

  test('shows empty state message when no resources returned', async ({ page }) => {
    await mockAsUser(page);
    await mockResources(page, EMPTY_PAGE);

    await page.goto('/facilities');

    await expect(page.getByText(/no resources found/i)).toBeVisible();
  });

  // ── Search & filter controls ──────────────────────────────────────────────

  test('search input is visible', async ({ page }) => {
    await mockAsUser(page);
    await mockResources(page);

    await page.goto('/facilities');

    await expect(page.getByPlaceholder(/search/i)).toBeVisible();
  });

  test('type filter dropdown is visible', async ({ page }) => {
    await mockAsUser(page);
    await mockResources(page);

    await page.goto('/facilities');

    await expect(page.locator('select').first()).toBeVisible();
  });

  test('typing in search triggers a filtered resource request', async ({ page }) => {
    await mockAsUser(page);

    let requestUrl = '';
    await page.route('**/api/resources**', route => {
      requestUrl = route.request().url();
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(EMPTY_PAGE) });
    });

    await page.goto('/facilities');
    await page.getByPlaceholder(/search/i).fill('auditorium');

    // debounce is 500 ms — wait for the debounced request
    await page.waitForTimeout(600);
    expect(requestUrl).toContain('searchTerm=auditorium');
  });

  // ── Admin-only features ───────────────────────────────────────────────────

  test('admin sees Add Resource button', async ({ page }) => {
    await mockAsAdmin(page);
    await mockResources(page);
    await mockStats(page);

    await page.goto('/facilities');

    await expect(page.getByRole('button', { name: /add resource/i })).toBeVisible();
  });

  test('regular user does NOT see Add Resource button', async ({ page }) => {
    await mockAsUser(page);
    await mockResources(page);

    await page.goto('/facilities');

    await expect(page.getByRole('button', { name: /add resource/i })).not.toBeVisible();
  });

  test('admin sees resource statistics panel', async ({ page }) => {
    await mockAsAdmin(page);
    await mockResources(page);
    await mockStats(page);

    await page.goto('/facilities');

    // Stats panel should show totals
    await expect(page.getByText(/total/i).first()).toBeVisible();
  });

  // ── Book button ───────────────────────────────────────────────────────────

  test('Book button is visible on each resource card for regular users', async ({ page }) => {
    await mockAsUser(page);
    await mockResources(page);

    await page.goto('/facilities');

    // At least one Book button should appear
    await expect(page.getByRole('button', { name: /book/i }).first()).toBeVisible();
  });
});
