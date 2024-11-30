const schedule = require("node-schedule");

/**
 * Schedule daily alerts to send the latest airdrops to subscribers.
 * @param {Telegraf} bot - The Telegraf bot instance.
 * @param {Array} subscribers - List of subscriber IDs.
 * @param {Function} fetchAirdrops - Function to fetch the latest airdrops.
 */
function scheduleDailyAlerts(bot, subscribers, fetchAirdrops) {
  // Schedule job to run every day at 8:00 AM UTC
  schedule.scheduleJob("0 8 * * *", async () => {
    console.log("⏰ Sending daily airdrop alerts to subscribers...");

    try {
      // Fetch the latest airdrops
      const airdrops = await fetchAirdrops();
      const latestAirdrops = airdrops.slice(0, 5);

      if (latestAirdrops.length) {
        // Prepare the message with airdrop details
        const message = latestAirdrops
          .map(
            (airdrop) =>
              `💰 *${airdrop.title}*\n🌐 [More Info](${airdrop.link})\n📅 Published: ${airdrop.date}`
          )
          .join("\n\n");

        // Send the airdrops to each subscriber
        subscribers.forEach((userId) => {
          bot.telegram.sendMessage(userId, `📢 *Today's Airdrops*\n\n${message}`, {
            parse_mode: "Markdown",
          });
        });
      } else {
        console.log("ℹ️ No airdrops available to send today.");
      }
    } catch (error) {
      console.error("⚠️ Error sending daily alerts:", error);
    }
  });
}

module.exports = scheduleDailyAlerts;

