const Discord = require("discord.js");
const Submission = require("./models/submissions");
const GauntletWeeks = require("./Models/GauntletWeeks")
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

  let gauntletInfo = await GauntletWeeks.findOne({ active: true })

  console.log(dmChannel.recipient.avatarURL())

  let newSubmission = new Submission({
    locked: false,
    editing: true,
    user: dmChannel.recipient.id,
    user_pic: dmChannel.recipient.avatarURL({ format: "png", dynamic: true }),
    username: dmChannel.recipient.username,
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

  reviewCollector.on("collect", async (reviewAnswer) => {
    if (reviewAnswer.content.toLowerCase() === "yes") {
      await Submission.updateOne({ user: dmChannel.recipient.id, editing: true }, {
        editing: false,
        submitted: true
      })
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
      editSubmission(dmChannel)
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

      Reply with either "submit" or "edit"
      `);
  dmChannel.send(menuStartEmbed);

  const filter = (m) => m.author.id === dmChannel.recipient.id;
  const menuStartReplyCollector = new Discord.MessageCollector(
    dmChannel,
    filter,
  );

  menuStartReplyCollector.on("collect", async (menuReplyMessage) => {
    // console.log(`Collected ${m.content}`);
    if (menuReplyMessage.content === "submit") {
      let activeWeek = await GauntletWeeks.findOne({ active: true })
      let submissionExists = await Submission.exists({ user: dmChannel.recipient.id, week: activeWeek.week })
      if (submissionExists) {

        const submittedEmbed = new Discord.MessageEmbed()
          .setColor("#db48cf")
          .setTitle("Already Submitted")
          .setDescription(`
          You already submitted for this week would you like to edit it?
          
          Reply with "yes" or "no"
          `);
        dmChannel.send(submittedEmbed);

        const filter = (m) => m.author.id === dmChannel.recipient.id;
        const submittedCollector = new Discord.MessageCollector(
          dmChannel,
          filter,
        );

        submittedCollector.on("collect", async (submittedReply) => {
          let reply = submittedReply.content.toLowerCase()
          if (reply === "yes") {
            editSubmission(dmChannel, activeWeek.week)
            submittedCollector.stop()
          } else if (reply === "no") {
            submittedReply.reply(`Alright have a good one :)`)
              .then(m => { m.delete({ timeout: 5000 }) })
            submittedCollector.stop()
          } else {
            submittedReply.reply(`Please respond with "yes", "no"`)
              .then(m => { m.delete({ timeout: 5000 }) })

          }
        })

      } else {
        newSubmissionStart(dmChannel)
      }
      menuStartReplyCollector.stop()
    } else if (menuReplyMessage.content === "edit") {
      editSubmissionStartMenu(dmChannel)
      menuStartReplyCollector.stop()
    } else {
      menuReplyMessage.reply(`Please respond with "submit" or "new"`)
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
    userSubmissionsText += `${sub.week}: ${sub.description.slice(0, 50)}...\n`
  })

  const editMenuStartEmbed = new Discord.MessageEmbed()
    .setColor("#db48cf")
    .setTitle(`Edit Menu`)
    .setDescription(`
    Which submission did you want to edit?
    Reply with which week you want to edit

    or reply with cancel

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
      // Reply is a number
      let submissionExists = await Submission.findOne({ user: dmChannel.recipient.id, week: parseInt(reply.content) })
      if (!submissionExists) {
        // Submission doesn't exist
        reply.reply("A submission for that week does not exist\n\nPlease pick a week you already have a submission for")
          .then(m => { m.delete({ timeout: 5000 }) })
      } else {
        // Submission exists
        editSubmission(dmChannel, parseInt(reply.content))
        editMenuStartReplyCollector.stop()
      }
    } else if (reply.content.toLowerCase() === "cancel") {
      reply.reply("Edit cancelled :)")
        .then(m => { m.delete({ timeout: 5000 }) })
      editMenuStartReplyCollector.stop()
    } else {
      reply.reply("Please only respond with a number of the week you want to edit or cancel")
        .then(m => { m.delete({ timeout: 5000 }) })
    }
  })

  editMenuStartReplyCollector.on("end", (collected) => {
    console.log("Edit Menu Start Collector stopped")
  })
}

const editSubmission = async (dmChannel, week) => {
  let submission
  if (week) {
    console.log("week provided")
    submission = await Submission.findOne({ user: dmChannel.recipient.id, week: week })
  } else {
    console.log("week not provided")
    submission = await Submission.findOne({ user: dmChannel.recipient.id, editing: true })
  }
  const questionEmbed = new Discord.MessageEmbed()
    .setColor("#00fa6c")
    .setTitle(`
        What would you like to edit?
        `)
    .setDescription(`
        1: Description
        2: Files (This will clear current files)
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
      Submission.findOneAndUpdate({ user: dmChannel.recipient.id, week: submission.week },
        { description: reply.content, editing: true },
        { new: true, useFindAndModify: false }, (err, newDoc) => {
          console.log(newDoc)
          if (newDoc.submitted) {
            // Submission has already been submitted
            const submitEmbed = new Discord.MessageEmbed()
              .setColor("#00fa6c")
              .setTitle(`Descrption updated`)
            dmChannel.send(submitEmbed);
          } else {
            // Submission has not been submitted yet
            reviewSubmission(dmChannel)
          }
        })
    } catch (e) {
      console.error(e)
    }
  })

  descriptionCollector.on("end", (collected) => {
    console.log("Descrption collecter ended")
  })

}

const editFiles = async (dmChannel, submission) => {
  // Clear Files first
  await Submission.updateOne({ user: dmChannel.recipient.id, week: submission.week }, {
    editing: true,
    attachments: "[]"
  })
  const fileInstructionEmbed = new Discord.MessageEmbed()
    .setColor("#db48cf")
    .setTitle(`Upload files`)
    .setDescription(
      'Upload your new files here.\n when you are done adding files send **"done"**'
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
      let submission = Submission.findOne({ user: dmChannel.recipient.id, editing: true })
      if (submission.submitted) {
        const doneEmbed = new Discord.MessageEmbed()
          .setColor("#00fa6c")
          .setTitle(`Files updated`)
        dmChannel.send(doneEmbed);
        fileCollector.stop()
      } else {
        reviewSubmission(dmChannel)
        fileCollector.stop()
      }
    }
  })

  fileCollector.on("end", (collected) => {
    console.log(`Collected ${collected.size} files`)
  })

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