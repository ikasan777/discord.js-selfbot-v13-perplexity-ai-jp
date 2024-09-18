process.noDeprecation = true;//警告の無効化にゃ
const { Client } = require('discord.js-selfbot-v13');
const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');

const HISTORY_DIR = './user_conversation_history';
const API_KEY = 'perplexity API KEY';
const ADMIN_USER_IDS = ['ADMIN USER ID 1', 'ADMIN USER ID 2'];

try {
  if (!fs.existsSync(HISTORY_DIR)) {
    fs.mkdirSync(HISTORY_DIR);
  }
} catch (error) {
  console.error('にゃ〜ん、履歴ディレクトリの作成に失敗したにゃ:', error);
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
  try {
    return fs.existsSync(filePath) ? JSON.parse(fs.readFileSync(filePath, 'utf8')) : [initialSystemMessage];
  } catch (error) {
    console.error(`にゃ〜ん、ユーザー ${userId} の履歴の読み込みに失敗したにゃ:`, error);
    return [initialSystemMessage];
  }
}

function getUserHistoryPath(userId) {
  return path.join(HISTORY_DIR, `${userId}.json`);
}

function saveUserHistory(userId, history) {
  try {
    fs.writeFileSync(getUserHistoryPath(userId), JSON.stringify(history, null, 2));
  } catch (error) {
    console.error(`にゃ〜ん、ユーザー ${userId} の履歴の保存に失敗したにゃ:`, error);
  }
}

client.on('ready', () => {
  console.log(`${client.user.tag} が準備万端にゃ！何かお手伝いできるかにゃ？`);
  client.startTime = new Date();
});

client.on('error', (error) => {
  if (error.code === 'TOKEN_INVALID') {
    console.error('にゃ〜ん、トークンが無効だにゃ。トークンを確認して、必要なら再生成するにゃ。');
  } else if (error.code === 'DISALLOWED_INTENTS') {
    console.error('にゃ〜ん、必要な権限がないにゃ。Botの権限設定を確認するにゃ。');
  } else if (error.httpStatus === 429) {
    console.error('にゃ〜ん、リクエストが多すぎるにゃ。しばらく待ってからリトライするにゃ。');
  } else if (error.code === 'MESSAGE_CONTENT_TYPE_INVALID') {
    console.error('にゃ〜ん、メッセージが長すぎるにゃ。2000文字以内に収めるか、分割して送信するにゃ。');
  } else {
    console.error('にゃ〜ん、エラーが発生したにゃ:', error);
  }
});

client.on('messageCreate', async (message) => {
  if (message.author.bot) return;

  const command = message.content.toLowerCase();
  if (command.startsWith(PREFIX)) {
    const args = command.slice(PREFIX.length).trim().split(/ +/);
    const cmd = args.shift().toLowerCase();

    try {
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
        default:
          message.reply({ content: "にゃ？そのコマンドは知らないにゃ。", allowedMentions: { repliedUser: false } });
      }
    } catch (error) {
      console.error('にゃ〜ん、コマンド処理中にエラーが発生したにゃ:', error);
      message.reply({ content: "にゃ〜ん、コマンドの処理中にエラーが発生したにゃ。", allowedMentions: { repliedUser: false } });
    }
  }
});

async function handleAICommand(message, prompt) {
  const userId = message.author.id;
  let userHistory = getUserHistory(userId);
  userHistory.push({ role: 'user', content: prompt });

  let loadingMessage;
  try {
    loadingMessage = await message.reply(`にゃ〜、考え中にゃ...`);
  } catch (error) {
    console.error('にゃ〜ん、ローディングメッセージの送信に失敗したにゃ:', error);
    return;
  }

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
    console.error("にゃ〜ん、AIの応答中にエラーが発生したにゃ:", error);
    try {
      if (error.code === 50035) {
        console.error('にゃ〜ん、メッセージが長すぎるにゃ。2000文字以内に収めるか、分割して送信するにゃ。');
        // メッセージを分割して送信する処理を追加
        const chunks = result.match(/.{1,2000}/g) || [];
        for (const chunk of chunks) {
          await message.channel.send(chunk);
        }
      } else {
        await loadingMessage.edit('にゃ〜ん、AIの応答中にエラーが発生したにゃ。');
      }
    } catch (editError) {
      console.error('にゃ〜ん、エラーメッセージの編集に失敗したにゃ:', editError);
    }
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
client.login("token").catch(error => {
  console.error('にゃ〜ん、ログインに失敗したにゃ:', error);
});
