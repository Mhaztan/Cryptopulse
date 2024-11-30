function displayAd(ctx) {
  const ads = [
    //"💼 Want to start investing in crypto? Check out [Crypto.com](https://crypto.com/exchange?ref=your_affiliate_link) for easy and secure investments. Join now!",
    "💎 Earn up to 50% commission by referring others to trade on [KuCoin](https://www.kucoin.com/r/rf/L2ZXF92N). Join now and earn!",
    //"📉 Trade with low fees and secure your assets on [Gemini](https://www.gemini.com/partners?ref=your_affiliate_link). Start your crypto journey today!",
    //"🎉 Unlock bonuses when you sign up and start trading on [BlockFi](https://blockfi.com/refer?ref=your_affiliate_link). Earn interest on your crypto today!",
    "🔗 Sign up on [Paxful](https://paxful.com/register?r=r4YNoyj3PkX) and start buying/selling crypto with ease. Get started now!",
    //"📲 Buy, sell, and store your crypto securely with [Ledger](https://www.ledger.com/affiliate?ref=your_affiliate_link). Get your hardware wallet now!",
    //"⚡️ Use [Bybit](https://www.bybit.com/app/affiliate?ref=your_affiliate_link) for leveraged crypto trading with zero fees on your first deposit!",
    //"🌟 Instant crypto exchange with low fees on [Changelly](https://changelly.com/affiliate?ref=your_affiliate_link). Sign up and start trading today!",
    //"🔒 Secure and private trading on [StormGain](https://stormgain.com/referral?ref=your_affiliate_link). Get started with free crypto rewards!",
    //"💰 Join [Uniswap](https://uniswap.org/) and earn fees while providing liquidity to the decentralized exchange. Start earning now!",
    //"🔑 Discover the best ways to earn passive income with crypto by signing up for [FaucetHub](https://faucethub.io/?ref=your_affiliate_link).",
    //"🎁 Start trading on [CoinSwitch](https://coinswitch.co/partners?ref=your_affiliate_link) and earn commissions with every trade you make!"
    "💰 Join [Luno](https://luno.com/invite/A8SHCF): Beginner-friendly, NGN deposits supported.",
    "🔑 Try [Remitano](https://remitano.net/ng/join/7758292): P2P trading, multiple payment options.",
  ];
  const randomAd = ads[Math.floor(Math.random() * ads.length)];
  ctx.reply(randomAd, { parse_mode: "Markdown" });
}



module.exports = displayAd;
