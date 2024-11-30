//services/airdropAPI.js

const Parser = require('rss-parser');

const parser = new Parser();

async function fetchAirdrops() {
    const feed = await parser.parseURL('https://airdropalert.com/feed/rssfeed');
    const airdrops = feed.items.map(item => ({
        title: item.title,
        link: item.link,
        date: item.pubDate,
    }));
    return airdrops;
}

module.exports = fetchAirdrops;