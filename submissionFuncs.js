const Discord = require("discord.js");
const Submission = require("./models/submissions");
const fs = require("fs").promises

const newSubmissionStart = async (dmChannel) => {
  // console.log(dmChannel);
  const submitEmbed = new Discord.MessageEmbed()
    .setColor("#db48cf")
    .setTitle(`New Gauntlet submission`).setDescription(`
            Type out your description for your submission then send it

            also be sure to place any links here as well

            If discord can handle the file size of your project then you can upload them on the next step`);
  dmChannel.send(submitEmbed);

  const gauntletData = await fs.readFile("gauntletInfo.json", (err, data) => {
    if (err) console.log(err);
    return data;
  });

  let gauntletInfo = JSON.parse(gauntletData)

  // console.log(gauntletInfo)

  let newSubmission = new Submission({
    locked: false,
    editing: true,
    user: dmChannel.recipient.id,
    week: gauntletInfo.week
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
            Do you have any files you would like to submit?

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
        fileQuestionCollector.stop()
      } else if (m.content.toLowerCase() === "no") {
        reviewSubmission(dmChannel)
        fileQuestionCollector.stop()
      } else {
        m.reply(`Please reply with "yes" or "no"`)
          .then(m => { m.delete({ timeout: 5000 }) })
      }
    });

  });
};

const collectFiles = async (dmChannel) => {
  const fileInstructionEmbed = new Discord.MessageEmbed()
    .setColor("#db48cf")
    .setTitle(`Upload files`)
    .setDescription(
      'Upload your files here.\n when you are done adding files send **"done"**'
    );
  dmChannel.send(fileInstructionEmbed);

  const filter = (m) => m.author.id === dmChannel.recipient.id;
  const fileCollector = new Discord.MessageCollector(
    dmChannel,
    filter
  );

  fileCollector.on("collect", async (fileM) => {
    if (fileM.content.toLowerCase() != "done") {
      let submission = await Submission.findOne({
        user: dmChannel.recipient.id,
        editing: true,
      });
      let attachmentsArray = JSON.parse(submission.attachments);

      console.log(fileM.attachments.size)
      if (fileM.attachments.size > 0) {
        // There are attachments in this message
        attachmentsArray.push(fileM.attachments.first().url);

        await Submission.findByIdAndUpdate(
          submission._id,
          {
            attachments: JSON.stringify(attachmentsArray),
          },
          { useFindAndModify: false }
        );

      } else {
        // User didn't upload a file or sent random text
        fileM.reply(`Please either upload a file or send "done" if you are finished uploading`)
          .then(m => { m.delete({ timeout: 5000 }) })
      }
    } else {
      // User is done uploading files
      fileCollector.stop()
      reviewSubmission(dmChannel)
    }
  })

  fileCollector.on("end", (collected) => {
    console.log(`Collected ${collected.size} files`)
  })
}

const reviewSubmission = async (dmChannel) => {
  let previewSubmission = await Submission.findOne({
    user: dmChannel.recipient.id,
    editing: true,
  });

  const submissionPreviewEmbed = new Discord.MessageEmbed()
    .setColor("#db48cf")
    .setTitle(`Review Submission`)
    .setDescription(`
                    Does your submission look good? Reply "yes" or "no"

                    **Description:** ${previewSubmission.description}
                    `);
  dmChannel.send(submissionPreviewEmbed);
  let previewAttachments = JSON.parse(
    previewSubmission.attachments
  );

  previewAttachments.forEach((attachment) => {
    dmChannel.send(attachment);
  });

  const filter = (m) => m.author.id === dmChannel.recipient.id;
  const reviewCollector = new Discord.MessageCollector(
    dmchannel,
    filter
  );

  reviewCollector.on("collect", (reviewAnswer) => {
    if (reviewAnswer.m.content.toLowerCase() === "yes") {
    } else if (reviewAnswer.m.content.toLowerCase() === "no") {
    } else {
    }
  })

  reviewCollector.on("end", (collected) => {
    console.log("Review Collector stopped")
  })
}

const userSubmissionMenu = async (dmChannel) => {
  const menuStartEmbed = new Discord.MessageEmbed()
    .setColor("#db48cf")
    .setTitle("Welcome back!").setDescription(`
      I see you have pervious submissions, awesome!
      
      What would you like to do?

      Reply with either "edit" or "new"
      `);
  dmChannel.send(menuStartEmbed);

  const filter = (m) => m.author.id === dmChannel.recipient.id;
  const replyCollector = new Discord.MessageCollector(
    dmChannel,
    filter,
  );

  replyCollector.on("collect", async (m) => {
    console.log(`Collected ${m.content}`);
    if (m.content === "new") {
      newSubmissionStart(dmchannel)
      replyCollector.stop()
    } else if (m.content === "edit") {
      editSubmission(dmChannel)
      replyCollector.stop()
    } else {
      dmchannel.send('Please either reply with "edit" or "new"')
    }
  });

  replyCollector.on("end", (collected) => {
    console.log("submission menu reply Description");
  });
}

const editSubmission = async (dmChannel) => {
  const submissions = await Submission.find({
    user: dmChannel.recipient.id
  })

  let userSubmissionsText = ""

  submissions.forEach(sub => {
    userSubmissionsText += `${sub.week}: ${sub.description.slice(0, 20)}...\n`
  })

  const editMenuEmbed = new Discord.MessageEmbed()
    .setColor("#db48cf")
    .setTitle(`Edit Menu`)
    .setDescription(`
    Which submission did you want to edit?
    Reply with which week you want to edit

    Week: Description
    ${userSubmissionsText}

    `);
  dmChannel.send(editMenuEmbed);
  let previewAttachments = JSON.parse(
    previewSubmission.attachments
  );

  previewAttachments.forEach((attachment) => {
    dmChannel.send(attachment);
  });

  const filter = (m) => m.author.id === dmChannel.recipient.id;
  const reviewCollector = new Discord.MessageCollector(
    dmchannel,
    filter
  );

  reviewCollector.on("collect", (reviewAnswer) => {
    if (reviewAnswer.m.content.toLowerCase() === "yes") {
    } else if (reviewAnswer.m.content.toLowerCase() === "no") {
    } else {
    }
  })

  reviewCollector.on("end", (collected) => {
    console.log("Review Collector stopped")
  })
}


module.exports = {
  newSubmissionStart: newSubmissionStart,
  collectFiles: collectFiles,
  reviewSubmission: reviewSubmission,
  userSubmissionMenu: userSubmissionMenu,
  editSubmission: editSubmission
}