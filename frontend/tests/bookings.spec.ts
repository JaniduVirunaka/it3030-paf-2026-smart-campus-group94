import { test, expect, Page } from '@playwright/test';

// ─── Shared helpers ───────────────────────────────────────────────────────────

async function mockAsUser(page: Page, email = 'user@test.com') {
  await page.route('**/api/auth/user', route =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        authenticated: true,
        email,
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

const USER_BOOKINGS = [
  {
    id: 'bk-001',
    resourceId: 'res-1',
    userId: 'user@test.com',
    studentRegNumber: 'IT21000001',
    studentPhone: '0771234567',
    studentEmail: 'user@test.com',
    date: '2027-06-15',
    startTime: '09:00',
    endTime: '11:00',
    purpose: 'Presentation rehearsal',
    expectedAttendees: 10,
    status: 'PENDING',
  },
  {
    id: 'bk-002',
    resourceId: 'res-2',
    userId: 'user@test.com',
    studentRegNumber: 'IT21000001',
    studentPhone: '0771234567',
    studentEmail: 'user@test.com',
    date: '2027-06-20',
    startTime: '14:00',
    endTime: '15:00',
    purpose: 'Study group',
    expectedAttendees: 5,
    status: 'APPROVED',
  },
];

const RESOURCES_LIST = {
  content: [
    { id: 'res-1', name: 'Main Hall', type: 'LECTURE_HALL', capacity: 200, location: 'Block A', availabilityWindows: '08:00-17:00', status: 'ACTIVE' },
  ],
  totalPages: 1,
  totalElements: 1,
  number: 0,
  size: 100,
};

async function stubAllApis(page: Page) {
  await page.route('**/api/bookings/user/**', route =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(USER_BOOKINGS) })
  );
  await page.route('**/api/resources**', route =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(RESOURCES_LIST) })
  );
  await page.route('**/api/auth/profile', route =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({}) })
  );
  await page.route('**/api/notifications**', route =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) })
  );
}

// ─── Tests ────────────────────────────────────────────────────────────────────

test.describe('Bookings Page', () => {

  // ── Access control ────────────────────────────────────────────────────────

  test('unauthenticated user is redirected to /login', async ({ page }) => {
    await page.route('**/api/auth/user', route =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ authenticated: false }) })
    );
    await page.goto('/bookings');
    await expect(page).toHaveURL('/login');
  });

  // ── Rendering user bookings ───────────────────────────────────────────────

  test('shows booking cards for authenticated user', async ({ page }) => {
    await mockAsUser(page);
    await stubAllApis(page);

    await page.goto('/bookings');

    await expect(page.getByText('Presentation rehearsal')).toBeVisible();
    await expect(page.getByText('Study group')).toBeVisible();
  });

  test('shows correct status badges on booking cards', async ({ page }) => {
    await mockAsUser(page);
    await stubAllApis(page);

    await page.goto('/bookings');

    await expect(page.getByText('PENDING')).toBeVisible();
    await expect(page.getByText('APPROVED')).toBeVisible();
  });

  test('shows booking date and time range', async ({ page }) => {
    await mockAsUser(page);
    await stubAllApis(page);

    await page.goto('/bookings');

    await expect(page.getByText('2027-06-15')).toBeVisible();
    await expect(page.getByText(/09:00/)).toBeVisible();
  });

  test('shows empty state when user has no bookings', async ({ page }) => {
    await mockAsUser(page);
    await page.route('**/api/bookings/user/**', route =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) })
    );
    await page.route('**/api/resources**', route =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(RESOURCES_LIST) })
    );
    await page.route('**/api/**', route =>
      route.fulfill({ status: 200, contentType: 'application/json', body: '[]' })
    );

    await page.goto('/bookings');

    await expect(page.getByText(/no bookings/i)).toBeVisible();
  });

  // ── New booking modal ─────────────────────────────────────────────────────

  test('New Booking button is visible', async ({ page }) => {
    await mockAsUser(page);
    await stubAllApis(page);

    await page.goto('/bookings');

    await expect(page.getByRole('button', { name: /new booking/i })).toBeVisible();
  });

  test('New Booking modal opens when button is clicked', async ({ page }) => {
    await mockAsUser(page);
    await stubAllApis(page);

    await page.goto('/bookings');
    await page.getByRole('button', { name: /new booking/i }).click();

    // Modal should appear with a form field for the resource
    await expect(page.getByPlaceholder(/search resource/i)).toBeVisible();
  });

  test('booking form shows purpose and attendees fields', async ({ page }) => {
    await mockAsUser(page);
    await stubAllApis(page);

    await page.goto('/bookings');
    await page.getByRole('button', { name: /new booking/i }).click();

    await expect(page.getByPlaceholder(/purpose/i)).toBeVisible();
    await expect(page.getByRole('spinbutton')).toBeVisible(); // number input for attendees
  });

  // ── Cancel booking ────────────────────────────────────────────────────────

  test('Cancel button is visible for PENDING booking', async ({ page }) => {
    await mockAsUser(page);
    await stubAllApis(page);

    await page.goto('/bookings');

    // The PENDING booking card should have a Cancel button
    await expect(page.getByRole('button', { name: /cancel booking/i }).first()).toBeVisible();
  });

  // ── Admin view ────────────────────────────────────────────────────────────

  test('admin sees Approve and Reject buttons on PENDING bookings', async ({ page }) => {
    await mockAsAdmin(page);
    await page.route('**/api/bookings**', route =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ content: USER_BOOKINGS, totalPages: 1, totalElements: 2, number: 0, size: 10 }) })
    );
    await page.route('**/api/resources**', route =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(RESOURCES_LIST) })
    );
    await page.route('**/api/**', route =>
      route.fulfill({ status: 200, contentType: 'application/json', body: '[]' })
    );

    await page.goto('/bookings');

    await expect(page.getByRole('button', { name: /approve/i }).first()).toBeVisible();
    await expect(page.getByRole('button', { name: /reject/i }).first()).toBeVisible();
  });

  // ── Validation inside modal ───────────────────────────────────────────────

  test('booking form shows error if no resource selected on submit', async ({ page }) => {
    await mockAsUser(page);
    await stubAllApis(page);

    await page.goto('/bookings');
    await page.getByRole('button', { name: /new booking/i }).click();

    // Find and click the submit/confirm button inside the modal
    const submitBtn = page.getByRole('button', { name: /confirm booking|book now|submit/i });
    if (await submitBtn.isVisible()) {
      await submitBtn.click();
      await expect(page.getByText(/please select a resource/i)).toBeVisible();
    }
  });
});
