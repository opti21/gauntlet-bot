require("dotenv").config();

const Discord = require("discord.js");
const dClient = new Discord.Client();
const mongoose = require("mongoose");
const fs = require("fs");
const allowedAdmins = ["opti21"];
const submissionFuncs = require("./submissionFuncs")

mongoose.connect(
  `mongodb+srv://gauntlet:${process.env.MONGO_PASS}@cluster0.9bvpn.mongodb.net/gauntlet?retryWrites=true&w=majority`,
  { useNewUrlParser: true, useUnifiedTopology: true }
);
const db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error:"));
db.once("open", function () {
  // we're connected!
  console.log("Mongoose connected");
});

const Submission = require("./models/submissions");

dClient.once("ready", () => {
  console.log("Discord Ready!");
});

dClient.on("message", async (message) => {
  const prefix = "!";

  if (!message.content.startsWith(prefix) || message.author.bot) return;

  const args = message.content.slice(prefix.length).trim().split(/ +/);
  const command = args.shift().toLowerCase();

  if (command === "submit") {
    let userSubmissions = await Submission.find({
      user: message.author.id,
    });
    console.log(userSubmissions);

    if (userSubmissions.length === 0) {
      message.author.createDM().then((dmChannel) => {
        submissionFuncs.newSubmissionStart(dmChannel);
      });
    } else {
      message.author.createDM().then((dmChannel) => {
        submissionFuncs.userSubmissionMenu(dmChannel);
      })
    }
  }

  if (command === "week") {
    fs.readFile("gauntletInfo.json", (err, data) => {
      if (err) console.log(err);
      let gauntletInfo = JSON.parse(data);
      console.log(gauntletInfo);
      const infoEmbed = new Discord.MessageEmbed()
        .setColor("db48cf")
        .setTitle(
          `Week ${gauntletInfo.week}'s Gauntlet is **${gauntletInfo.title}**`
        )
        .setDescription(`${gauntletInfo.description}`);

      message.channel.send(infoEmbed);
    });
  }

  if (command === "setinfo") {
    if (allowedAdmins.includes(message.author.username)) {
      console.log("User allowed");
      message.reply("What is the new week");
      // TODO: Finish this command
    } else {
      message.reply("This command is only for admins").then((msg) => {
        msg.delete({ timeout: 5000 });
      });
    }
  }
});

dClient.login(process.env.DISCORD_TOKEN);
