const Discord = require("discord.js");
const { prisma } = require("./util/prisma");

const addGauntletStart = async (dmChannel) => {
  const questionEmbed = new Discord.MessageEmbed()
    .setColor("db48cf")
    .setTitle(`What week did you want to add?`).setDescription(`
        Respond with a number
        or to cancel respond with "cancel"
        `);
  dmChannel.send(questionEmbed);

  const filter = (m) => m.author.id === dmChannel.recipient.id;
  const gauntletStartCollector = new Discord.MessageCollector(
    dmChannel,
    filter
  );

  gauntletStartCollector.on("collect", async (reply) => {
    console.log("isnum: " + isNum(reply.content));
    if (isNum(reply.content)) {
      let exists = await prisma.gauntlet_weeks.findUnique({
        where: { week: parseInt(reply.content) },
      });

      console.log("exists: ", exists);

      if (exists) {
        gauntletStartCollector.stop();
        const existsEmbed = new Discord.MessageEmbed()
          .setColor("db48cf")
          .setTitle(`Week already exists`).setDescription(`
                      A gauntlet has already been set for that week.
                      Did you want to edit it?
                      reply with yes or no
                      `);
        dmChannel.send(existsEmbed);
        const filter = (m) => m.author.id === dmChannel.recipient.id;
        const exsitsReplyCollector = new Discord.MessageCollector(
          dmChannel,
          filter
        );

        exsitsReplyCollector.on("collect", async (existsReply) => {
          if (existsReply.content.toLowerCase() === "yes") {
            editGauntletStart(dmChannel);
          } else if (existsReply.content.toLowerCase() === "no") {
            existsReply
              .reply("Action cancelled have a great day/night :)")
              .then((msg) => {
                msg.delete({ timeout: 5000 });
                exsitsReplyCollector.stop();
              });
          } else {
            existsReply
              .reply("Please resond with 'yes' or 'no'")
              .then((msg) => {
                msg.delete({ timeout: 5000 });
              });
          }
        });
      } else {
        gauntletStartCollector.stop();
        addGauntlet(dmChannel, parseInt(reply.content));
      }
    } else if (reply.content.toLowerCase() === "cancel") {
      reply.reply("Cancelled have a great day/night :)").then((msg) => {
        msg.delete({ timeout: 5000 });
      });
      gauntletStartCollector.stop();
    } else {
      reply.reply("Please respond with a number or 'cancel'").then((msg) => {
        msg.delete({ timeout: 5000 });
      });
    }
  });
};

const addGauntlet = async (dmChannel, week) => {
  let newGauntletWeek = await prisma.gauntlet_weeks.create({
    data: { week: week },
  });
  console.log("new Week: ", newGauntletWeek);
  const titleEmbed = new Discord.MessageEmbed()
    .setColor("db48cf")
    .setTitle(`Gauntlet Theme`).setDescription(`
        What is the new Gauntlet's Theme?
        `);
  dmChannel.send(titleEmbed);
  const filter = (m) => m.author.id === dmChannel.recipient.id;
  const themeCollector = new Discord.MessageCollector(dmChannel, filter, {
    max: 1,
  });

  themeCollector.on("collect", async (themeReply) => {
    let addThemeToWeek = await prisma.gauntlet_weeks.update({
      where: { week: week },
      data: { theme: themeReply.content },
    });
    // console.log(addThemeToWeek);
  });

  themeCollector.on("end", async (collected) => {
    const newDescrpitionEmbed = new Discord.MessageEmbed()
      .setColor("db48cf")
      .setTitle(`Gauntlet Description`).setDescription(`
            What is the new Gauntlet's description?
            `);
    dmChannel.send(newDescrpitionEmbed);
    const filter = (m) => m.author.id === dmChannel.recipient.id;
    const descCollector = new Discord.MessageCollector(dmChannel, filter, {
      max: 1,
    });

    descCollector.on("collect", async (descReply) => {
      let addDescToWeek = await prisma.gauntlet_weeks
        .update({
          where: { week: week },
          data: { description: descReply.content },
        })
        .catch((e) => {
          console.error(e);
        });
      // console.log(addDescToWeek);
    });

    descCollector.on("end", async (collected) => {
      let createdGauntlet = await prisma.gauntlet_weeks.findUnique({
        where: { week: week },
      });
      // console.log("Created Week: ", createdGauntlet);
      const newGauntletEmbed = new Discord.MessageEmbed()
        .setColor("#2cff14")
        .setTitle(`New Gauntlet Week Created`).setDescription(`
                Week: ${createdGauntlet.week},
                Theme: ${createdGauntlet.theme},
                Description: ${createdGauntlet.description}
                `);
      dmChannel.send(newGauntletEmbed);
    });
  });
};

const editGauntletStart = async (dmChannel) => {
  const startEmbed = new Discord.MessageEmbed()
    .setColor("db48cf")
    .setTitle(`Which gauntlet did you want to want to edit?`).setDescription(`
        Reply with the week you want to edit.
        `);
  dmChannel.send(startEmbed);
  const filter = (m) => m.author.id === dmChannel.recipient.id;
  const editStartCollector = new Discord.MessageCollector(dmChannel, filter);

  editStartCollector.on("collect", async (editStartReply) => {
    if (isNum(editStartReply.content)) {
      let exists = await prisma.gauntlet_weeks
        .findFirst({
          where: { week: parseInt(editStartReply) },
        })
        .catch((e) => {
          console.error(e);
        });
      if (exists) {
        editGauntlet(dmChannel, parseInt(editStartReply));
        editStartCollector.stop();
      } else {
        editStartReply
          .reply("Week does not exist, please choose a week that exists")
          .then((msg) => {
            msg.delete({ timeout: 5000 });
          });
      }
    } else if (editStartReply.content.toLowerCase() === "cancel") {
      editStartReply
        .reply("Action cancelled have a great day/night :)")
        .then((msg) => {
          msg.delete({ timeout: 5000 });
        });
      editStartCollector.stop();
    } else {
      editStartReply
        .reply("Please only send a number or 'cancel'")
        .then((msg) => {
          msg.delete({ timeout: 5000 });
        });
    }
  });
};

const editGauntlet = async (dmChannel, week) => {
  const startEmbed = new Discord.MessageEmbed()
    .setColor("db48cf")
    .setTitle(`What would you like to edit?`).setDescription(`
        1: Theme
        2: Description
        3: cancel

        Reply with a number from above
        `);
  dmChannel.send(startEmbed);
  const filter = (m) => m.author.id === dmChannel.recipient.id;
  const editMenuCollector = new Discord.MessageCollector(dmChannel, filter);

  editMenuCollector.on("collect", async (editMenuReply) => {
    if (isNum(editMenuReply.content)) {
      if (parseInt(editMenuReply.content) === 1) {
        // edit Theme
        editMenuCollector.stop();
        setGauntletTheme(dmChannel, week);
      } else if (parseInt(editMenuReply.content) === 2) {
        // edit Description
        editMenuCollector.stop();
        setGauntletDescription(dmChannel, week);
      } else if (parseInt(editMenuReply.content) === 3) {
        editMenuReply.reply("Action Cancelled").then((msg) => {
          msg.delete({ timeout: 5000 });
        });
        editMenuCollector.stop();
      } else {
        editMenuReply.reply("Please respond with 1, 2, 3").then((msg) => {
          msg.delete({ timeout: 5000 });
        });
      }
    } else {
      editMenuReply.reply("Please respond with a number only").then((msg) => {
        msg.delete({ timeout: 5000 });
      });
    }
  });
};

const setGauntletTheme = async (dmChannel, week) => {
  const themeEmbed = new Discord.MessageEmbed()
    .setColor("db48cf")
    .setTitle(`Gauntlet Theme`).setDescription(`
        What is the Gauntlet's theme?
        `);
  dmChannel.send(themeEmbed);
  const filter = (m) => m.author.id === dmChannel.recipient.id;
  const themeCollector = new Discord.MessageCollector(dmChannel, filter, {
    max: 1,
  });

  themeCollector.on("collect", async (themeReply) => {
    let setGauntletTheme = await prisma.gauntlet_weeks
      .update({
        where: { week: week },
        data: {
          theme: themeReply.content,
        },
      })
      .catch((e) => {
        console.error(e);
      });
  });

  themeCollector.on("end", (collected) => {
    const updateEmbed = new Discord.MessageEmbed()
      .setColor("#2cff14")
      .setTitle(`Theme updated`);
    dmChannel.send(updateEmbed);
  });
};

const setGauntletDescription = async (dmChannel, week) => {
  const descriptionEmbed = new Discord.MessageEmbed()
    .setColor("#db48cf")
    .setTitle(`Gauntlet Description`).setDescription(`
        What is the Gauntlet's Description?
        `);
  dmChannel.send(descriptionEmbed);
  const filter = (m) => m.author.id === dmChannel.recipient.id;
  const descCollector = new Discord.MessageCollector(dmChannel, filter, {
    max: 1,
  });

  descCollector.on("collect", async (descReply) => {
    let setGauntletDesc = await prisma.gauntlet_weeks.update({
      where: { week: week },
      data: {
        description: descReply.content,
      },
    });
    console.log("Desc updated");
  });

  descCollector.on("end", (collected) => {
    const descriptionEmbed = new Discord.MessageEmbed()
      .setColor("#2cff14")
      .setTitle(`Description updated`);
    dmChannel.send(descriptionEmbed);
  });
};

const setActiveWeek = async (dmChannel) => {
  const activeEmbed = new Discord.MessageEmbed()
    .setColor("#db48cf")
    .setTitle(`Active Week`).setDescription(`
        Which week do you want to set active?
        `);
  dmChannel.send(activeEmbed);
  const filter = (m) => m.author.id === dmChannel.recipient.id;
  const activeCollector = new Discord.MessageCollector(dmChannel, filter);

  activeCollector.on("collect", async (activeReply) => {
    if (isNum(activeReply)) {
      let weekNum = parseInt(activeReply.content);
      let weekExists = await prisma.gauntlet_weeks.findUnique({
        where: { week: weekNum },
      });

      if (weekExists) {
        let currentActive = await prisma.gauntlet_weeks.findFirst({
          where: { active: true },
        });

        if (currentActive.week === weekNum) {
          activeReply
            .reply(
              "That week already is set as Active\n\nPlease select another or cancel"
            )
            .then((msg) => {
              msg.delete({ timeout: 5000 });
            });
        } else {
          await prisma.gauntlet_weeks.update({
            where: { week: currentActive.week },
            data: { active: false },
          });

          await prisma.gauntlet_weeks.update({
            where: { week: weekNum },
            data: { active: true },
          });

          const updatedEmbed = new Discord.MessageEmbed()
            .setColor("#2cff14")
            .setTitle(`Active Week Set`).setDescription(`
                        Active week set to ${weekNum}
                        `);
          dmChannel.send(updatedEmbed);
          activeCollector.stop();
        }
      } else {
        activeReply
          .reply(
            "That week does not exist please choose another one \n or send cancel"
          )
          .then((msg) => {
            msg.delete({ timeout: 5000 });
          });
      }
    } else if (activeReply.content.toLowerCase() === "cancel") {
      activeReply.reply("Action cancelled :)").then((msg) => {
        msg.delete({ timeout: 5000 });
      });
      activeCollector.stop();
    } else {
      activeReply
        .reply("Please respond with a number or cancel")
        .then((msg) => {
          msg.delete({ timeout: 5000 });
        });
    }
  });
};

const setSubmissionStatus = async (dmChannel) => {
  const statusEmbed = new Discord.MessageEmbed()
    .setColor("#db48cf")
    .setTitle(`Submission Status`).setDescription(`
        What do you want to set the status as?
        
        Please respond with "open" or "closed"
        `);
  dmChannel.send(statusEmbed);
  const filter = (m) => m.author.id === dmChannel.recipient.id;
  const statusCollector = new Discord.MessageCollector(dmChannel, filter);

  statusCollector.on("collect", async (reply) => {
    if (reply.content === "open") {
      await prisma.gauntlet_weeks
        .updateMany({
          where: { active: true },
          data: { accepting_submissions: true },
        })
        .catch((err) => {
          console.error(err);
        });
      const updatedEmbed = new Discord.MessageEmbed()
        .setColor("#2cff14")
        .setTitle(`Submission Status Set`)
        .setDescription(`Submissions Open`);
      dmChannel.send(updatedEmbed);
      statusCollector.stop();
    } else if (reply.content === "closed") {
      await prisma.gauntlet_weeks
        .updateMany({
          where: { active: true },
          data: { accepting_submissions: false },
        })
        .catch((err) => {
          console.error(err);
        });
      const updatedEmbed = new Discord.MessageEmbed()
        .setColor("#2cff14")
        .setTitle(`Submission Status Set`)
        .setDescription(`Submissions Closed`);
      dmChannel.send(updatedEmbed);
      statusCollector.stop();
    } else {
      reply.reply("Please respond with open or closed").then((msg) => {
        msg.delete({ timeout: 5000 });
      });
    }
  });
};

const isNum = (string) => {
  let isNumFunc = /^\d+$/.test(string);
  return isNumFunc;
};

module.exports = {
  addGauntletStart,
  editGauntletStart,
  setActiveWeek,
  setSubmissionStatus,
};
