const GauntletWeek = require("./Models/GauntletWeeks")

const addGauntletStart = async (dmChannel) => {
    const questionEmbed = new Discord.MessageEmbed()
        .setColor("db48cf")
        .setTitle(`What week did you want to add?`)
        .setDescription(`
        Respond with a number
        `);
    dmChannel.send(questionEmbed)

    const filter = (m) => m.author.id === dmChannel.recipient.id;
    const responseCollector = new Discord.MessageCollector(
        dmChannel,
        filter
    );

    responseCollector.on("collect", async (reply) => {
        if (isNum(reply.content)) {
            // Check to see if week already exits
            let exists = await GauntletWeek.findOne({
                week: parseInt(reply.content)
            })

            if (!exists) {
                addGauntlet(parseInt(reply.content))
            } else {

            }

        } else {
            reply.reply("Please respond with a number").then(msg => {
                msg.delete({ timeout: 5000 })
            })
        }
    })

}

const addGauntlet = async (week) => {

}

const editGauntletStart = async (dmChannel) => {

}

const isNum = (string) => {
    let isNumFunc = /^\d+$/.test(string);
    return isNumFunc
}

module.exports = {
    addGauntletStart,
    editGauntletStart
}