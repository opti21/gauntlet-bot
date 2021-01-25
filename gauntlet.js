require('dotenv').config()

const mongoose = require('mongoose');
mongoose.connect(`mongodb+srv://gauntlet:${process.env.MONGO_PASS}@cluster0.9bvpn.mongodb.net/gauntlet?retryWrites=true&w=majority`,
    { useNewUrlParser: true, useUnifiedTopology: true }
)
const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function () {
    // we're connected!
    console.log('Mongoose connected')
});

const Submission = require('./models/submissions')

const Downloader = require('node-url-downloader')
const { v4: uuidv4 } = require('uuid');

const accessKeyId = process.env.WASABI_KEY;
const secretAccessKey = process.env.WASABI_SECRET;

const fs = require('fs');

const AWS = require('aws-sdk');
const util = require('util');
const readFile = util.promisify(fs.readFile)

const s3 = new AWS.S3({
    endpoint: 'https://s3.eu-central-1.wasabisys.com',
    region: 'eu-central-1',
    accessKeyId: accessKeyId,
    secretAccessKey: secretAccessKey,
});

async function uploadFile(fileLink, username) {
    let fileDownloader = new Downloader();
    fileDownloader.get(fileLink, "./files")
    fileDownloader.on('done', async (dst) => {
        console.log(dst.slice(6))
        const filename = dst.slice(6)
        const data = await readFile(dst)
        await s3.upload({
            Key: username + '_' + uuidv4(5) + '_' + filename,
            Bucket: 'gauntlet',
            Body: data,
            ACL: 'public-read'
        }).promise().then(() => {
            fs.unlink(dst, (err) => {
                if (err) console.error(err);
                console.log('File Deleted')
            })
        })
    })
}

const Discord = require('discord.js');
const dClient = new Discord.Client();

dClient.once('ready', () => {
    console.log('Discord Ready!');
});

dClient.on('message', async message => {
    const prefix = '!'

    if (!message.content.startsWith(prefix) || message.author.bot) return;

    const args = message.content.slice(prefix.length).trim().split(/ +/);
    const command = args.shift().toLowerCase();


    if (command === 'submit') {
        let userSubmissions = await Submission.find({
            user: message.author.id
        })

        if (userSubmissions.length === 0) {
            message.author.createDM().then(dmchannel => {
                const submitEmbed = new Discord.MessageEmbed()
                    .setColor('#db48cf')
                    .setTitle(`New Gauntlet submission for ${message.author.username}`)
                    .setDescription('Type out your description for your submission then send it \n also be sure to place any links here as well \n If discord can handle the file size of your project then you can upload them on the next step')
                dmchannel.send(submitEmbed)

                let newSubmission = new Submission({
                    locked: false,
                    editing: true,
                    user: message.author.id
                })
                newSubmission.save()

                const filter = m => m.author.id === message.author.id;
                const descriptionCollector = new Discord.MessageCollector(dmchannel, filter, { max: 1 });

                descriptionCollector.on('collect', async m => {
                    console.log(`Collected ${m.content}`);
                    await Submission.updateOne({ user: m.author.id, editing: true }, {
                        description: m.content
                    })
                });

                descriptionCollector.on('end', collected => {
                    console.log(`Collected Description`);

                    // Ask if user has images to upload
                    const fileQuestionEmbed = new Discord.MessageEmbed()
                        .setColor('#db48cf')
                        .setTitle(`Images?`)
                        .setDescription('Do you have any files you would like to submit? Reply "yes" or "no" \n This will be anything discord can handle \n Please do not delete the images or they will not show up correctly')
                    dmchannel.send(fileQuestionEmbed)

                    const filter = m => m.author.id === message.author.id;
                    const fileQuestionCollector = new Discord.MessageCollector(dmchannel, filter);

                    fileQuestionCollector.on('collect', async m => {
                        if (m.content.toLowerCase() === 'yes') {
                            fileQuestionCollector.stop()
                            const fileInstructionEmbed = new Discord.MessageEmbed()
                                .setColor('#db48cf')
                                .setTitle(`Upload images`)
                                .setDescription('Upload your files here, when you are done adding images send "done"')
                            dmchannel.send(fileInstructionEmbed)

                            const filter = m => m.author.id === message.author.id;
                            const fileCollector = new Discord.MessageCollector(dmchannel, filter);

                            fileCollector.on('collect', async fileM => {
                                console.log(fileM)
                                // uploadFile(fileM.attachments.first().url, fileM.author.id)

                                let submission = await Submission.findOne({ user: message.author.id, editing: true })
                                let attachmentsArray = submission.attachments.JSON()

                                attachmentsArray.push(fileM.attachments.first().url, fileM.author.id)




                                if (image.m.content.toLowerCase() === 'done') {
                                    // User is done sending files
                                    fileCollector.stop()

                                    const reviewMessageEmbed = new Discord.MessageEmbed()
                                        .setColor('#db48cf')
                                        .setTitle(`Review Submission`)
                                        .setDescription('Does your submission look good? Reply "yes" or "no"')
                                    dmchannel.send(reviewEmbed)

                                    const submissionPreviewEmbed = new Discord.MessageEmbed()
                                        .setColor('#db48cf')
                                        .setTitle(`Review Submission`)
                                        .setDescription('Does your submission look good? Reply "yes" or "no"')
                                    dmchannel.send(submissionEmbed)

                                    const filter = m => m.author.id === message.author.id;
                                    const reviewCollector = new Discord.MessageCollector(dmchannel, filter);

                                    reviewCollector.on('collect', reviewAnswer => {
                                        if (reviewAnswer.m.content.toLowerCase() === 'yes') {
                                        } else if (reviewAnswer.m.content.toLowerCase() === 'no') {

                                        } else {

                                        }
                                    });

                                    reviewCollector.on('end', collected => {
                                        console.log(`Review collector stopped`)
                                    });
                                }
                            });

                            fileCollector.on('end', collected => {
                                console.log(`Image collector stopped ${collected.size} image(s) collected`)
                            });

                        } else if (m.content.toLowerCase() === 'no') {
                            // No files to upload
                            fileQuestionCollector.stop()
                            reviewCollector(dmchannel)

                        } else {

                        }

                    });

                    fileQuestionCollector.on('end', collected => {
                        console.log('Image question answered')


                    })
                });

            });

        } else {

            const activeSubmissionEmbed = new Discord.MessageEmbed()
                .setColor('#db48cf')
                .setTitle(`Edit Submission?`)
                .setDescription(`You already have an active submission would you like to edit it?`)

            message.author.send(activeSubmissionEmbed);

            // Start react collector

        }

    }
});

dClient.login(process.env.DISCORD_TOKEN);