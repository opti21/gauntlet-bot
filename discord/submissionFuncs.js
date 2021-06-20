const Discord = require("discord.js");
const { prisma } = require("./util/prisma");

const SUBMISSION_CHANNEL = process.env.SUBMISSION_CHANNEL;
const REACTION_CHANNEL = process.env.REACTION_CHANNEL;

const newSubmissionStart = async (dmChannel, dClient) => {
  // console.log(dmChannel);
  const submitEmbed = new Discord.MessageEmbed()
    .setColor("#db48cf")
    .setTitle(`New Gauntlet submission`).setDescription(`
            Type out your description for your submission then send it

            also be sure to place any links here as well

            If discord can handle the file size of your project then you can upload them on the next step`);
  dmChannel.send(submitEmbed);

  const gauntletInfo = await prisma.gauntlet_weeks.findFirst({
    where: { active: true },
  });

  // console.log(dmChannel.recipient.avatarURL())

  const filter = (m) => m.author.id === dmChannel.recipient.id;
  const descriptionCollector = new Discord.MessageCollector(
    dmChannel,
    filter,
    {}
  );

  descriptionCollector.on("collect", async (m) => {
    if (m.content.length > 0) {
      console.log(`Collected ${m.content}`);
      const newSubmission = await prisma.submissions
        .create({
          data: {
            user: dmChannel.recipient.id,
            gauntlet_week: gauntletInfo.week,
            description: m.content,
          },
        })
        .catch((e) => {
          console.error(e);
        });

      await prisma.users
        .update({
          where: { id: dmChannel.recipient.id },
          data: {
            currently_editing: newSubmission.id,
          },
        })
        .catch((e) => {
          console.error(e);
        });

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
    console.log(fileM);
    if (fileM.content.toLowerCase() != "done") {
      // console.log(fileM.attachments.size)
      if (fileM.attachments.size > 0) {
        // There are attachments in this message

        const user = await getUser(dmChannel.recipient.id);
        // @typedef String
        const attachment = fileM.attachments.first().url;

        const isImage =
          /^(?:(?<scheme>[^:\/?#]+):)?(?:\/\/(?<authority>[^\/?#]*))?(?<path>[^?#]*\/)?(?<file>[^?#]*\.(?<extension>[Jj][Pp][Ee]?[Gg]|[Pp][Nn][Gg]|[Gg][Ii][Ff]))(?:\?(?<query>[^#]*))?(?:#(?<fragment>.*))?$/gm.test(
            attachment
          );

        const filenameRegex = /(?=\w+\.\w{3,4}$).+/gim;
        const filename = attachment.match(filenameRegex)[0];

        if (isImage) {
          const imageObj = JSON.stringify({
            type: "image",
            url: attachment,
            filename: filename,
          });
          await prisma.submissions
            .update({
              where: {
                id: user.currently_editing,
              },
              data: {
                images: {
                  push: imageObj,
                },
              },
            })
            .catch((e) => {
              console.error(e);
            });
        } else {
          const fileObj = JSON.stringify({
            type: "file",
            url: attachment,
            filename: filename,
          });
          await prisma.submissions
            .update({
              where: {
                id: user.currently_editing,
              },
              data: {
                files: {
                  push: fileObj,
                },
              },
            })
            .catch((e) => {
              console.error(e);
            });
        }
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
  const user = await getUser(dmChannel.recipient.id);
  const previewSubmission = await prisma.submissions.findUnique({
    where: {
      id: user.currently_editing,
    },
  });

  let uploadedFiles = "";

  previewSubmission.files.forEach((file) => {
    const fileObj = JSON.parse(file);

    uploadedFiles += `${fileObj.filename}\n`;
  });

  const submissionPreviewEmbed = new Discord.MessageEmbed()
    .setColor("#db48cf")
    .setTitle(`Review Submission`).setDescription(`
      Does your submission look good? 
      Ready to submit it?

      Reply "yes" or "no"

      If you had any images they are shown above
      **Other types of file uploaded:**
      ${uploadedFiles}
      **Description:** 
      ${previewSubmission.description}
    `);

  previewSubmission.images.forEach((image) => {
    const imageObj = JSON.parse(image);
    dmChannel.send(imageObj.url);
  });

  dmChannel.send(submissionPreviewEmbed);

  const filter = (m) => m.author.id === dmChannel.recipient.id;
  const reviewCollector = new Discord.MessageCollector(dmChannel, filter);

  reviewCollector.on("collect", async (reviewAnswer) => {
    if (reviewAnswer.content.toLowerCase() === "yes") {
      const submittedDoc = await prisma.submissions
        .update({
          where: { id: user.currently_editing },
          data: { submitted: true },
        })
        .catch((e) => {
          console.error(e);
        });

      await prisma.users.update({
        where: { id: user.id },
        data: {
          currently_editing: null,
        },
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
      editSubmission(dmChannel, previewSubmission.week, dClient);
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
    if (menuReplyMessage.content.toLowerCase() === "submit") {
      const activeWeek = await prisma.gauntlet_weeks.findFirst({
        where: { active: true },
      });
      const submissionExists = await prisma.submissions.findFirst({
        where: {
          user: dmChannel.recipient.id,
          gauntlet_week: activeWeek.week,
        },
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
    } else if (menuReplyMessage.content.toLowerCase() === "edit") {
      editSubmissionStartMenu(dmChannel, dClient);
      menuStartReplyCollector.stop();
    } else if (menuReplyMessage.content.toLowerCase() === "delete") {
      deleteSubmissionMenu(dmChannel, dClient);
      menuStartReplyCollector.stop();
    } else if (menuReplyMessage.content.toLowerCase() === "cancel") {
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
  const submissions = await prisma.submissions
    .findMany({
      where: { user: dmChannel.recipient.id },
    })
    .catch((e) => {
      console.error(e);
    });

  let userSubmissionsText = "";

  submissions.slice(0, 6).forEach((sub) => {
    console.log(sub);
    userSubmissionsText += `${sub.gauntlet_week}: ${sub.description.slice(
      0,
      50
    )}...\n`;
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
      const submissionExists = await prisma.submissions.findFirst({
        where: {
          user: dmChannel.recipient.id,
          gauntlet_week: parseInt(reply.content),
        },
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
  const submission = await prisma.submissions.findFirst({
    where: {
      user: dmChannel.recipient.id,
      gauntlet_week: week,
    },
  });

  // TODO: add check for actual number provided for week
  // Send response if not or error
  const questionEmbed = new Discord.MessageEmbed()
    .setColor("#00fa6c")
    .setTitle(`What would you like to edit?`).setDescription(`
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
    if (
      reply.content.toLowerCase() === "descrpition" ||
      parseInt(reply.content) === 1
    ) {
      editDescription(dmChannel, submission, dClient);
      editMenuReplyCollector.stop();
    } else if (
      reply.content.toLowerCase() === "files" ||
      parseInt(reply.content) === 2
    ) {
      editFiles(dmChannel, submission, dClient);
      editMenuReplyCollector.stop();
    } else if (
      reply.content.toLowerCase() === "cancel" ||
      parseInt(reply.content) === 3
    ) {
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
    const newDoc = await prisma.submissions
      .update({
        where: { id: submission.id },
        data: { description: reply.content },
      })
      .catch((e) => {
        console.error(e);
      });

    await prisma.users
      .update({
        where: { id: submission.user },
        data: {
          currently_editing: submission.id,
        },
      })
      .catch((e) => {
        console.error(e);
      });

    if (newDoc.submitted) {
      // Submission has already been submitted
      const submitEmbed = new Discord.MessageEmbed()
        .setColor("#00fa6c")
        .setTitle(`Descrption updated`);

      await prisma.users
        .update({
          where: { id: submission.user },
          data: {
            currently_editing: null,
          },
        })
        .catch((e) => {
          console.error(e);
        });

      editDiscordMessage(newDoc, dClient);

      dmChannel.send(submitEmbed);
    } else {
      // Submission has not been submitted yet
      reviewSubmission(dmChannel, dClient);
    }
  });

  descriptionCollector.on("end", (collected) => {
    console.log("Descrption collecter ended");
  });
};

const postToDiscord = async (doc, dClient) => {
  const attachments = doc.attachments;

  const user = await getUser(doc.user);

  let fileStr = "";

  if (attachments.length > 0) {
    attachments.forEach((file) => {
      fileStr += `${file}\n`;
    });
  }

  let submissionChannel = await dClient.channels.fetch(SUBMISSION_CHANNEL);
  let reactionChannel = await dClient.channels.fetch(REACTION_CHANNEL);

  const submissionEmbed = new Discord.MessageEmbed()
    .setColor("#db48cf")
    .setTitle(`${user.username}'s week ${doc.gauntlet_week} submission`)
    .setDescription(`
    **Description:** ${doc.description}

    ${fileStr}
    `);

  submissionChannel.send(submissionEmbed).then(async (msg) => {
    console.log(msg.id);
    await prisma.submissions
      .update({
        where: {
          id: doc.id,
        },
        data: { discord_message: msg.id },
      })
      .catch((e) => {
        console.error(e);
      });
  });

  reactionChannel.send(submissionEmbed).then(async (msg) => {
    console.log(msg.id);
    await prisma.submissions
      .update({
        where: {
          id: doc.id,
        },
        data: { react_discord_message: msg.id },
      })
      .catch((e) => {
        console.error(e);
      });
  });
};

const editDiscordMessage = async (doc, dClient) => {
  const submission = await prisma.submissions.findFirst({
    where: { id: doc.id },
  });
  const attachments = submission.attachments;
  const user = await getUser(submission.user);
  console.log(attachments);

  let fileStr = "";

  if (attachments.length > 0) {
    attachments.forEach((file) => {
      fileStr += `${file}\n`;
    });
  }

  const updatedEmbed = new Discord.MessageEmbed()
    .setColor("#db48cf")
    .setTitle(`${user.username}'s week ${submission.gauntlet_week} submission`)
    .setDescription(`
    **Description:** ${submission.description}

    ${fileStr}
    `);

  let submissionChannel = await dClient.channels.fetch(SUBMISSION_CHANNEL);
  let reactionChannel = await dClient.channels.fetch(REACTION_CHANNEL);

  let oldMessage = await submissionChannel.messages.fetch(doc.discord_message);

  oldMessage.edit(updatedEmbed).then((res) => {
    console.log("Message updated");
  });

  let oldReactMessage = await reactionChannel.messages.fetch(
    doc.react_discord_message
  );

  oldReactMessage.edit(updatedEmbed).then((res) => {
    console.log("Reaction Message updated");
  });
};

const editFiles = async (dmChannel, submission, dClient) => {
  // Clear Files first

  const currentSubmission = await prisma.submissions
    .update({
      where: { id: submission.id },
      data: {
        attachments: [],
      },
    })
    .catch((e) => {
      console.error(e);
    });

  await prisma.users
    .update({
      where: { id: currentSubmission.user },
      data: {
        currently_editing: currentSubmission.id,
      },
    })
    .catch((e) => {
      console.error(e);
    });

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
      console.log(fileM.attachments.size);
      if (fileM.attachments.size > 0) {
        // There are attachments in this message

        await prisma.submissions
          .update({
            where: {
              id: currentSubmission.id,
            },
            data: {
              attachments: {
                push: fileM.attachments.first().url,
              },
            },
          })
          .catch((e) => {
            console.error(e);
          });
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

      if (currentSubmission.submitted) {
        editDiscordMessage(currentSubmission, dClient);
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
  const submissions = await prisma.submissions.findMany({
    where: {
      user: dmChannel.recipient.id,
    },
  });

  let userSubmissionsText = "";

  submissions.slice(0, 5).forEach((sub) => {
    console.log(sub);
    userSubmissionsText += `${sub.gauntlet_week}: ${sub.description.slice(
      0,
      50
    )}...\n`;
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
      const submission = await prisma.submissions.findFirst({
        where: {
          user: dmChannel.recipient.id,
          gauntlet_week: parseInt(reply.content),
        },
      });

      if (submission) {
        deleteSubmission(dmChannel, dClient, submission);
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
    
    Reply with yes or no

    **Week:** ${submission.gauntlet_week}
    **Description:**
    ${submission.description}
    `);
  dmChannel.send(confirmEmbed);

  const filter = (m) => m.author.id === dmChannel.recipient.id;
  const confirmCollector = new Discord.MessageCollector(dmChannel, filter);

  confirmCollector.on("collect", async (reply) => {
    let answer = reply.content.toLowerCase();
    if (answer === "yes") {
      const submissionChannel = await dClient.channels.fetch(
        SUBMISSION_CHANNEL
      );
      const reactionChannel = await dClient.channels.fetch(REACTION_CHANNEL);

      const oldMessage = await submissionChannel.messages.fetch(
        submission.discord_message
      );

      const oldReactionMessage = await reactionChannel.messages.fetch(
        submission.react_discord_message
      );

      oldMessage
        .delete()
        .then((res) => {
          console.log("Message Deleted");
        })
        .catch((err) => {
          console.error(err);
        });

      oldReactionMessage
        .delete()
        .then((res) => {
          console.log("reaction Message Deleted");
        })
        .catch((err) => {
          console.error(err);
        });

      await prisma.users
        .update({
          where: {
            id: submission.user,
          },
          data: {
            currently_editing: null,
          },
        })
        .catch((e) => {
          console.error(e);
        });

      await prisma.submissions
        .delete({
          where: { id: submission.id },
        })
        .catch((e) => {
          console.error(e);
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

const getUser = async (id) => {
  const user = await prisma.users
    .findUnique({
      where: { id: id },
    })
    .catch((e) => {
      console.error(e);
    });

  return user;
};

module.exports = {
  newSubmissionStart: newSubmissionStart,
  collectFiles: collectFiles,
  reviewSubmission: reviewSubmission,
  returningUserMenu: returningUserMenu,
  editSubmissionStartMenu: editSubmissionStartMenu,
  editSubmission: editSubmission,
};
