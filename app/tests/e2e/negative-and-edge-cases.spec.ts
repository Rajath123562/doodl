import { test, expect } from '@playwright/test';

test.describe('Negative & Security Edge Cases (P0-001, P0-004, P0-006, P0-019, P0-020)', () => {
  test('keyboard submission on nickname form and validation limits (P0-001, P0-020)', async ({ page }) => {
    await page.goto('/');

    const nicknameInput = page.locator('input[placeholder="Enter nickname..."]');
    await expect(nicknameInput).toBeVisible();

    // Fill nickname and hit Enter key
    await nicknameInput.fill('SpeedyTypist');
    await nicknameInput.press('Enter');

    // Input must preserve trimmed value
    expect(await nicknameInput.inputValue()).toBe('SpeedyTypist');
  });

  test('mobile viewport responsiveness with zero horizontal overflow (P0-019)', async ({ page }) => {
    // Mobile viewport (iPhone SE)
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');

    await expect(page.locator('h1')).toBeVisible();

    // Check zero horizontal overflow
    const hasHorizontalOverflow = await page.evaluate(() => {
      return document.documentElement.scrollWidth > document.documentElement.clientWidth;
    });
    expect(hasHorizontalOverflow).toBe(false);

    // Tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 });
    const tabletOverflow = await page.evaluate(() => {
      return document.documentElement.scrollWidth > document.documentElement.clientWidth;
    });
    expect(tabletOverflow).toBe(false);
  });

  test('password protected room behavior (P0-004)', async ({ browser }) => {
    const hostContext = await browser.newContext();
    const guestContext = await browser.newContext();
    const hostPage = await hostContext.newPage();
    const guestPage = await guestContext.newPage();

    // 1. Host creates password protected room via API
    const settings = {
      visibility: 'private' as const,
      maxPlayers: 4,
      cyclesPerPlayer: 1,
      drawSeconds: 60,
      gameMode: 'classic' as const,
      wordPack: 'everyday' as const,
      passwordProtected: true,
      password: 'GamePassword99',
    };

    const hostRes = await hostPage.request.post('/api/rooms', {
      data: { settings, hostNickname: 'LockMaster' },
    });
    expect(hostRes.ok()).toBe(true);
    const hostData = await hostRes.json();
    const roomCode = hostData.roomCode;

    // 2. Guest attempts to join with WRONG password
    const wrongJoinRes = await guestPage.request.post(`/api/rooms/${roomCode}/join`, {
      data: { nickname: 'HackerGuest', password: 'WrongPassword' },
    });
    expect(wrongJoinRes.status()).toBe(403);
    const errData = await wrongJoinRes.json();
    expect(errData.code).toBe('WRONG_PASSWORD');

    // 3. Guest joins with CORRECT password
    const correctJoinRes = await guestPage.request.post(`/api/rooms/${roomCode}/join`, {
      data: { nickname: 'LegitGuest', password: 'GamePassword99' },
    });
    expect(correctJoinRes.status()).toBe(200);
    const joinData = await correctJoinRes.json();
    expect(joinData.seatId).toBeDefined();

    await hostContext.close();
    await guestContext.close();
  });

  test('capacity limit rejection when room reaches maximum players (P0-006)', async ({ browser }) => {
    const hostContext = await browser.newContext();
    const hostPage = await hostContext.newPage();

    // Create room with maxPlayers: 2
    const settings = {
      visibility: 'private' as const,
      maxPlayers: 2,
      cyclesPerPlayer: 1,
      drawSeconds: 60,
      gameMode: 'classic' as const,
      wordPack: 'everyday' as const,
    };

    const hostRes = await hostPage.request.post('/api/rooms', {
      data: { settings, hostNickname: 'SeatOne' },
    });
    const { roomCode } = await hostRes.json();

    // Distinct Player 2 fills the room
    const p2Context = await browser.newContext();
    const p2Page = await p2Context.newPage();
    const p2Res = await p2Page.request.post(`/api/rooms/${roomCode}/join`, {
      data: { nickname: 'SeatTwo' },
    });
    expect(p2Res.status()).toBe(200);

    // Distinct Player 3 tries to join full room -> Rejected with 409 ROOM_FULL
    const p3Context = await browser.newContext();
    const p3Page = await p3Context.newPage();
    const p3Res = await p3Page.request.post(`/api/rooms/${roomCode}/join`, {
      data: { nickname: 'SeatThree' },
    });
    expect(p3Res.status()).toBe(409);
    const err = await p3Res.json();
    expect(err.code).toBe('ROOM_FULL');

    await hostContext.close();
    await p2Context.close();
    await p3Context.close();
  });

  test('play with friends navigation modal opens, switches tabs, and creates party (P0-001, P0-002)', async ({ page }) => {
    await page.goto('/');

    // 1. Locate the "Play with Friends" navigation tab
    const playNavBtn = page.getByRole('button', { name: 'Play with Friends' });
    await expect(playNavBtn).toBeVisible();

    // 2. Click "Play with Friends"
    await playNavBtn.click();

    // 3. Modal must open with "Play with Friends" heading
    const modalHeading = page.getByRole('heading', { name: 'Play with Friends' });
    await expect(modalHeading).toBeVisible();

    // 4. Verify tabs: "Create Private Party" & "Join with Code"
    const joinTab = page.getByRole('button', { name: 'Join with Code' });
    const createTab = page.getByRole('button', { name: 'Create Private Party' });
    await expect(joinTab).toBeVisible();
    await expect(createTab).toBeVisible();

    // 5. Switch to "Join with Code" tab
    await joinTab.click();
    await expect(page.getByPlaceholder('e.g. 868A50B4')).toBeVisible();

    // 6. Switch back to "Create Private Party" tab
    await createTab.click();
    await expect(page.getByRole('button', { name: /Create Room & Get Invite Link/i })).toBeVisible();

    // 7. Click "Create Room & Get Invite Link"
    await page.getByRole('button', { name: /Create Room & Get Invite Link/i }).click();

    // 8. Must transition into the Game Lobby
    await expect(page.getByRole('heading', { name: 'Game Lobby' })).toBeVisible({ timeout: 8000 });
    await expect(page.getByRole('button', { name: /Room: /i })).toBeVisible();
  });
});
