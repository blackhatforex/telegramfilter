const TelegramBot = require('node-telegram-bot-api');
const express = require('express');

// CONFIGURATION
const TOKEN = '8058093320:AAE1jXIDa6YV00k8RstvXdkn7USrFhLmFIU'; // Your bot token
const CHANNEL_USERNAME = '@proibtalent1'; // Channel to monitor (include @)
const LOG_CHANNEL = '@proibtalent1'; // Where to post extracted signals (optional)
const PORT = 3000;

// Initialize bot and express app
const bot = new TelegramBot(TOKEN, { polling: true });
const app = express();

// Forex symbol pattern (matches EURUSD, GBPUSD, etc.)
const FOREX_PAIR_REGEX = /[A-Z]{6}|[A-Z]{3}\/[A-Z]{3}/;

// Signal normalization
function normalizeSignal(text) {
  if (!text) return null;
  
  // Convert all variations to standardized signals
  const buyPattern = /bullish|up|long|buy/gi;
  const sellPattern = /bearish|down|short|sell/gi;
  
  if (buyPattern.test(text)) return 'BUY';
  if (sellPattern.test(text)) return 'SELL';
  return null;
}

// Process message content
function extractForexSignal(text) {
  if (!text) return null;

  // Find Forex pair
  const symbolMatch = text.match(FOREX_PAIR_REGEX);
  if (!symbolMatch) return null;

  const symbol = symbolMatch[0];
  const signal = normalizeSignal(text);

  if (!signal) return null;

  return { symbol, signal };
}

// Channel post handler
bot.on('channel_post', async (msg) => {
  try {
    // Only process messages from target channel
    if (msg.chat.username !== CHANNEL_USERNAME.replace('@', '')) return;

    const originalText = msg.text || msg.caption;
    if (!originalText) return;

    // Extract signal
    const forexSignal = extractForexSignal(originalText);
    
    if (forexSignal) {
      const { symbol, signal } = forexSignal;
      const formattedSignal = `${symbol} ${signal}`;
      
      console.log(`📊 Extracted Signal: ${formattedSignal}`);
      
      // Send to log channel (optional)
      if (LOG_CHANNEL) {
        await bot.sendMessage(LOG_CHANNEL, formattedSignal);
      }
      
      // Rewrite original message (if you want to modify the source)
      const cleanMessage = originalText
        .replace(/bullish|up|long/gi, 'BUY')
        .replace(/bearish|down|short/gi, 'SELL');
      
      await bot.editMessageText(cleanMessage, {
        chat_id: msg.chat.id,
        message_id: msg.message_id
      });
    }
  } catch (error) {
    console.error('Error processing message:', error.message);
  }
});

// Error handling
bot.on('polling_error', (error) => {
  console.error('Polling error:', error);
});

// Express routes
app.get('/', (req, res) => {
  res.json({
    status: 'running',
    message: '🤖 Forex Signal Bot is active!',
    monitoring: CHANNEL_USERNAME,
    timestamp: new Date().toISOString()
  });
});

app.get('/health', (req, res) => {
  res.json({ status: 'healthy', bot: 'running' });
});

// Start the server
app.listen(PORT, () => {
  console.log(`🤖 Bot running and monitoring ${CHANNEL_USERNAME} for Forex signals...`);
  console.log(`🚀 Express server listening on port ${PORT}`);
  console.log(`🌐 Visit http://localhost:${PORT} to check bot status`);

});
