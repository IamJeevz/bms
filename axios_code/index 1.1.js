const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const axios = require('axios');

// ✅ Use stealth plugin to avoid detection
puppeteer.use(StealthPlugin());

// Config
const TARGET_URL = 'https://in.bookmyshow.com/movies/kochi/demon-slayer-kimetsu-no-yaiba-infinity-castle/buytickets/ET00436673/20250928';
const KEYWORD = 'PVR: Forum Mall';
const CHECK_INTERVAL_MS = 60000; // 60 seconds
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));


// ✅ WhatsApp notification sender
const sendNotification = async () => {
  try {
    const response = await axios.post(
      'https://graph.facebook.com/v22.0/793948707137006/messages',
      {
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: '918593041180',
        type: 'text',
        text: {
          body: '🎯 PVR: Forum Mall show found!',
          preview_url: false
        }
      },
      {
        headers: {
          'Authorization': 'Bearer EAAY5tYDyDGcBPakPJgYD8IFN44x9wC6E3lGScXxyWt7ZAuwlFp5Kk6kH7f2fXXL0qmca3y1FjIHZCyjhEzWp3R88vIHu3beaTZAiXpZAVUK5Pik6TQ7SK0oZBGV0R0dhhwvPxZCq9g35TgCLnd2idDuxCbBmlM7cHxqxRjBbTrvkOWbzm6klsZC07I0FS6uDwZDZD',
          'Content-Type': 'application/json'
        }
      }
    );
    console.log('✅ WhatsApp notification sent:', response.status);
  } catch (error) {
    console.error('❌ Failed to send notification:', error.message);
  }
};

// ✅ Polling logic with Puppeteer
const checkForPVR = async () => {
  console.log(`[${new Date().toISOString()}] 🔍 Checking for "${KEYWORD}"...`);

  let browser;
  try {
    browser = await puppeteer.launch({
      headless: false,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();
    await page.goto(TARGET_URL, { waitUntil: 'networkidle2' });
	await sleep(10000);
    const html = await page.content();

    if (html.includes(KEYWORD)) {
      console.log(`🎯 Found "${KEYWORD}"! Sending WhatsApp notification...`);
      clearInterval(intervalId); // stop polling once found
      await sendNotification();
    } else {
      console.log(`❌ "${KEYWORD}" not found.`);
    }
  } catch (error) {
    console.error(`[${new Date().toISOString()}] ❌ Error: ${error.message}`);
  } finally {
    if (browser) await browser.close();
  }
};

// ✅ Start polling
console.log('🚀 Starting PVR checker...');
const intervalId = setInterval(checkForPVR, CHECK_INTERVAL_MS);
