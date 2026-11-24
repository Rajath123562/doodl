/**
 * DOODL Demo Video & Screenshot Recorder
 * Uses Playwright to record a live 2-player match and capture high-res assets.
 */

import { chromium } from '@playwright/test';
import * as path from 'path';
import * as fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const assetsDir = path.resolve(__dirname, '../../docs/assets');

if (!fs.existsSync(assetsDir)) {
  fs.mkdirSync(assetsDir, { recursive: true });
}

async function run() {
  console.log('🚀 Launching Chromium for DOODL Demo Recording...');
  const browser = await chromium.launch({ headless: true });

  // 1. Host Context with Video Recording Enabled
  const hostContext = await browser.newContext({
    viewport: { width: 1280, height: 720 },
    recordVideo: {
      dir: assetsDir,
      size: { width: 1280, height: 720 },
    },
  });

  const guestContext = await browser.newContext({
    viewport: { width: 1280, height: 720 },
  });

  const hostPage = await hostContext.newPage();
  const guestPage = await guestContext.newPage();

  console.log('🌐 Host navigating to http://127.0.0.1:8787...');
  await hostPage.goto('http://127.0.0.1:8787');
  await hostPage.waitForTimeout(1000);

  // Set nickname
  const nickInput = hostPage.locator('input[placeholder="Enter nickname..."]');
  if (await nickInput.isVisible()) {
    await nickInput.fill('Picasso');
  }

  // Click Play with Friends
  console.log('🎮 Opening Play with Friends Modal...');
  await hostPage.getByRole('button', { name: /Play with Friends/i }).click();
  await hostPage.waitForTimeout(1000);

  // Screenshot 1: Play with Friends Modal
  await hostPage.screenshot({ path: path.join(assetsDir, 'doodl-party-launcher.png') });

  // Create room
  console.log('✨ Creating room...');
  await hostPage.getByRole('button', { name: /Create Room & Get Invite Link/i }).click();
  await hostPage.waitForSelector('text=Game Lobby', { timeout: 10000 });
  await hostPage.waitForTimeout(1000);

  // Capture Lobby
  await hostPage.screenshot({ path: path.join(assetsDir, 'doodl-lobby.png') });

  // Get Room Code from Navbar or URL
  const roomBtn = hostPage.locator('button:has-text("Room:")');
  const roomText = await roomBtn.innerText();
  const roomCode = roomText.replace('Room:', '').trim();
  console.log(`🔑 Room Code: ${roomCode}`);

  // Guest joins
  console.log('👥 Guest joining room...');
  await guestPage.goto(`http://127.0.0.1:8787/?join=${roomCode}`);
  await guestPage.waitForTimeout(1000);

  // Guest clicks Join Game Room
  const joinBtn = guestPage.getByRole('button', { name: /Join Game Room/i });
  if (await joinBtn.isVisible()) {
    await joinBtn.click();
  }
  await guestPage.waitForSelector('text=Game Lobby', { timeout: 10000 });
  await hostPage.waitForTimeout(1500);

  // Host starts game
  console.log('🎬 Host starting match...');
  await hostPage.getByRole('button', { name: /Start Game/i }).click();
  await hostPage.waitForTimeout(2000);

  // Host selects word
  console.log('🎨 Host choosing word...');
  const wordChoices = hostPage.locator('.bg-white.rounded-3xl button');
  if (await wordChoices.first().isVisible({ timeout: 5000 }).catch(() => false)) {
    await wordChoices.first().click();
  } else {
    // If selecting word overlay has buttons
    const anyWordBtn = hostPage.getByRole('button', { name: /easy|medium|hard/i });
    if (await anyWordBtn.first().isVisible().catch(() => false)) {
      await anyWordBtn.first().click();
    }
  }

  await hostPage.waitForTimeout(1500);

  // Host Draws on Canvas
  console.log('🖌️ Host drawing vector art on canvas...');
  const canvas = hostPage.locator('canvas#drawingCanvas, canvas');
  const box = await canvas.first().boundingBox();

  if (box) {
    const cx = box.x + box.width / 2;
    const cy = box.y + box.height / 2;

    // Draw central sun circle
    await hostPage.mouse.move(cx, cy - 40);
    await hostPage.mouse.down();
    for (let angle = 0; angle <= Math.PI * 2; angle += 0.25) {
      await hostPage.mouse.move(cx + Math.cos(angle) * 50, cy + Math.sin(angle) * 50);
      await hostPage.waitForTimeout(25);
    }
    await hostPage.mouse.up();
    await hostPage.waitForTimeout(300);

    // Draw rays
    for (let r = 0; r < 8; r++) {
      const angle = (r * Math.PI) / 4;
      await hostPage.mouse.move(cx + Math.cos(angle) * 60, cy + Math.sin(angle) * 60);
      await hostPage.mouse.down();
      await hostPage.mouse.move(cx + Math.cos(angle) * 90, cy + Math.sin(angle) * 90);
      await hostPage.mouse.up();
      await hostPage.waitForTimeout(40);
    }
  }

  await hostPage.waitForTimeout(1500);

  // Capture Drawing Screenshot
  console.log('📸 Capturing gameplay screenshot...');
  await hostPage.screenshot({ path: path.join(assetsDir, 'doodl-drawing-match.png') });

  // Guest submits chat guess
  console.log('💬 Guest submitting guess...');
  const chatInput = guestPage.locator('input[placeholder="Type your guess here..."]');
  if (await chatInput.isVisible()) {
    await chatInput.fill('sun');
    await chatInput.press('Enter');
    await guestPage.waitForTimeout(1500);
  }

  await hostPage.waitForTimeout(2000);

  // Close contexts to flush video file
  console.log('💾 Saving video file...');
  const video = hostPage.video();
  await hostPage.close();
  await guestPage.close();
  await hostContext.close();
  await guestContext.close();
  await browser.close();

  if (video) {
    const videoPath = await video.path();
    const targetVideo = path.join(assetsDir, 'doodl-demo.webm');
    fs.copyFileSync(videoPath, targetVideo);
    console.log(`✅ Demo video successfully recorded and saved to: ${targetVideo}`);
  }

  console.log('🎉 Done! Assets created in docs/assets/');
}

run().catch((err) => {
  console.error('❌ Recording failed:', err);
  process.exit(1);
});
