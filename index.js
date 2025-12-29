const TelegramBot = require('node-telegram-bot-api');
const express = require('express');

// CONFIGURATION
const TOKEN = '7889826281:AAFKbP-fbw8WvLiI1ILdkoM9IRz5Y7npaXk'; 
const CHANNEL_USERNAME = '@proibtalent1'; 
const LOG_CHANNEL = '@proibtalent1'; 

// 1. Initialize bot WITHOUT polling
const bot = new TelegramBot(TOKEN);
const app = express();
app.use(express.json()); // Essential for parsing Telegram updates

const FOREX_PAIR_REGEX = /[A-Z]{6}|[A-Z]{3}\/[A-Z]{3}/;

function normalizeSignal(text) {
  if (!text) return null;
  const buyPattern = /bullish|up|long|buy/gi;
  const sellPattern = /bearish|down|short|sell/gi;
  if (buyPattern.test(text)) return 'BUY';
  if (sellPattern.test(text)) return 'SELL';
  return null;
}

function extractForexSignal(text) {
  if (!text) return null;
  const symbolMatch = text.match(FOREX_PAIR_REGEX);
  if (!symbolMatch) return null;
  const symbol = symbolMatch[0];
  const signal = normalizeSignal(text);
  return signal ? { symbol, signal } : null;
}

// Logic remains the same, but triggered by the webhook
bot.on('channel_post', async (msg) => {
  try {
    if (msg.chat.username !== CHANNEL_USERNAME.replace('@', '')) return;
    const originalText = msg.text || msg.caption;
    if (!originalText) return;

    const forexSignal = extractForexSignal(originalText);
    if (forexSignal) {
      const { symbol, signal } = forexSignal;
      const formattedSignal = `${symbol} ${signal}`;
      
      if (LOG_CHANNEL) await bot.sendMessage(LOG_CHANNEL, formattedSignal);

      const cleanMessage = originalText
        .replace(/bullish|up|long/gi, 'BUY')
        .replace(/bearish|down|short/gi, 'SELL');
      
      await bot.editMessageText(cleanMessage, {
        chat_id: msg.chat.id,
        message_id: msg.message_id
      });
    }
  } catch (error) {
    console.error('Error:', error.message);
  }
});

// 2. NEW: Webhook Endpoint
// Telegram will send updates to this POST route
app.post(`/api/webhook`, (req, res) => {
  bot.processUpdate(req.body);
  res.sendStatus(200); // Tell Telegram we received it
});

app.get('/', (req, res) => {
  res.status(200).send("Bot is alive and waiting for Webhooks.");
});

// Export for Vercel
module.exports = app;
