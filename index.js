const { Client, GatewayIntentBits, Partials } = require('discord.js');
const cron = require('node-cron');
const fs = require('fs');

const TOKEN = 'MTQ5NzkzMzg4NjM4OTM1ODYyMg.Gtl81e.jjVEg8LecaaDNSzeX2aQBPDEVFgNKDv62ticEY';
const CHANNEL_ID = '1497879464905019544';

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMessageReactions,
    GatewayIntentBits.MessageContent
  ],
  partials: [Partials.Message, Partials.Channel, Partials.Reaction]
});

// LOAD DATA
let data = { day: 0, users: {}, lastMessageId: null };

if (fs.existsSync('./data.json')) {
  data = JSON.parse(fs.readFileSync('./data.json'));
}

// READY EVENT
client.once('ready', () => {
  console.log(`Logged in as ${client.user.tag}`);

  const sendStreakMessage = async () => {
    data.day += 1;

    const channel = await client.channels.fetch(CHANNEL_ID);

    if (!channel) {
      console.log("Channel not found");
      return;
    }

    const msg = await channel.send(`🔥 Day ${data.day} streak\nReact with ✅ or ❌`);

    await msg.react('✅');
    await msg.react('❌');

    data.lastMessageId = msg.id;

    fs.writeFileSync('./data.json', JSON.stringify(data, null, 2));
  };

  // 🔥 RUN IMMEDIATELY (optional)
  sendStreakMessage();

  // 🔁 RUN EVERY 24 HOURS
  setInterval(sendStreakMessage, 24 * 60 * 60 * 1000);
});

// REACTION HANDLER
client.on('messageReactionAdd', async (reaction, user) => {
  if (user.bot) return;

  if (reaction.partial) await reaction.fetch();

  if (reaction.message.id !== data.lastMessageId) return;

  const userId = user.id;

  if (!data.users[userId]) {
    data.users[userId] = { streak: 0, lastDay: 0 };
  }

  if (reaction.emoji.name === '✅') {
    if (data.users[userId].lastDay !== data.day) {
      data.users[userId].streak += 1;
      data.users[userId].lastDay = data.day;
    }
  }

  if (reaction.emoji.name === '❌') {
    data.users[userId].streak = 0;
    data.users[userId].lastDay = data.day;
  }

  fs.writeFileSync('./data.json', JSON.stringify(data, null, 2));
});

// COMMAND: !streak
client.on('messageCreate', (message) => {
  if (message.content.startsWith('!streak')) {
    const user = message.mentions.users.first() || message.author;

    const streak = data.users[user.id]?.streak || 0;

    message.reply(`${user.username} is on ${streak} day streak`);
  }
});

client.login(TOKEN);