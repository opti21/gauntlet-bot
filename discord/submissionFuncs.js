const Discord = require("discord.js");
const Submission = require("./Models/Submissions");
const GauntletWeeks = require("./Models/GauntletWeeks");

const SUBMISSION_CHANNEL = process.env.SUBMISSION_CHANNEL;

const newSubmissionStart = async (dmChannel, dClient) => {
  // console.log(dmChannel);
  const submitEmbed = new Discord.MessageEmbed()
    .setColor("#db48cf")
    .setTitle(`New Gauntlet submission`).setDescription(`
            Type out your description for your submission then send it

            also be sure to place any links here as well

            If discord can handle the file size of your project then you can upload them on the next step`);
  dmChannel.send(submitEmbed);

  let gauntletInfo = await GauntletWeeks.findOne({ active: true });

  // console.log(dmChannel.recipient.avatarURL())

  let newSubmission = new Submission({
    locked: false,
    editing: true,
    user: dmChannel.recipient.id,
    user_pic: dmChannel.recipient.avatarURL({ format: "png", dynamic: true }),
    username: dmChannel.recipient.username,
    week: gauntletInfo.week,
  });
  newSubmission.save();

  const filter = (m) => m.author.id === dmChannel.recipient.id;
  const descriptionCollector = new Discord.MessageCollector(
    dmChannel,
    filter,
    {}
  );

  descriptionCollector.on("collect", async (m) => {
    if (m.content.length > 0) {
      console.log(`Collected ${m.content}`);
      await Submission.updateOne(
        { user: m.author.id, editing: true },
        {
          description: m.content,
        }
      );
      descriptionCollector.stop();
    } else {
      m.reply("No text detected please enter text to continue").then((m) => {
        m.delete({ timeout: 5000 });
      });
    }
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
        collectFiles(dmChannel, dClient);
        fileQuestionCollector.stop();
      } else if (m.content.toLowerCase() === "no") {
        reviewSubmission(dmChannel, dClient);
        fileQuestionCollector.stop();
      } else {
        m.reply(`Please reply with "yes" or "no"`).then((m) => {
          m.delete({ timeout: 5000 });
        });
      }
    });
  });
};

const collectFiles = async (dmChannel, dClient) => {
  const fileInstructionEmbed = new Discord.MessageEmbed()
    .setColor("#db48cf")
    .setTitle(`Upload files`)
    .setDescription(
      'Upload your files here.\n when you are done adding files send **"done"**'
    );
  dmChannel.send(fileInstructionEmbed);

  const filter = (m) => m.author.id === dmChannel.recipient.id;
  const fileCollector = new Discord.MessageCollector(dmChannel, filter);

  fileCollector.on("collect", async (fileM) => {
    if (fileM.content.toLowerCase() != "done") {
      let submission = await Submission.findOne({
        user: dmChannel.recipient.id,
        editing: true,
      });
      let attachmentsArray = JSON.parse(submission.attachments);

      // console.log(fileM.attachments.size)
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
        fileM
          .reply(
            `Please either upload a file or send "done" if you are finished uploading`
          )
          .then((m) => {
            m.delete({ timeout: 5000 });
          });
      }
    } else {
      // User is done uploading files
      reviewSubmission(dmChannel, dClient);
      fileCollector.stop();
    }
  });

  // fileCollector.on("end", (collected) => {
  //   console.log(`Collected ${collected.size} files`)
  // })
};

// Review and/or Submit submission
const reviewSubmission = async (dmChannel, dClient) => {
  let previewSubmission = await Submission.findOne({
    user: dmChannel.recipient.id,
    editing: true,
  });

  const submissionPreviewEmbed = new Discord.MessageEmbed()
    .setColor("#db48cf")
    .setTitle(`Review Submission`).setDescription(`
      Does your submission look good? 
      Ready to submit it?

      Reply "yes" or "no"

      If you had any files they are above
      **Description:** 
      ${previewSubmission.description}
    `);
  let previewAttachments = JSON.parse(previewSubmission.attachments);

  previewAttachments.forEach((attachment) => {
    dmChannel.send(attachment);
  });

  dmChannel.send(submissionPreviewEmbed);

  const filter = (m) => m.author.id === dmChannel.recipient.id;
  const reviewCollector = new Discord.MessageCollector(dmChannel, filter);

  reviewCollector.on("collect", async (reviewAnswer) => {
    if (reviewAnswer.content.toLowerCase() === "yes") {
      let submittedDoc = await Submission.findOneAndUpdate(
        { user: dmChannel.recipient.id, editing: true },
        {
          editing: false,
          submitted: true,
        },
        { new: true }
      ).then((doc) => {
        return doc;
      });

      console.log(submittedDoc);

      postToDiscord(submittedDoc, dClient);

      const submitEmbed = new Discord.MessageEmbed()
        .setColor("#00fa6c")
        .setTitle(`Submitted!`).setDescription(`
        Thank you for your submission!

        Be sure to watch the stream Sunday night
        to see your submission reviewed by Billy :D
        `);
      dmChannel.send(submitEmbed);
      reviewCollector.stop();
    } else if (reviewAnswer.content.toLowerCase() === "no") {
      // TODO
      editSubmission(dmChannel, dClient);
      reviewCollector.stop();
    } else {
      reviewAnswer.reply(`Please respond with yes or no`).then((m) => {
        m.delete({ timeout: 5000 });
      });
    }
  });

  reviewCollector.on("end", (collected) => {
    console.log("Review Collector stopped");
  });
};

const returningUserMenu = async (dmChannel, dClient) => {
  const menuStartEmbed = new Discord.MessageEmbed()
    .setColor("#db48cf")
    .setTitle("Welcome back!").setDescription(`
      I see you have previous submissions, awesome!
      
      What would you like to do?

      Options:
        - submit
        - edit
        - delete
        - cancel
      `);
  dmChannel.send(menuStartEmbed);

  const filter = (m) => m.author.id === dmChannel.recipient.id;
  const menuStartReplyCollector = new Discord.MessageCollector(
    dmChannel,
    filter
  );

  menuStartReplyCollector.on("collect", async (menuReplyMessage) => {
    // console.log(`Collected ${m.content}`);
    if (menuReplyMessage.content === "submit") {
      let activeWeek = await GauntletWeeks.findOne({ active: true });
      let submissionExists = await Submission.exists({
        user: dmChannel.recipient.id,
        week: activeWeek.week,
      });
      if (submissionExists) {
        // User already submitted for current week
        const submittedEmbed = new Discord.MessageEmbed()
          .setColor("#db48cf")
          .setTitle("Already Submitted").setDescription(`
          You already submitted for this week would you like to edit it?
          
          Reply with "yes" or "no"
          `);
        dmChannel.send(submittedEmbed);

        const filter = (m) => m.author.id === dmChannel.recipient.id;
        const submittedCollector = new Discord.MessageCollector(
          dmChannel,
          filter
        );

        submittedCollector.on("collect", async (submittedReply) => {
          let reply = submittedReply.content.toLowerCase();
          if (reply === "yes") {
            editSubmission(dmChannel, activeWeek.week, dClient);
            submittedCollector.stop();
          } else if (reply === "no") {
            submittedReply.reply(`Alright have a good one :)`).then((m) => {
              m.delete({ timeout: 5000 });
            });
            submittedCollector.stop();
          } else {
            submittedReply
              .reply(`Please respond with "yes", "no"`)
              .then((m) => {
                m.delete({ timeout: 5000 });
              });
          }
        });
      } else {
        // User hasn't submitted for that week
        if (activeWeek.accepting_submissions) {
          newSubmissionStart(dmChannel, dClient);
        } else {
          const submissionsClosedEmbed = new Discord.MessageEmbed()
            .setColor("#ff0000")
            .setTitle("Submissions Closed").setDescription(`
          Unfortunately submissions for this week are closed
          `);

          dmChannel.send(submissionsClosedEmbed);
        }
      }
      menuStartReplyCollector.stop();
    } else if (menuReplyMessage.content === "edit") {
      editSubmissionStartMenu(dmChannel, dClient);
      menuStartReplyCollector.stop();
    } else if (menuReplyMessage.content === "delete") {
      deleteSubmissionMenu(dmChannel, dClient);
      menuStartReplyCollector.stop();
    } else if (menuReplyMessage.content === "cancel") {
      menuReplyMessage.reply(`Alrighty see ya later :)`).then((m) => {
        m.delete({ timeout: 5000 });
      });
      menuStartReplyCollector.stop();
    } else {
      menuReplyMessage
        .reply(`Please respond with "submit", "edit", "cancel"`)
        .then((m) => {
          m.delete({ timeout: 5000 });
        });
    }
  });

  menuStartReplyCollector.on("end", (collected) => {
    console.log("Start menu reply collected");
  });
};

const editSubmissionStartMenu = async (dmChannel, dClient) => {
  const submissions = await Submission.find({
    user: dmChannel.recipient.id,
  });

  let userSubmissionsText = "";

  submissions.slice(0, 5).forEach((sub) => {
    console.log(sub);
    userSubmissionsText += `${sub.week}: ${sub.description.slice(0, 50)}...\n`;
  });

  const editMenuStartEmbed = new Discord.MessageEmbed()
    .setColor("#db48cf")
    .setTitle(`Edit Menu`).setDescription(`
    Which submission did you want to edit?
    Reply with which week you want to edit

    or reply with cancel

    Only shows the 5 most recent submissions

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
      let submissionExists = await Submission.findOne({
        user: dmChannel.recipient.id,
        week: parseInt(reply.content),
      });
      if (!submissionExists) {
        // Submission doesn't exist
        reply
          .reply(
            "A submission for that week does not exist\n\nPlease pick a week you already have a submission for"
          )
          .then((m) => {
            m.delete({ timeout: 5000 });
          });
      } else {
        // Submission exists
        editSubmission(dmChannel, parseInt(reply.content), dClient);
        editMenuStartReplyCollector.stop();
      }
    } else if (reply.content.toLowerCase() === "cancel") {
      reply.reply("Edit cancelled :)").then((m) => {
        m.delete({ timeout: 5000 });
      });
      editMenuStartReplyCollector.stop();
    } else {
      reply
        .reply(
          "Please only respond with a number of the week you want to edit or cancel"
        )
        .then((m) => {
          m.delete({ timeout: 5000 });
        });
    }
  });

  editMenuStartReplyCollector.on("end", (collected) => {
    console.log("Edit Menu Start Collector stopped");
  });
};

const editSubmission = async (dmChannel, week, dClient) => {
  let submission;
  if (week) {
    console.log("week provided");
    submission = await Submission.findOne({
      user: dmChannel.recipient.id,
      week: week,
    });
  } else {
    console.log("week not provided");
    submission = await Submission.findOne({
      user: dmChannel.recipient.id,
      editing: true,
    });
  }
  const questionEmbed = new Discord.MessageEmbed().setColor("#00fa6c")
    .setTitle(`
        What would you like to edit?
        `).setDescription(`
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
      editDescription(dmChannel, submission, dClient);
      editMenuReplyCollector.stop();
    } else if (reply.content === "files" || parseInt(reply.content) === 2) {
      editFiles(dmChannel, submission, dClient);
      editMenuReplyCollector.stop();
    } else if (reply.content === "cancel" || parseInt(reply.content) === 3) {
      reply.reply(`Edit cancelled have a great day :)`).then((m) => {
        m.delete({ timeout: 5000 });
      });
      editMenuReplyCollector.stop();
    } else {
      reply
        .reply(
          `Please respond with a number, "description", "files", or "cancel"`
        )
        .then((m) => {
          m.delete({ timeout: 5000 });
        });
    }
  });

  editMenuReplyCollector.on("end", (collected) => {
    console.log("'Currently editing' Edit menu collector ended");
  });
};

const editDescription = async (dmChannel, submission, dClient) => {
  const instructionEmbed = new Discord.MessageEmbed()
    .setColor("#db48cf")
    .setTitle(`New Description`)
    .setDescription(`Reply with what you want the new description to be`);
  dmChannel.send(instructionEmbed);

  const filter = (m) => m.author.id === dmChannel.recipient.id;
  const descriptionCollector = new Discord.MessageCollector(dmChannel, filter, {
    max: 1,
  });

  descriptionCollector.on("collect", async (reply) => {
    try {
      Submission.findOneAndUpdate(
        { user: dmChannel.recipient.id, week: submission.week },
        { description: reply.content, editing: true },
        { new: true, useFindAndModify: false },
        (err, newDoc) => {
          console.log(newDoc);
          if (newDoc.submitted) {
            // Submission has already been submitted
            const submitEmbed = new Discord.MessageEmbed()
              .setColor("#00fa6c")
              .setTitle(`Descrption updated`);

            editDiscordMessage(newDoc, dClient);

            dmChannel.send(submitEmbed);
          } else {
            // Submission has not been submitted yet
            reviewSubmission(dmChannel, dClient);
          }
        }
      );
    } catch (e) {
      console.error(e);
    }
  });

  descriptionCollector.on("end", (collected) => {
    console.log("Descrption collecter ended");
  });
};

const postToDiscord = async (doc, dClient) => {
  let attachments = JSON.parse(doc.attachments);

  let fileStr = "";

  if (attachments.length > 0) {
    attachments.forEach((file) => {
      fileStr += `${file}\n`;
    });
  }

  let submissionChannel = await dClient.channels.fetch(SUBMISSION_CHANNEL);
  const submissionEmbed = new Discord.MessageEmbed()
    .setColor("#db48cf")
    .setTitle(`${doc.username}'s week ${doc.week} submission`).setDescription(`
    **Description:** ${doc.description}

    ${fileStr}
    `);

  submissionChannel.send(submissionEmbed).then(async (msg) => {
    console.log(msg.id);
    await Submission.findByIdAndUpdate(
      doc._id,
      {
        discord_message: msg.id,
      },
      { new: true },
      (updatedDoc) => {
        return updatedDoc;
      }
    );
  });
};

const editDiscordMessage = async (doc, dClient) => {
  let attachments = JSON.parse(doc.attachments);

  let fileStr = "";

  if (attachments.length > 0) {
    attachments.forEach((file) => {
      fileStr += `${file}\n`;
    });
  }

  const updatedEmbed = new Discord.MessageEmbed()
    .setColor("#db48cf")
    .setTitle(`${doc.username}'s week ${doc.week} submission`).setDescription(`
    **Description:** ${doc.description}

    ${fileStr}
    `);

  let submissionChannel = await dClient.channels.fetch(SUBMISSION_CHANNEL);
  let oldMessage = await submissionChannel.messages.fetch(doc.discord_message);
  oldMessage.edit(updatedEmbed).then((res) => {
    console.log("Message updated");
  });
};

const editFiles = async (dmChannel, submission, dClient) => {
  // Clear Files first
  await Submission.updateOne(
    { user: dmChannel.recipient.id, week: submission.week },
    {
      editing: true,
      attachments: "[]",
    }
  );
  const fileInstructionEmbed = new Discord.MessageEmbed()
    .setColor("#db48cf")
    .setTitle(`Upload files`)
    .setDescription(
      'Upload your new files here.\n when you are done adding files send **"done"**'
    );
  dmChannel.send(fileInstructionEmbed);

  const filter = (m) => m.author.id === dmChannel.recipient.id;
  const fileCollector = new Discord.MessageCollector(dmChannel, filter);

  fileCollector.on("collect", async (fileM) => {
    if (fileM.content.toLowerCase() != "done") {
      let submission = await Submission.findOne({
        user: dmChannel.recipient.id,
        editing: true,
      });
      let attachmentsArray = JSON.parse(submission.attachments);

      console.log(fileM.attachments.size);
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
        fileM
          .reply(
            `Please either upload a file or send "done" if you are finished uploading`
          )
          .then((m) => {
            m.delete({ timeout: 5000 });
          });
      }
    } else {
      // User is done uploading files
      let submission = Submission.findOne({
        user: dmChannel.recipient.id,
        editing: true,
      });
      if (submission.submitted) {
        editDiscordMessage(submission, dClient);
        const doneEmbed = new Discord.MessageEmbed()
          .setColor("#00fa6c")
          .setTitle(`Files updated`);
        dmChannel.send(doneEmbed);

        fileCollector.stop();
      } else {
        reviewSubmission(dmChannel, dClient);
        fileCollector.stop();
      }
    }
  });

  // fileCollector.on("end", (collected) => {
  //   console.log(`Collected ${collected.size} files`)
  // })
};

const deleteSubmissionMenu = async (dmChannel, dClient) => {
  const submissions = await Submission.find({
    user: dmChannel.recipient.id,
  });

  let userSubmissionsText = "";

  submissions.slice(0, 5).forEach((sub) => {
    console.log(sub);
    userSubmissionsText += `${sub.week}: ${sub.description.slice(0, 50)}...\n`;
  });

  const deleteInstructionEmbed = new Discord.MessageEmbed()
    .setColor("#db48cf")
    .setTitle(`Delete Submission`).setDescription(`
      Which week did you want to delete?

      ${userSubmissionsText}
    `);
  dmChannel.send(deleteInstructionEmbed);

  const filter = (m) => m.author.id === dmChannel.recipient.id;
  const deleteMenuCollector = new Discord.MessageCollector(dmChannel, filter);

  deleteMenuCollector.on("collect", async (reply) => {
    if (isNum(reply.content)) {
      let submission = await Submission.find({
        user: dmChannel.recipient.id,
        week: parseInt(reply.content),
      });

      if (submission.length > 0) {
        deleteSubmission(dmChannel, dClient, submission[0]);
        deleteMenuCollector.stop();
      } else {
        reply
          .reply("Submission doesn't exist please pick an existing Submission")
          .then((m) => {
            m.delete({ timeout: 5000 });
          });
      }
    } else if (reply.content.toLowerCase() === "cancel") {
      reply.reply("Alrighty have see you around :)");
      deleteMenuCollector.stop();
    } else {
      reply.reply('Please respond with a week number or "cancel"').then((m) => {
        m.delete({ timeout: 5000 });
      });
    }
  });
};

const deleteSubmission = async (dmChannel, dClient, submission) => {
  const confirmEmbed = new Discord.MessageEmbed()
    .setColor("#f00000")
    .setTitle(`Delete Submission`).setDescription(`
    **Are you sure you want to delete this Submission?**
    🔴🔴**THIS CANNOT BE UNDONE**🔴🔴

    **Week:** ${submission.week}
    **Description:**
    ${submission.description}
    `);
  dmChannel.send(confirmEmbed);

  const filter = (m) => m.author.id === dmChannel.recipient.id;
  const confirmCollector = new Discord.MessageCollector(dmChannel, filter);

  confirmCollector.on("collect", async (reply) => {
    let answer = reply.content.toLowerCase();
    if (answer === "yes") {
      let submissionChannel = await dClient.channels.fetch(SUBMISSION_CHANNEL);
      let oldMessage = await submissionChannel.messages.fetch(
        submission.discord_message
      );

      oldMessage
        .delete()
        .then((res) => {
          console.log("Message Deleted");
        })
        .catch((err) => {
          console.error(err);
        });

      Submission.findByIdAndDelete(submission._id)
        .then((res) => {
          console.log("Document Deleted");
        })
        .catch((err) => {
          console.error(err);
        });

      const deleteFinishedEmbed = new Discord.MessageEmbed()
        .setColor("#00fa6c")
        .setTitle(`Submission Deleted`);
      dmChannel.send(deleteFinishedEmbed);
    } else if (answer === "no") {
      reply.reply("Delete canceled").then((m) => {
        m.delete({ timeout: 5000 });
      });
    } else {
      reply.reply('Please respond with "yes" or "no"').then((m) => {
        m.delete({ timeout: 5000 });
      });
    }
  });
};

const isNum = (string) => {
  let isNumFunc = /^\d+$/.test(string);
  return isNumFunc;
};

module.exports = {
  newSubmissionStart: newSubmissionStart,
  collectFiles: collectFiles,
  reviewSubmission: reviewSubmission,
  returningUserMenu: returningUserMenu,
  editSubmissionStartMenu: editSubmissionStartMenu,
  editSubmission: editSubmission,
};
