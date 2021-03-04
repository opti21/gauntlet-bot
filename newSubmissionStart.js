const Discord = require("discord.js");
const Submission = require("./models/submissions");
const collectFiles = require("./collectFiles");
const reviewSubmission = require("./reviewSubmission")

module.exports = async (dmChannel) => {
  console.log(dmChannel);
  const submitEmbed = new Discord.MessageEmbed()
    .setColor("#db48cf")
    .setTitle(`New Gauntlet submission`).setDescription(`
            Type out your description for your submission then send it

            also be sure to place any links here as well

            If discord can handle the file size of your project then you can upload them on the next step`);
  dmChannel.send(submitEmbed);

  let newSubmission = new Submission({
    locked: false,
    editing: true,
    user: dmChannel.recipient.id,
  });
  newSubmission.save();

  const filter = (m) => m.author.id === dmChannel.recipient.id;
  const descriptionCollector = new Discord.MessageCollector(dmChannel, filter, {
    max: 1,
  });

  descriptionCollector.on("collect", async (m) => {
    console.log(`Collected ${m.content}`);
    await Submission.updateOne(
      { user: m.author.id, editing: true },
      {
        description: m.content,
      }
    );
  });

  descriptionCollector.on("end", (collected) => {
    console.log("Collected Description");

    const fileQuestionEmbed = new Discord.MessageEmbed()
      .setColor("#db48cf")
      .setTitle(`Any Files?`).setDescription(`
            Do you have any files you would like to submit? Reply "yes" or "no"

            This will be anything discord can handle

            reply "yes" or "no"
            `);
    dmChannel.send(fileQuestionEmbed);

    const filter = (m) => m.author.id === dmChannel.recipient.id;
    const fileQuestionCollector = new Discord.MessageCollector(
      dmChannel,
      filter
    );

    fileQuestionCollector.on("collect", async (m) => {
      if (m.content.toLowerCase() === "yes") {
        collectFiles(dmChannel)
      } else if (m.content.toLowerCase() === "no") {
        reviewSubmission(dmChannel)
      } else {
        m.reply(`Please reply with "yes" or "no"`)
        .then(m => {m.delete({timeout: 5000})})
      }
    });

  });
};
