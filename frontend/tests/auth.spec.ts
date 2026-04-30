import { test, expect } from '@playwright/test';

test.describe('Login & Registration', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
  });

  // ─── Page structure ───────────────────────────────────────────────────────

  test('renders all login form elements', async ({ page }) => {
    await expect(page.locator('h2')).toContainText('Smart Campus Hub');
    await expect(page.getByPlaceholder('Email Address')).toBeVisible();
    await expect(page.getByPlaceholder('Password')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Login' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Register' })).toBeVisible();
    await expect(page.getByRole('button', { name: /continue with google/i })).toBeVisible();
  });

  test('registration-only fields are hidden by default', async ({ page }) => {
    await expect(page.getByPlaceholder('Registration No. (optional)')).not.toBeVisible();
    await expect(page.getByPlaceholder('Phone Number (optional)')).not.toBeVisible();
  });

  // ─── Client-side validation ───────────────────────────────────────────────

  test('shows error when Login is clicked with empty fields', async ({ page }) => {
    await page.getByRole('button', { name: 'Login' }).click();
    await expect(page.getByText('Please enter both email and password.')).toBeVisible();
  });

  test('shows error when Register is clicked with empty email', async ({ page }) => {
    await page.route('**/api/auth/register', route => route.abort());
    await page.getByRole('button', { name: 'Register' }).click();
    await expect(page.getByText('Please enter both email and password.')).toBeVisible();
  });

  test('shows optional registration fields after clicking Register', async ({ page }) => {
    // Register button sets isRegistering=true even if email is empty (validation fires after)
    await page.route('**/api/auth/register', route => route.abort());
    await page.getByRole('button', { name: 'Register' }).click();
    await expect(page.getByPlaceholder('Registration No. (optional)')).toBeVisible();
    await expect(page.getByPlaceholder('Phone Number (optional)')).toBeVisible();
  });

  // ─── API-driven login ─────────────────────────────────────────────────────

  test('shows error message on invalid credentials', async ({ page }) => {
    await page.route('**/api/auth/login', route =>
      route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({ success: false, message: 'Invalid email or password' }),
      })
    );

    await page.getByPlaceholder('Email Address').fill('wrong@test.com');
    await page.getByPlaceholder('Password').fill('badpassword');
    await page.getByRole('button', { name: 'Login' }).click();

    await expect(page.getByText('Invalid email or password')).toBeVisible();
  });

  test('redirects to /dashboard on successful login', async ({ page }) => {
    await page.route('**/api/auth/login', route =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, message: 'Login successful' }),
      })
    );
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
    // Stub the dashboard page resources to prevent further API noise
    await page.route('**/api/**', route => route.fulfill({ status: 200, body: '{}' }));

    await page.getByPlaceholder('Email Address').fill('user@test.com');
    await page.getByPlaceholder('Password').fill('password123');
    await page.getByRole('button', { name: 'Login' }).click();

    await expect(page).toHaveURL('/dashboard');
  });

  // ─── API-driven registration ──────────────────────────────────────────────

  test('shows success message after successful registration', async ({ page }) => {
    await page.route('**/api/auth/register', route =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, message: 'User registered successfully!' }),
      })
    );

    await page.getByPlaceholder('Email Address').fill('newuser@test.com');
    await page.getByPlaceholder('Password').fill('securepass1');
    await page.getByRole('button', { name: 'Register' }).click();

    await expect(page.getByText('Registration successful!')).toBeVisible();
  });

  test('shows error when email is already in use', async ({ page }) => {
    await page.route('**/api/auth/register', route =>
      route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({ success: false, message: 'Email already in use!' }),
      })
    );

    await page.getByPlaceholder('Email Address').fill('existing@test.com');
    await page.getByPlaceholder('Password').fill('password123');
    await page.getByRole('button', { name: 'Register' }).click();

    await expect(page.getByText('Email already in use!')).toBeVisible();
  });

  // ─── Navigation ───────────────────────────────────────────────────────────

  test('Back to Home link is present', async ({ page }) => {
    await expect(page.getByRole('link', { name: /back to home/i })).toBeVisible();
  });

  test('loading indicator appears while login request is in-flight', async ({ page }) => {
    // Delay the response long enough to catch the loading state
    await page.route('**/api/auth/login', async route => {
      await new Promise(r => setTimeout(r, 800));
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: false, message: 'fail' }),
      });
    });

    await page.getByPlaceholder('Email Address').fill('user@test.com');
    await page.getByPlaceholder('Password').fill('pass');
    await page.getByRole('button', { name: 'Login' }).click();

    // Button should show loading text "..." while waiting
    await expect(page.getByRole('button', { name: '...' })).toBeVisible();
  });
});
