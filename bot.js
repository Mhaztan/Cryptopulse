require("dotenv").config();
const { Telegraf, Markup, Scenes, session } = require("telegraf");
const fs = require("fs");
const path = require("path");
const fetchAirdrops = require("./services/airdropAPI");
const displayAd = require("./ads");
const scheduleDailyAlerts = require("./helpers/scheduler");
const fetch = require("node-fetch-commonjs");
const Parser = require("rss-parser");
const parser = new Parser();


// Load subscribers data
const subscribersPath = path.join(__dirname, "db", "subscribers.json");
let subscribers = []; // Initialize as empty array
try {
  subscribers = JSON.parse(fs.readFileSync(subscribersPath, "utf-8"));
} catch (error) {
  console.error("Error loading subscribers:", error); //Handle file read error
}


// Initialize the bot
const bot = new Telegraf(process.env.TELEGRAM_TOKEN);

scheduleDailyAlerts(bot, subscribers, fetchAirdrops);

// Function: Generate Main Menu - returns only the Main Menu button
const mainMenuButton = () => Markup.inlineKeyboard([[Markup.button.callback("Main Menu", "MAIN_MENU")]]);

// Function: Generate Full Main Menu
const fullMainMenu = () =>
  Markup.inlineKeyboard([
    [
      Markup.button.callback("📢 Latest Airdrops", "LATEST_AIRDROPS"),
      Markup.button.callback("🔔 Subscribe", "SUBSCRIBE"),
    ],
    [
      Markup.button.callback("📈 Price Alerts", "PRICE_ALERTS"),
      Markup.button.callback("🔍 Token Info", "TOKEN_INFO"),
    ],
    [
      Markup.button.callback("📰 Crypto News", "CRYPTO_NEWS"),
      Markup.button.callback("🔗 Partnered Exchanges", "PARTNERED_EXCHANGES"),
    ],
    [
      Markup.button.callback("📢 Advertise with Us", "ADVERTISE"),
      Markup.button.callback("ℹ️ Help", "HELP"),
    ],
  ]);


// Start Command
bot.start((ctx) => {
  const username = ctx.message.from.username || "User";
  const firstName = ctx.message.from.first_name || "";
  const language = ctx.message.from.language_code || "unknown";
  const welcomeMessage = `
👋 *Welcome ${firstName}!
🕵️‍♀️ Username: @${username}
🌎 Your preferred language is: ${language}
Welcome to the Cryptopulse Bot!*
Stay updated with the latest crypto trends and airdrops!
Check out the features below.`;

  ctx.replyWithPhoto(
    { source: "./assets/welcome.png" },
    {
      caption: welcomeMessage,
      parse_mode: "Markdown",
      reply_markup: fullMainMenu().reply_markup,
    }
  );
});


// Command: Help
bot.action("HELP", (ctx) => {
  ctx.reply(
    `ℹ️ *How the bot works:*\n\n` +
      `1. Use "📢 Latest Airdrops" to view the latest airdrops.\n` +
      `2. Click "🔔 Subscribe" to receive daily notifications.\n` +
      `3. We update the airdrops daily at 8 AM UTC.`,
    { parse_mode: "Markdown", reply_markup: mainMenuButton() }
  );
});

// Command: Latest Airdrops
bot.action("LATEST_AIRDROPS", async (ctx) => {
  ctx.reply("🔍 Fetching the latest airdrops...");
  try {
    const airdrops = await fetchAirdrops();
    const latestAirdrops = airdrops.slice(0, 5);
    if (latestAirdrops.length) {
      latestAirdrops.forEach((airdrop) => {
        ctx.reply(
          `💰 *${airdrop.title}*\n🌐 [More Info](${airdrop.link})\n📅 Published: ${airdrop.date}`,
          { parse_mode: "Markdown" }
        );
      });
      displayAd(ctx);
    } else {
      ctx.reply("❌ No airdrops found. Check back later!");
    }
  } catch (error) {
    console.error("Error fetching airdrops:", error);
    ctx.reply("⚠️ Error fetching airdrops. Please try again later.");
  } finally {
    ctx.reply("⬅️ Back to Main Menu:", mainMenuButton());
  }
});


// Subscribe to Daily Notifications
bot.action("SUBSCRIBE", (ctx) => {
  const userId = ctx.from.id;
  if (!subscribers.includes(userId)) {
    subscribers.push(userId);
    fs.writeFileSync(subscribersPath, JSON.stringify(subscribers, null, 2));
    ctx.reply("✅ You are now subscribed to daily notifications!");
  } else {
    ctx.reply("ℹ️ You are already subscribed.");
  }
  ctx.reply("⬅️ Back to Main Menu:", mainMenuButton());
});


// Price Alerts (Improved Error Handling)
bot.action("PRICE_ALERTS", (ctx) => {
  ctx.reply(
    `📈 Set a price alert:\n\n1. Send the cryptocurrency symbol (e.g., BTC for Bitcoin).\n2. Then send the target price (e.g., 30000).`
  );
  let targetCrypto; // Declare targetCrypto here
  bot.on("text", async (messageCtx) => { // Use bot.once to handle only one message
    const text = messageCtx.message.text.trim().toUpperCase();
    const userId = ctx.from.id;
    if (!isNaN(parseFloat(text))) {
      const targetPrice = parseFloat(text);
      savePriceAlert(userId, targetCrypto, targetPrice);
      messageCtx.reply(`✅ Alert set for ${targetCrypto} to hit $${targetPrice}!`);
      displayAd(ctx);
      messageCtx.reply("⬅️ Back to Main Menu:", mainMenuButton());
    } else {
      targetCrypto = text;
      messageCtx.reply(`💰 Got it! Now send the target price.`);
    }
  });
});


// Helper to save alerts
function savePriceAlert(userId, crypto, price) {
  const alertsPath = path.join(__dirname, "db", "alerts.json");
  let alerts = [];
  try {
    alerts = JSON.parse(fs.readFileSync(alertsPath, "utf-8"));
  } catch (error) {
    console.error("Error loading alerts:", error); // Handle file read error
  }
  alerts.push({ userId, crypto, price });
  fs.writeFileSync(alertsPath, JSON.stringify(alerts, null, 2));
}


// Define the Token Info Scene
const tokenInfoScene = new Scenes.BaseScene("TOKEN_INFO");

tokenInfoScene.enter((ctx) =>
  ctx.reply("🔍 Send the cryptocurrency symbol (e.g., BTC for Bitcoin).")
);

tokenInfoScene.on("text", async (ctx) => {
  const symbol = ctx.message.text.trim().toLowerCase();
  try {
    const listResponse = await fetch("https://api.coingecko.com/api/v3/coins/list");
    const coinList = await listResponse.json();
    const coin = coinList.find((c) => c.symbol === symbol);

    if (coin) {
      const response = await fetch(
        `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=${coin.id}`
      );
      const data = await response.json();

      if (data && data[0]) {
        const token = data[0];
        await ctx.reply(
          `💰 *${token.name} (${token.symbol.toUpperCase()})*\n` +
            `📈 Price: $${token.current_price}\n` +
            `📊 Market Cap: $${token.market_cap.toLocaleString()}\n` +
            `💹 Volume (24h): $${token.total_volume.toLocaleString()}\n\n` +
            `🌐 [More Info](https://www.coingecko.com/en/coins/${token.id})`,
          { parse_mode: "Markdown" }
        );
      } else {
        await ctx.reply("❌ Token information not found. Please try another symbol.");
      }
    } else {
      await ctx.reply("❌ Token not found. Please check the symbol and try again.");
    }
  } catch (error) {
    console.error("Error fetching token info:", error);
    await ctx.reply("⚠️ Error fetching token info. Try again later.");
  } finally {
    ctx.scene.leave();
    ctx.reply("⬅️ Back to Main Menu:", mainMenuButton());
    displayAd(ctx);
  }
});

const stage = new Scenes.Stage([tokenInfoScene]);
bot.use(session());
bot.use(stage.middleware());

bot.action("TOKEN_INFO", (ctx) => ctx.scene.enter("TOKEN_INFO"));

bot.action("PARTNERED_EXCHANGES", (ctx) => {
  ctx.reply(
    `🔗 *Partnered Exchanges (Nigeria-Friendly):*\n\n` +
      `- [KuCoin](https://kucoin.com/r/rf/L2ZXF92N): Wide variety of tokens, P2P trading.\n` +
      `- [Luno](https://luno.com/invite/A8SHCF): Beginner-friendly, NGN deposits supported.\n` +
      `- [Remitano](https://remitano.net/ng/join/7758292): P2P trading, multiple payment options.\n` +
      `- [Paxful](https://paxful.com/register?r=r4YNoyj3PkX): P2P platform with diverse payment methods.\n\n` +
      `✅ Use these links to sign up and start trading!`,
    { parse_mode: "Markdown", reply_markup: mainMenuButton().reply_markup }
  );
  displayAd(ctx); // If displayAd is part of your bot's functionality
});


bot.action("ADVERTISE", (ctx) => {
  ctx.reply(
    `📢 *Advertise with Us!*\n\n` +
      `Promote your project to thousands of crypto enthusiasts. Contact us at:\n` +
      `🌐 [Advertise Now](https://forms.gle/3cnDGfuzDPmruYcB9)\n\n` +
      `💰 Affordable rates and wide reach!`,
    { parse_mode: "Markdown", reply_markup: mainMenuButton().reply_markup }
  );
  displayAd(ctx);
});


bot.action("CRYPTO_NEWS", async (ctx) => {
  ctx.reply("📰 Fetching the latest crypto news...");
  try {
    const feed = await parser.parseURL("https://www.coindesk.com/arc/outboundfeeds/rss/");
    const news = feed.items.slice(0, 10);

    news.forEach((article) => {
      ctx.reply(
        `📰 *${article.title}*\n` +
          `🌐 [Read More](${article.link})\n` +
          `📅 Published: ${article.pubDate}`,
        { parse_mode: "Markdown" }
      );
    });
  } catch (error) {
    console.error("Error fetching news:", error);
    ctx.reply("⚠️ Error fetching news. Please try again later.");
  } finally {
    displayAd(ctx);
    ctx.reply("⬅️ Back to Main Menu:", mainMenuButton());
  }
});


//Main Menu Handler
bot.action("MAIN_MENU", (ctx) => ctx.reply("Choose an action:", fullMainMenu()));


// Schedule daily alerts
scheduleDailyAlerts(bot, subscribers, fetchAirdrops);

// Launch the bot
bot.launch();
console.log("🚀 Crypto Airdrop Alert Bot is running...");

// Graceful shutdown
process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));