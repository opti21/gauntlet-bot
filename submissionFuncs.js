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
      reviewSubmission(dmChannel)
      fileCollector.stop()
    }
  })

  fileCollector.on("end", (collected) => {
    console.log(`Collected ${collected.size} files`)
  })
}

// Review and/or Submit submission
const reviewSubmission = async (dmChannel) => {
  let previewSubmission = await Submission.findOne({
    user: dmChannel.recipient.id,
    editing: true,
  });

  const submissionPreviewEmbed = new Discord.MessageEmbed()
    .setColor("#db48cf")
    .setTitle(`Review Submission`)
    .setDescription(`
      Does your submission look good? 
      Ready to submit it?

      Reply "yes" or "no"

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
    dmChannel,
    filter
  );

  reviewCollector.on("collect", (reviewAnswer) => {
    if (reviewAnswer.content.toLowerCase() === "yes") {
      try {
        Submission.updateOne({ user: dmChannel.recipient.id, editing: true }, {
          editing: false
        })
      } catch (e) {
        console.error(e)
      }
      const submitEmbed = new Discord.MessageEmbed()
        .setColor("#00fa6c")
        .setTitle(`Submitted!`)
        .setDescription(`
        Thank you for your submission!

        Be sure to watch the stream Sunday night
        to see your submission reviewed by Billy :D
        `);
      dmChannel.send(submitEmbed);
      reviewCollector.stop()

    } else if (reviewAnswer.content.toLowerCase() === "no") {
      // TODO
      editSubmission(dmChannel, true)
      reviewCollector.stop()
    } else {
      reviewAnswer.reply(`Please respond with yes or no`)
        .then(m => { m.delete({ timeout: 5000 }) })
    }
  })

  reviewCollector.on("end", (collected) => {
    console.log("Review Collector stopped")
  })
}

const returningUserMenu = async (dmChannel) => {
  const menuStartEmbed = new Discord.MessageEmbed()
    .setColor("#db48cf")
    .setTitle("Welcome back!").setDescription(`
      I see you have pervious submissions, awesome!
      
      What would you like to do?

      Reply with either "edit" or "new"
      `);
  dmChannel.send(menuStartEmbed);

  const filter = (m) => m.author.id === dmChannel.recipient.id;
  const menuStartReplyCollector = new Discord.MessageCollector(
    dmChannel,
    filter,
  );

  menuStartReplyCollector.on("collect", async (menuReplyMessage) => {
    // console.log(`Collected ${m.content}`);
    if (menuReplyMessage.content === "new") {
      newSubmissionStart(dmChannel)
      menuStartReplyCollector.stop()
    } else if (menuReplyMessage.content === "edit") {
      editSubmissionStartMenu(dmChannel)
      menuStartReplyCollector.stop()
    } else {
      menuReplyMessage.reply(`Please respond with "edit" or "new"`)
        .then(m => { m.delete({ timeout: 5000 }) })
    }
  });

  menuStartReplyCollector.on("end", (collected) => {
    console.log("Start menu reply collected");
  });
}

const editSubmissionStartMenu = async (dmChannel) => {
  const submissions = await Submission.find({
    user: dmChannel.recipient.id
  })

  let userSubmissionsText = ""

  submissions.forEach(sub => {
    console.log(sub)
    userSubmissionsText += `${sub.week}: ${sub.description.slice(0, 20)}...\n`
  })

  const editMenuStartEmbed = new Discord.MessageEmbed()
    .setColor("#db48cf")
    .setTitle(`Edit Menu`)
    .setDescription(`
    Which submission did you want to edit?
    Reply with which week you want to edit

    Week: Description
    ${userSubmissionsText}

    `);
  dmChannel.send(editMenuStartEmbed);

  const filter = (m) => m.author.id === dmChannel.recipient.id;
  const editMenuStartReplyCollector = new Discord.MessageCollector(
    dmChannel,
    filter
  );

  editMenuStartReplyCollector.on("collect", async (reply) => {
    if (isNum(reply.content)) {
      let submissionExists = await Submission.findOne({ user: dmChannel.recipient.id, week: parseInt(reply.content) })
      if (!submissionExists) {
        reply.reply("A submission for that week does not exist\n\nPlease pick a week you already have a submission for")
          .then(m => { m.delete({ timeout: 5000 }) })
      } else {
        editSubmission(dmChannel, false, parseInt(reply.content))
        editMenuStartReplyCollector.stop()
      }
    } else {
      reply.reply("Please only respond with a number of the week you want to edit")
        .then(m => { m.delete({ timeout: 5000 }) })
    }
  })

  editMenuStartReplyCollector.on("end", (collected) => {
    console.log("Edit Menu Start Collector stopped")
  })
}

const editSubmission = async (dmChannel, editing, week) => {
  switch (editing) {
    case true: {
      // User was making a new submission but wanted to make an edit
      let submission = await Submission.findOne({ user: dmChannel.recipient.id, editing: true })
      const questionEmbed = new Discord.MessageEmbed()
        .setColor("#00fa6c")
        .setTitle(`
        What would you like to edit?
        `)
        .setDescription(`
        1: Description
        2: Files
        3: Cancel

        Reply with one of the numbers or words above
        `);
      dmChannel.send(questionEmbed);

      const filter = (m) => m.author.id === dmChannel.recipient.id;
      const editMenuReplyCollector = new Discord.MessageCollector(
        dmChannel,
        filter
      );

      editMenuReplyCollector.on("collect", (reply) => {
        if (reply.content === "descrpition" || parseInt(reply.content) === 1) {
          editDescription(dmChannel, submission)
          editMenuReplyCollector.stop()

        } else if (reply.content === "files" || parseInt(reply.content) === 2) {
          editFiles(dmChannel, submission)
          editMenuReplyCollector.stop()
        } else if (reply.content === "cancel" || parseInt(reply.content) === 3) {
          reply.reply(`Edit cancelled have a great day :)`)
            .then(m => { m.delete({ timeout: 5000 }) })
          editMenuReplyCollector.stop()
        } else {
          reply.reply(`Please respond with a number, "description", "files", or "cancel"`)
            .then(m => { m.delete({ timeout: 5000 }) })
        }
      })

      editMenuReplyCollector.on("end", (collected) => {
        console.log("'Currently editing' Edit menu collector ended")
      })
    }
      break;

    case false: {
      // User already submitted and wanted to edit it
      let submission = await Submission.findOne({ user: dmChannel.recipient.id, week: week })
      const questionEmbed = new Discord.MessageEmbed()
        .setColor("#db48cf")
        .setTitle(`What would you like to edit?`)
        .setDescription(`
        1: Description
        2: Files
        3: Cancel

        Reply with one of the numbers or words above
        `);
      dmChannel.send(questionEmbed);

      const filter = (m) => m.author.id === dmChannel.recipient.id;
      const editMenuReplyCollector = new Discord.MessageCollector(
        dmChannel,
        filter
      );

      editMenuReplyCollector.on("collect", (reply) => {
        if (reply.content === "descrpition" || parseInt(reply.content) === 1) {
          editDescription(dmChannel, submission)
          editMenuReplyCollector.stop()

        } else if (reply.content === "files" || parseInt(reply.content) === 2) {
          editFiles(dmChannel, submission)
          editMenuReplyCollector.stop()
        } else if (reply.content === "cancel" || parseInt(reply.content) === 3) {
          reply.reply(`Edit cancelled have a great day :)`)
            .then(m => { m.delete({ timeout: 5000 }) })
          editMenuReplyCollector.stop()
        } else {
          reply.reply(`Please respond with a number, "description", "files", or "cancel"`)
            .then(m => { m.delete({ timeout: 5000 }) })
        }
      })

      editMenuReplyCollector.on("end", (collected) => {
        console.log("'specific week' Edit menu collector ended")
      })
    }
      break;

  }

}

const editDescription = async (dmChannel, submission) => {
  const instructionEmbed = new Discord.MessageEmbed()
    .setColor("#db48cf")
    .setTitle(`New Description`)
    .setDescription(`Reply with what you want the new description to be`);
  dmChannel.send(instructionEmbed);

  const filter = (m) => m.author.id === dmChannel.recipient.id;
  const descriptionCollector = new Discord.MessageCollector(
    dmChannel,
    filter,
    { max: 1 }
  );

  descriptionCollector.on("collect", async (reply) => {
    try {
      await Submission.updateOne({ user: dmChannel.recipient.id, week: submission.week },
        { description: reply.content, editing: true })
      reviewSubmission(dmChannel)
    } catch (e) {
      console.error(e)
    }
  })

  descriptionCollector.on("end", (collected) => {
    console.log("Descrption collecter ended")
  })




}

const editFiles = async (dmChannel, submission) => {
  try {
    // Clear Files first
    Submission.updateOne({ user: dmChannel.recipient.id, week: submission.week }, {
      editing: true,
      attachments: []
    })
    collectFiles(dmChannel)
  } catch (e) {
    console.error(e)
  }

}

const isNum = (string) => {
  let isNumFunc = /^\d+$/.test(string);
  return isNumFunc
}


module.exports = {
  newSubmissionStart: newSubmissionStart,
  collectFiles: collectFiles,
  reviewSubmission: reviewSubmission,
  returningUserMenu: returningUserMenu,
  editSubmissionStartMenu: editSubmissionStartMenu,
  editSubmission: editSubmission
}