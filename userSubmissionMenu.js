const newSubmissionStart = require("./newSubmissionStart")
const editSubmission = require("./editSubmission")

module.exports = async (message) => {
    const menuStartEmbed = Discord.MessageEmbed()
      .setColor("#db48cf")
      .setTitle("Welcome back!").setDescription(`
      I see you have pervious submissions, awesome!
      
      What would you like to do?

      Reply with either "edit" or "new"
      `);
    dmchannel.send(menuStartEmbed);

    const filter = (m) => m.author.id === message.author.id;
    const replyCollector = new Discord.MessageCollector(
      dmchannel,
      filter,
    );

    replyCollector.on("collect", async (m) => {
      console.log(`Collected ${m.content}`);
      if (m.content === "new") {
        newSubmissionStart(dmchannel)
        replyCollector.stop()
      } else if(m.content === "edit") {
        editSubmission(dmChannel)
        replyCollector.stop()
      } else {
        dmchannel.send('Please either reply with "edit" or "new"')
      }
    });

    replyCollector.on("end", (collected) => {
      console.log("submission menu reply Description");
    });
};
