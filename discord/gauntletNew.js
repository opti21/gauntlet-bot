require("dotenv").config();

const Discord = require("discord.js");
const dClient = new Discord.Client();
const mongoose = require("mongoose");
const fs = require("fs");
const allowedAdmins = ["opti21"];
const submissionFuncs = require("./submissionFuncs");
const GauntletWeeks = require("./Models/GauntletWeeks");
const { prisma } = require("./util/prisma");

mongoose.connect(
  `mongodb+srv://gauntlet:${process.env.MONGO_PASS}@cluster0.9bvpn.mongodb.net/${process.env.MONGO_DB}?retryWrites=true&w=majority`,
  { useNewUrlParser: true, useUnifiedTopology: true }
);
const db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error:"));
db.once("open", function () {
  // we're connected!
  console.log("Mongoose connected");
});

const {
  editGauntletStart,
  addGauntletStart,
  setActiveWeek,
  setSubmissionStatus,
} = require("./gaunletWeekFuncs");

dClient.once("ready", () => {
  console.log("Discord Ready!");
});

dClient.on("message", async (message) => {
  const prefix = "!!";

  if (!message.content.startsWith(prefix) || message.author.bot) return;

  const args = message.content.slice(prefix.length).trim().split(/ +/);
  const command = args.shift().toLowerCase();

  if (command === "gauntlet" || command === "g") {
    console.log(parseInt(message.author.id));

    const userExists = await prisma.users.findFirst({
      where: { id: message.author.id },
    });

    if (!userExists) {
      await prisma.users
        .create({
          data: {
            id: message.author.id,
            user_pic: message.author.avatarURL({
              format: "png",
              dynamic: true,
            }),
            username: message.author.username,
          },
        })
        .then((response) => {
          console.log("User Created");
          console.log(response);
        })
        .catch((e) => {
          console.error(e);
        });
    } else {
      await prisma.users.update({
        where: { id: userExists.id },
        data: {
          user_pic: message.author.avatarURL({
            format: "png",
            dynamic: true,
          }),
        },
      });
    }

    console.log(userExists);

    let userSubmissions = await prisma.submissions.findMany({
      where: { user: message.author.id },
    });
    console.log(userSubmissions);

    if (userSubmissions.length === 0) {
      // User does not have exisiting submissions
      message.author.createDM().then((dmChannel) => {
        const submitCommandResponse = new Discord.MessageEmbed()
          .setColor("#db48cf")
          .setTitle(`Hi There!`).setDescription(`
          Would you like to make a new submission?
          Reply yes or no
          `);
        dmChannel.send(submitCommandResponse);

        const filter = (m) => m.author.id === dmChannel.recipient.id;
        const responseCollector = new Discord.MessageCollector(
          dmChannel,
          filter
        );

        responseCollector.on("collect", async (responseAnswer) => {
          if (responseAnswer.content.toLowerCase() === "yes") {
            const activeWeek = await prisma.gauntlet_weeks.findFirst({
              where: { active: true },
            });
            if (activeWeek.accepting_submissions) {
              submissionFuncs.newSubmissionStart(dmChannel, dClient);
            } else {
              const submissionsClosedEmbed = new Discord.MessageEmbed()
                .setColor("#ff0000")
                .setTitle("Submissions Closed").setDescription(`
                Unfortunately submissions for this week are closed
                `);

              dmChannel.send(submissionsClosedEmbed);
            }
            responseCollector.stop();
          } else if (responseAnswer.content.toLowerCase() === "no") {
            message.reply("Alright, have a good day!");
            responseCollector.stop();
          } else {
            responseAnswer
              .reply(`Please reply with "yes" or "no"`)
              .then((m) => {
                m.delete({ timeout: 5000 });
              });
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
      });
    }
  }

  if (command === "week") {
    fs.readFile("gauntletInfo.json", async (err, data) => {
      if (err) console.log(err);
      const gauntletInfo = await GauntletWeeks.findOne({
        active: true,
      });
      console.log(gauntletInfo);
      const infoEmbed = new Discord.MessageEmbed()
        .setColor("db48cf")
        .setTitle(
          `Week ${gauntletInfo.week}'s Gauntlet theme is **${gauntletInfo.theme}**`
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
          .setTitle(`Admin Menu`).setDescription(`
        1: Add Gauntlet
        2: Edit gauntlet
        3: Set Active Week
        4: Set Submission Status
        5: cancel
        `);

        dmChannel.send(questionEmbed);
        const filter = (m) => m.author.id === dmChannel.recipient.id;
        const responseCollector = new Discord.MessageCollector(
          dmChannel,
          filter
        );

        responseCollector.on("collect", async (reply) => {
          if (parseInt(reply.content) === 1) {
            addGauntletStart(dmChannel);
            responseCollector.stop();
          } else if (parseInt(reply.content) === 2) {
            editGauntletStart(dmChannel);
            responseCollector.stop();
          } else if (parseInt(reply.content) === 3) {
            setActiveWeek(dmChannel);
            responseCollector.stop();
          } else if (parseInt(reply.content) === 4) {
            setSubmissionStatus(dmChannel);
            responseCollector.stop();
          } else if (parseInt(reply.content) === 5) {
            reply.reply("Action cancelled :)").then((msg) => {
              msg.delete({ timeout: 5000 });
            });

            responseCollector.stop();
          } else {
            reply.reply("Please respond with a number").then((msg) => {
              msg.delete({ timeout: 5000 });
            });
          }
        });
      });
    } else {
      message.reply("This command is only for admins").then((msg) => {
        msg.delete({ timeout: 5000 });
      });
    }
  }

  if (
    command === "getnames" &&
    allowedAdmins.includes(message.author.username)
  ) {
    const activeWeek = await prisma.gauntlet_weeks.findFirst({
      where: { active: true },
    });
    const submissions = await prisma.submissions.findMany({
      where: { gauntlet_week: activeWeek.week },
      include: { user_profile: true },
    });
    let userStr = "";

    submissions.forEach((sub) => {
      userStr += `${sub.user_profile.username}\n`;
    });
    message.reply(userStr);
  }
});

dClient.login(process.env.DISCORD_TOKEN);
