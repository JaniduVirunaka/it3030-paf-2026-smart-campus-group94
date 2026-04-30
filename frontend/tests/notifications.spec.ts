import { test, expect, Page } from '@playwright/test';

// ─── Helpers ──────────────────────────────────────────────────────────────────

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

const UNREAD_NOTIFICATIONS = [
  {
    id: 'notif-1',
    userId: 'user@test.com',
    type: 'BOOKING',
    message: 'Your booking for 2027-06-15 (09:00–11:00) has been approved.',
    read: false,
    createdAt: new Date(Date.now() - 5 * 60 * 1000).toISOString(), // 5 min ago
  },
  {
    id: 'notif-2',
    userId: 'user@test.com',
    type: 'TICKET_STATUS',
    message: 'Your ticket status for Physics Lab has been updated to IN_PROGRESS.',
    read: false,
    createdAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(), // 30 min ago
  },
];

const READ_NOTIFICATION = {
  ...UNREAD_NOTIFICATIONS[0],
  read: true,
};

async function gotoFacilitiesWithMockedApis(page: Page, notifications = UNREAD_NOTIFICATIONS) {
  await page.route('**/api/notifications**', route =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(notifications) })
  );
  await page.route('**/api/resources**', route =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ content: [], totalPages: 0, totalElements: 0, number: 0, size: 10 }),
    })
  );
  await page.goto('/facilities');
}

// ─── Tests ────────────────────────────────────────────────────────────────────

test.describe('Notification Bell', () => {

  // ── Bell visibility ───────────────────────────────────────────────────────

  test('notification bell is visible in the navbar when logged in', async ({ page }) => {
    await mockAsUser(page);
    await gotoFacilitiesWithMockedApis(page);

    await expect(page.getByRole('button', { name: 'Notifications' })).toBeVisible();
  });

  // ── Unread badge ──────────────────────────────────────────────────────────

  test('shows unread count badge when there are unread notifications', async ({ page }) => {
    await mockAsUser(page);
    await gotoFacilitiesWithMockedApis(page, UNREAD_NOTIFICATIONS);

    // Badge should display "2" (two unread notifications)
    const badge = page.locator('button[aria-label="Notifications"] span');
    await expect(badge).toBeVisible();
    await expect(badge).toHaveText('2');
  });

  test('does NOT show unread badge when all notifications are read', async ({ page }) => {
    await mockAsUser(page);
    const allRead = UNREAD_NOTIFICATIONS.map(n => ({ ...n, read: true }));
    await gotoFacilitiesWithMockedApis(page, allRead);

    const badge = page.locator('button[aria-label="Notifications"] span');
    await expect(badge).not.toBeVisible();
  });

  test('does NOT show badge when there are no notifications', async ({ page }) => {
    await mockAsUser(page);
    await gotoFacilitiesWithMockedApis(page, []);

    const badge = page.locator('button[aria-label="Notifications"] span');
    await expect(badge).not.toBeVisible();
  });

  // ── Dropdown open/close ───────────────────────────────────────────────────

  test('clicking bell opens the notification dropdown', async ({ page }) => {
    await mockAsUser(page);
    await gotoFacilitiesWithMockedApis(page);

    await page.getByRole('button', { name: 'Notifications' }).click();

    await expect(page.getByText('Notifications').nth(1)).toBeVisible(); // dropdown header
  });

  test('clicking bell again closes the dropdown', async ({ page }) => {
    await mockAsUser(page);
    await gotoFacilitiesWithMockedApis(page);

    const bell = page.getByRole('button', { name: 'Notifications' });
    await bell.click(); // open
    await bell.click(); // close

    // Dropdown header should no longer be in the DOM
    await expect(page.getByText(/notifications/i).nth(1)).not.toBeVisible();
  });

  // ── Dropdown content ──────────────────────────────────────────────────────

  test('shows notification messages in the dropdown', async ({ page }) => {
    await mockAsUser(page);
    await gotoFacilitiesWithMockedApis(page);

    await page.getByRole('button', { name: 'Notifications' }).click();

    await expect(page.getByText(/your booking for 2027-06-15/i)).toBeVisible();
    await expect(page.getByText(/physics lab has been updated/i)).toBeVisible();
  });

  test('shows unread count in dropdown header', async ({ page }) => {
    await mockAsUser(page);
    await gotoFacilitiesWithMockedApis(page);

    await page.getByRole('button', { name: 'Notifications' }).click();

    await expect(page.getByText(/2 unread/i)).toBeVisible();
  });

  test('shows empty state when no notifications exist', async ({ page }) => {
    await mockAsUser(page);
    await gotoFacilitiesWithMockedApis(page, []);

    await page.getByRole('button', { name: 'Notifications' }).click();

    await expect(page.getByText(/no notifications yet/i)).toBeVisible();
  });

  // ── Mark as read ──────────────────────────────────────────────────────────

  test('clicking a notification opens the detail modal', async ({ page }) => {
    await mockAsUser(page);
    await gotoFacilitiesWithMockedApis(page);

    await page.getByRole('button', { name: 'Notifications' }).click();

    // Click the first notification item in the list
    const firstNote = page.getByText(/your booking for 2027-06-15/i);
    await firstNote.click();

    // Modal should appear with BOOKING type badge
    await expect(page.getByText('BOOKING')).toBeVisible();
    await expect(page.getByRole('button', { name: /mark as read/i })).toBeVisible();
  });

  test('Mark as read button calls the API and updates notification state', async ({ page }) => {
    await mockAsUser(page);
    await gotoFacilitiesWithMockedApis(page);

    let markReadCalled = false;
    await page.route('**/api/notifications/notif-1/read', route => {
      markReadCalled = true;
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(READ_NOTIFICATION),
      });
    });

    await page.getByRole('button', { name: 'Notifications' }).click();
    await page.getByText(/your booking for 2027-06-15/i).click();
    await page.getByRole('button', { name: /mark as read/i }).click();

    expect(markReadCalled).toBe(true);
  });

  test('close button dismisses the notification detail modal', async ({ page }) => {
    await mockAsUser(page);
    await gotoFacilitiesWithMockedApis(page);

    await page.getByRole('button', { name: 'Notifications' }).click();
    await page.getByText(/your booking for 2027-06-15/i).click();

    // Close button in modal
    await page.getByRole('button', { name: 'Close' }).click();

    // BOOKING badge in modal should disappear
    await expect(page.locator('.fixed.inset-0')).not.toBeVisible();
  });
});
