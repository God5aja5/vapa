const TelegramBot = require("node-telegram-bot-api");
const { spawn } = require("child_process");
const fs = require("fs");
const bot = new TelegramBot("8027001177:AAHG7m3zlly-KZM0LI_E4T6KYRpKlYn1Ptw", {
  polling: true,
});

const chatId = "7579489523";
let shell; // shared shell process

// Start shell session
function startShell() {
  shell = spawn("bash", [], { stdio: "pipe" });
  shell.stdout.setEncoding("utf8");
  shell.stderr.setEncoding("utf8");
}

startShell();

bot.onText(/\/start|\/help/, (msg) => {
  if (msg.chat.id.toString() !== chatId) return;
  bot.sendMessage(chatId, `👋 Welcome to your VPS Terminal\nUse /terminal <command>`);
});

bot.onText(/\/terminal (.+)/, async (msg, match) => {
  if (msg.chat.id.toString() !== chatId) return;

  const command = match[1];
  bot.sendMessage(chatId, `⏳ Running:\n\`${command}\``, { parse_mode: "Markdown" });

  let output = "";

  const listener = (data) => {
    output += data;
  };

  const errorListener = (data) => {
    output += data;
  };

  shell.stdout.on("data", listener);
  shell.stderr.on("data", errorListener);

  shell.stdin.write(command + "\n");

  // Wait a moment for command to complete
  setTimeout(() => {
    shell.stdout.off("data", listener);
    shell.stderr.off("data", errorListener);

    if (output.trim().length === 0) {
      bot.sendMessage(chatId, "✅ Command ran, but no output.");
    } else if (output.length < 4000) {
      bot.sendMessage(chatId, "📤 Output:\n```\n" + output.trim() + "\n```", {
        parse_mode: "Markdown",
      });
    } else {
      const filePath = "/tmp/output.txt";
      fs.writeFileSync(filePath, output);
      bot.sendDocument(chatId, filePath, {}, {
        filename: "output.txt",
        contentType: "text/plain",
      });
    }

    output = "";
  }, 1500); // wait 1.5s
});
