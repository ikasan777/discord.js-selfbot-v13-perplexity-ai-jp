process.noDeprecation = true;
const { Client } = require('discord.js-selfbot-v13');
const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');

const HISTORY_DIR = './user_conversation_history';
const API_KEY = 'perplexity API KEY';
const ADMIN_USER_IDS = ['ADMIN USER ID 1', 'ADMIN USER ID 2'];

if (!fs.existsSync(HISTORY_DIR)) {
  fs.mkdirSync(HISTORY_DIR);
}

const initialSystemMessage = {
  role: 'system',
  content: 'すべて日本語で対応してください'
};

const client = new Client();
let PREFIX = ','; // Prefixの初期値

function isAdmin(userId) {
  return ADMIN_USER_IDS.includes(userId);
}

function getUserHistory(userId) {
  const filePath = getUserHistoryPath(userId);
  return fs.existsSync(filePath) ? JSON.parse(fs.readFileSync(filePath, 'utf8')) : [initialSystemMessage];
}

function getUserHistoryPath(userId) {
  return path.join(HISTORY_DIR, `${userId}.json`);
}

function saveUserHistory(userId, history) {
  fs.writeFileSync(getUserHistoryPath(userId), JSON.stringify(history, null, 2));
}

client.on('ready', () => {
  console.log(`${client.user.tag} が準備万端にゃ！何かお手伝いできるかにゃ？`);
  client.startTime = new Date();
});

client.on('messageCreate', async (message) => {
  if (message.author.bot) return;

  const command = message.content.toLowerCase();
  if (command.startsWith(PREFIX)) {
    const args = command.slice(PREFIX.length).trim().split(/ +/);
    const cmd = args.shift().toLowerCase();

    switch (cmd) {
      case 'ai':
        await handleAICommand(message, args.join(' '));
        break;
      case 'del':
        handleDeleteHistoryCommand(message);
        break;
      case 'prefix':
        if (isAdmin(message.author.id)) {
          handlePrefixCommand(message, args);
        } else {
          message.reply({ content: "にゃ〜ん、このコマンドは管理者しか使えないにゃ。", allowedMentions: { repliedUser: false } });
        }
        break;
      case 'help':
        handleHelpCommand(message);
        break;
    }
  }
});

async function handleAICommand(message, prompt) {
  const userId = message.author.id;
  let userHistory = getUserHistory(userId);
  userHistory.push({ role: 'user', content: prompt });

  let loadingMessage = await message.reply(`にゃ〜、考え中にゃ...`);

  try {
    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`,
      },
      body: JSON.stringify({
        model: "llama-3.1-sonar-small-128k-online",
        messages: userHistory,
      }),
    });

    if (!response.ok) {
      throw new Error(`にゃ〜ん、Perplexity API エラーにゃ: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    let result = data.choices[0].message.content;

    if (/@everyone|discord(?:app)?\.com\/invite\/\w+|dsc\.gg\/\w+|<@&\d+>|<@!\d+>|<@>\d+>|(?:\d{1,2}|[一二三四五六七八九十百千万億兆]+)(?:歳|才)|(?:1[0-3]|[1-9]) (?:years old|ans|살)|[一两三四五六七八九十]+岁/.test(result)) {
      result = "にゃ〜ん、ごめんにゃさい。その内容はお答えできないにゃ。";
    }

    await loadingMessage.edit(result);
    userHistory.push({ role: 'assistant', content: result });
    saveUserHistory(userId, userHistory);
  } catch (error) {
    console.error("にゃ〜ん、エラーが発生したにゃ:", error);
    message.reply('にゃ〜ん、エラーが発生したにゃ。');
    saveUserHistory(userId, [initialSystemMessage]);
  }
}

function handleDeleteHistoryCommand(message) {
  const userId = message.author.id;
  const filePath = getUserHistoryPath(userId);
  if (fs.existsSync(filePath)) {
    try {
      fs.unlinkSync(filePath);
      message.reply({
        content: "にゃんにゃん！会話履歴を削除したにゃ。",
        allowedMentions: { repliedUser: false }
      });
    } catch (error) {
      console.error("にゃ〜ん、履歴の削除中にエラーが発生したにゃ:", error);
      message.reply({
        content: "にゃ〜ん、会話履歴の削除中にエラーが発生したにゃ。",
        allowedMentions: { repliedUser: false }
      });
    }
  } else {
    message.reply({
      content: "にゃ？削除する会話履歴がないにゃ。",
      allowedMentions: { repliedUser: false }
    });
  }
}

function handlePrefixCommand(message, args) {
  if (args.length === 0) {
    message.reply({ content: `現在のprefixは "${PREFIX}" だにゃ。`, allowedMentions: { repliedUser: false } });
    return;
  }

  const newPrefix = args[0];
  PREFIX = newPrefix;
  message.reply({ content: `prefixを "${newPrefix}" に変更したにゃ！`, allowedMentions: { repliedUser: false } });
}

function handleHelpCommand(message) {
  const helpMessage = `
にゃんにゃん！使えるコマンドはこれだよ〜：
- **${PREFIX}ai [質問]**: AIに質問して、答えをもらうにゃ。
- **${PREFIX}del**: 自分の会話履歴を削除するにゃ。
- **${PREFIX}prefix [新しいprefix]**: prefixを変更するにゃ。管理者だけが使えるにゃ。
- **${PREFIX}help**: このヘルプメッセージを表示するにゃ。
`;
  message.reply({
    content: helpMessage,
    allowedMentions: { repliedUser: false }
  });
}

console.log('にゃ〜ん、ログイン中にゃ...');
client.login("token");
