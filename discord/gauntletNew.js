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
const GauntletWeek = require("./Models/GauntletWeeks")
const { editGauntletStart, addGauntletStart, setActiveWeek } = require("./gaunletWeekFuncs");

dClient.once("ready", () => {
  console.log("Discord Ready!");
});

dClient.on("message", async (message) => {
  const prefix = "!!";

  if (!message.content.startsWith(prefix) || message.author.bot) return;

  const args = message.content.slice(prefix.length).trim().split(/ +/);
  const command = args.shift().toLowerCase();

  if (command === "gauntlet" || command === "g") {
    let userSubmissions = await Submission.find({
      user: message.author.id,
    });
    console.log(userSubmissions);

    if (userSubmissions.length === 0) {
      // User does not have exisiting submissions
      message.author.createDM().then((dmChannel) => {
        const submitCommandResponse = new Discord.MessageEmbed()
          .setColor("#db48cf")
          .setTitle(`Hi There!`)
          .setDescription(`
          Would you like to make a new submission?
          Reply yes or no
          `);
        dmChannel.send(submitCommandResponse);

        const filter = (m) => m.author.id === dmChannel.recipient.id;
        const responseCollector = new Discord.MessageCollector(
          dmChannel,
          filter
        );

        responseCollector.on("collect", (responseAnswer) => {
          if (responseAnswer.content.toLowerCase() === "yes") {
            submissionFuncs.newSubmissionStart(dmChannel, dClient)
            responseCollector.stop()
          } else if (responseAnswer.content.toLowerCase() === "no") {
            message.reply("Alright, have a good day!")
            responseCollector.stop()
          } else {
            responseAnswer.reply(`Please reply with "yes" or "no"`)
              .then(m => { m.delete({ timeout: 5000 }) })
          }
        });

        responseCollector.on("end", (collected) => {
          console.log(`Review collector stopped`);
        });
      });
    } else {
      // User has exisiting submissions
      message.author.createDM().then((dmChannel) => {
        submissionFuncs.returningUserMenu(dmChannel, dClient);
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

  if (command === "gadmin") {
    if (allowedAdmins.includes(message.author.username)) {
      console.log("User allowed");
      message.author.createDM().then((dmChannel) => {
        const questionEmbed = new Discord.MessageEmbed()
          .setColor("db48cf")
          .setTitle(`Admin Menu`)
          .setDescription(`
        1: Add Gauntlet
        2: Edit gauntlet
        3: Set Active Week
        4: cancel
        `);

        dmChannel.send(questionEmbed)
        const filter = (m) => m.author.id === dmChannel.recipient.id;
        const responseCollector = new Discord.MessageCollector(
          dmChannel,
          filter
        );

        responseCollector.on("collect", async (reply) => {
          if (parseInt(reply.content) === 1) {
            addGauntletStart(dmChannel)
            responseCollector.stop()
          } else if (parseInt(reply.content) === 2) {
            editGauntletStart(dmChannel)
            responseCollector.stop()
          } else if (parseInt(reply.content) === 3) {
            setActiveWeek(dmChannel)
            responseCollector.stop()
          } else if (parseInt(reply.content) === 4) {
            reply.reply("Action cancelled :)").then(msg => {
              msg.delete({ timeout: 5000 })
            })

            responseCollector.stop()
          } else {
            reply.reply("Please respond with a number").then(msg => {
              msg.delete({ timeout: 5000 })
            })
          }
        })


      })

    } else {
      message.reply("This command is only for admins").then((msg) => {
        msg.delete({ timeout: 5000 });
      });
    }
  }
});

dClient.login(process.env.DISCORD_TOKEN);
