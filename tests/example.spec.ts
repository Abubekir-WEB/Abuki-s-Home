import { test, expect } from '@playwright/test';

test('Login rejects incorrect credentials', async ({ page }) => {

  await page.goto('http://127.0.0.1:5173');

  // Remove any previously saved token
  await page.evaluate(() => {
    localStorage.removeItem('token');
  });

  // Enter incorrect credentials
  await page.getByRole('textbox', {
    name: 'Enter your email'
  }).fill('wrong@example.com');

  await page.getByRole('textbox', {
    name: 'Enter your password'
  }).fill('WrongPassword123');

  // Wait for the backend login response
  const responsePromise = page.waitForResponse(response =>
    response.url().includes('/user/login') &&
    response.request().method() === 'POST'
  );

  // Submit login
  await page.getByRole('button', { name: 'Login' }).click();

  const response = await responsePromise;

  // Backend must reject the credentials
  expect(response.ok()).toBeFalsy();

  // No authentication token should be saved
  const token = await page.evaluate(() =>
    localStorage.getItem('token')
  );

  expect(token).toBeNull();

  // User should remain on login page
  await expect(page).toHaveURL('http://127.0.0.1:5173/');
});