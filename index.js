const { Client, GatewayIntentBits, Partials } = require('discord.js');
const fs = require('fs');

const TOKEN = process.env.TOKEN;
const CHANNEL_ID = '1497879464905019544';
const OWNER_ID = '831469323784421406'; // 🔐 put your Discord ID here

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMessageReactions,
    GatewayIntentBits.MessageContent
  ],
  partials: [Partials.Message, Partials.Channel, Partials.Reaction]
});

// 📦 LOAD DATA
let data = { day: 0, users: {}, lastMessageId: null };

if (fs.existsSync('./data.json')) {
  data = JSON.parse(fs.readFileSync('./data.json'));
}

// 🚀 READY
client.once('ready', () => {
  console.log(`Logged in as ${client.user.tag}`);
});

// ⚡ REACTION HANDLER
client.on('messageReactionAdd', async (reaction, user) => {
  if (user.bot) return;

  if (reaction.partial) await reaction.fetch();

  if (reaction.message.id !== data.lastMessageId) return;

  const userId = user.id;

  if (!data.users[userId]) {
    data.users[userId] = { streak: 0, lastDay: 0 };
  }

  // 🔥 REMOVE opposite reaction (prevents cheating)
  if (reaction.emoji.name === '✅') {
    const opposite = reaction.message.reactions.cache.get('❌');
    if (opposite) await opposite.users.remove(user.id);

    if (data.users[userId].lastDay !== data.day) {
      data.users[userId].streak += 1;
      data.users[userId].lastDay = data.day;
    }
  }

  if (reaction.emoji.name === '❌') {
    const opposite = reaction.message.reactions.cache.get('✅');
    if (opposite) await opposite.users.remove(user.id);

    data.users[userId].streak = 0;
    data.users[userId].lastDay = data.day;
  }

  fs.writeFileSync('./data.json', JSON.stringify(data, null, 2));
});

// 💬 COMMANDS
client.on('messageCreate', async (message) => {
  if (message.author.bot) return;

  // 🔥 !day (ONLY YOU)
  if (message.content === '!day' && message.author.id === OWNER_ID) {

    data.day += 1;

    const channel = await client.channels.fetch(CHANNEL_ID);

    if (!channel) {
      message.reply('Channel not found');
      return;
    }

    const msg = await channel.send(`🔥 Day ${data.day} streak\nReact with ✅ or ❌`);

    await msg.react('✅');
    await msg.react('❌');

    data.lastMessageId = msg.id;

    fs.writeFileSync('./data.json', JSON.stringify(data, null, 2));
  }

  // 📊 !streak
  if (message.content.startsWith('!streak')) {
    const user = message.mentions.users.first() || message.author;

    const streak = data.users[user.id]?.streak || 0;

    message.reply(`${user.username} is on 🔥 ${streak} day streak`);
  }
});

client.login(TOKEN);