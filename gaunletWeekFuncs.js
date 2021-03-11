const Discord = require("discord.js");
const GauntletWeek = require("./Models/GauntletWeeks")

const addGauntletStart = async (dmChannel) => {
    const questionEmbed = new Discord.MessageEmbed()
        .setColor("db48cf")
        .setTitle(`What week did you want to add?`)
        .setDescription(`
        Respond with a number
        or to cancel respond with "cancel"
        `);
    dmChannel.send(questionEmbed)

    const filter = (m) => m.author.id === dmChannel.recipient.id;
    const gauntletStartCollector = new Discord.MessageCollector(
        dmChannel,
        filter
    );

    gauntletStartCollector.on("collect", async (reply) => {
        console.log("isnum: " + isNum(reply.content))
        if (isNum(reply.content)) {
            // Check to see if week already exits
            let exists = await GauntletWeek.exists({
                week: parseInt(reply.content)
            })
            console.log("exists: " + exists)

            if (exists) {
                gauntletStartCollector.stop()
                const existsEmbed = new Discord.MessageEmbed()
                    .setColor("db48cf")
                    .setTitle(`Week already exists`)
                    .setDescription(`
                    A gauntlet has already been set for that week.
                    Did you want to edit it?
                    reply with yes or no
                    `);
                dmChannel.send(existsEmbed)
                const filter = (m) => m.author.id === dmChannel.recipient.id;
                const exsitsReplyCollector = new Discord.MessageCollector(
                    dmChannel,
                    filter
                );

                exsitsReplyCollector.on("collect", async (existsReply) => {
                    if (existsReply.content.toLowerCase() === "yes") {
                        editGauntletStart(dmChannel)
                    } else if (existsReply.content.toLowerCase() === "no") {
                        existsReply.reply("Action cancelled have a great day/night :)").then(msg => {
                            msg.delete({ timeout: 5000 })
                            exsitsReplyCollector.stop()
                        })
                    } else {
                        existsReply.reply("Please resond with 'yes' or 'no'").then(msg => {
                            msg.delete({ timeout: 5000 })
                        })
                    }
                })
            } else {
                gauntletStartCollector.stop()
                addGauntlet(dmChannel, parseInt(reply.content))
            }

        } else if (reply.content.toLowerCase() === "cancel") {
            reply.reply("Cancelled have a great day/night :)").then(msg => {
                msg.delete({ timeout: 5000 })
            })
            gauntletStartCollector.stop()

        } else {
            reply.reply("Please respond with a number or 'cancel'").then(msg => {
                msg.delete({ timeout: 5000 })
            })
        }
    })

}

const addGauntlet = async (dmChannel, week) => {
    let newGauntletWeek = new GauntletWeek({
        week: week,
        editing: true
    })
    newGauntletWeek.save()
    const titleEmbed = new Discord.MessageEmbed()
        .setColor("db48cf")
        .setTitle(`Gauntlet Theme`)
        .setDescription(`
        What is the new Gauntlet's Theme?
        `);
    dmChannel.send(titleEmbed)
    const filter = (m) => m.author.id === dmChannel.recipient.id;
    const themeCollector = new Discord.MessageCollector(
        dmChannel,
        filter,
        { max: 1 }
    );

    themeCollector.on("collect", async (themeReply) => {
        await GauntletWeek.updateOne({ week: week }, {
            theme: themeReply.content
        })
    })

    themeCollector.on("end", async (collected) => {
        const newDescrpitionEmbed = new Discord.MessageEmbed()
            .setColor("db48cf")
            .setTitle(`Gauntlet Description`)
            .setDescription(`
            What is the new Gauntlet's description?
            `);
        dmChannel.send(newDescrpitionEmbed)
        const filter = (m) => m.author.id === dmChannel.recipient.id;
        const descCollector = new Discord.MessageCollector(
            dmChannel,
            filter,
            { max: 1 }
        );

        descCollector.on("collect", async (descReply) => {
            await GauntletWeek.updateOne({ week: week }, {
                description: descReply.content,
                editing: false
            })
        })

        descCollector.on("end", async (collected) => {
            let createdGauntlet = await GauntletWeek.findOne({ week: week })
            const newGauntletEmbed = new Discord.MessageEmbed()
                .setColor("#2cff14")
                .setTitle(`New Gauntlet Week Created`)
                .setDescription(`
                Week: ${createdGauntlet.week},
                Theme: ${createdGauntlet.theme},
                Description: ${createdGauntlet.description}
                `);
            dmChannel.send(newGauntletEmbed)
        })

    })

}


const editGauntletStart = async (dmChannel) => {
    const startEmbed = new Discord.MessageEmbed()
        .setColor("db48cf")
        .setTitle(`Which gauntlet did you want to want to edit?`)
        .setDescription(`
        Reply with the week you want to edit.
        `);
    dmChannel.send(startEmbed)
    const filter = (m) => m.author.id === dmChannel.recipient.id;
    const editStartCollector = new Discord.MessageCollector(
        dmChannel,
        filter,
    );

    editStartCollector.on("collect", async (editStartReply) => {
        if (isNum(editStartReply.content)) {
            let exists = GauntletWeek.exists({ week: parseInt(editStartReply) })
            if (exists) {
                editGauntlet(dmChannel, parseInt(editStartReply))
                editStartCollector.stop()
            } else {
                editStartReply.reply("Week does not exist, please choose a week that exists")
                    .then(msg => { msg.delete({ timeout: 5000 }) })
            }
        } else if (editStartReply.content.toLowerCase() === "cancel") {
            editStartReply.reply("Action cancelled have a great day/night :)")
                .then(msg => { msg.delete({ timeout: 5000 }) })
            editStartCollector.stop()
        } else {
            editStartReply.reply("Please only send a number or 'cancel'")
                .then(msg => { msg.delete({ timeout: 5000 }) })
        }
    })
}

const editGauntlet = async (dmChannel, week) => {
    const startEmbed = new Discord.MessageEmbed()
        .setColor("db48cf")
        .setTitle(`What would you like to edit?`)
        .setDescription(`
        1: Theme
        2: Description
        3: cancel

        Reply with a number from above
        `);
    dmChannel.send(startEmbed)
    const filter = (m) => m.author.id === dmChannel.recipient.id;
    const editMenuCollector = new Discord.MessageCollector(
        dmChannel,
        filter,
    );

    editMenuCollector.on("collect", async (editMenuReply) => {
        if (isNum(editMenuReply.content)) {
            if (parseInt(editMenuReply.content) === 1) {
                // edit Theme
                setGauntletTheme(dmChannel, week)
            } else if (parseInt(editMenuReply.content) === 2) {
                // edit Description
                setGauntletDescription(dmChannel, week)
            } else {
                editMenuReply.reply("Please respond with 1, 2, 3")
                    .then(msg => { msg.delete({ timeout: 5000 }) })
            }
        } else {
            editMenuReply.reply("Please respond with a number only")
                .then(msg => { msg.delete({ timeout: 5000 }) })
        }
    })

}

const setGauntletTheme = async (dmChannel, week) => {
    const themeEmbed = new Discord.MessageEmbed()
        .setColor("db48cf")
        .setTitle(`Gauntlet Theme`)
        .setDescription(`
        What is the Gauntlet's theme?
        `);
    dmChannel.send(themeEmbed)
    const filter = (m) => m.author.id === dmChannel.recipient.id;
    const themeCollector = new Discord.MessageCollector(
        dmChannel,
        filter,
        { max: 1 }
    );

    themeCollector.on("collect", async (themeReply) => {
        await GauntletWeek.updateOne({ week: week }, {
            theme: themeReply.content
        })
    })

    themeCollector.on("end", (collected) => {
        const updateEmbed = new Discord.MessageEmbed()
            .setColor("#2cff14")
            .setTitle(`Theme updated`)
        dmChannel.send(updateEmbed)
    })
}

const setGauntletDescription = async (dmChannel, week) => {
    const descriptionEmbed = new Discord.MessageEmbed()
        .setColor("#db48cf")
        .setTitle(`Gauntlet Description`)
        .setDescription(`
        What is the Gauntlet's Description?
        `);
    dmChannel.send(descriptionEmbed)
    const filter = (m) => m.author.id === dmChannel.recipient.id;
    const descCollector = new Discord.MessageCollector(
        dmChannel,
        filter,
        { max: 1 }
    );

    descCollector.on("collect", async (descReply) => {
        await GauntletWeek.updateOne({ week: week }, {
            description: descReply.content
        })
    })

    descCollector.on("end", (collected) => {
        const descriptionEmbed = new Discord.MessageEmbed()
            .setColor("#2cff14")
            .setTitle(`Description updated`)
        dmChannel.send(descriptionEmbed)
    })


}


const isNum = (string) => {
    let isNumFunc = /^\d+$/.test(string);
    return isNumFunc
}

module.exports = {
    addGauntletStart,
    editGauntletStart
}