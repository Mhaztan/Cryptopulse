const { Telegraf } = require("telegraf");

const bot = new Telegraf(process.env.TELEGRAM_TOKEN);

bot.on("text", (ctx) => {
  ctx.reply("Hello, this is your bot responding via webhook!");
});

// Webhook handler
module.exports = (req, res) => {
  // Check that the request is a POST method
  if (req.method === "POST") {
    bot.handleUpdate(req.body);  // Pass the incoming update to Telegraf
    res.status(200).send("OK");
  } else {
    res.status(405).send("Method Not Allowed");
  }
};
