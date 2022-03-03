const Discord = require('discord.js');
const { MessageEmbed } = require('discord.js');
const client = new Discord.Client();
const { prefix, token } = require('./auth.json');
const { initializeDatabase, getPlayerByRank, getOwnedPlayers, setOwnedPlayer, getPlayer } = require('./db/database');
const { getUser, requestClientCredentialsToken } = require('./api.js');
const { createImage } = require('./image/jimp.js');
const { Console } = require('winston/lib/winston/transports');
const { get } = require('request');
const { HTTPResponse } = require('puppeteer');
let apiToken;

initializeDatabase();
apiToken = requestClientCredentialsToken();

// debugF
// async function asdf() {
//     let player = await getPlayerByRank(3192);
//     await createImage(player);
// }
// asdf()

client.on('message', async (message) => {

    // let hpp;
    // CollectionReference collectionRef = db.collection("collection");
    // Query query = collectionRef.orderBy("amount", descending: true).limit(1);
    // function getHighestPC() {
    //     for (let i = 0; i < 10000; i++) {
    //         hpp = getPlayer
    //     }
    // }
    // if the message either doesn't start with the prefix or was sent by a bot, exit early
    if (!message.content.startsWith(prefix) || message.author.bot) return;

    const args = message.content.slice(prefix.length).trim().split(/ +/);
    const command = args.shift().toLowerCase(); // make lowercase work too

    // roll for a random player
    if (command === 'roll') {

        let player;
        while (!player) {
            const rank = Math.floor(Math.random() * 10000) + 1;
            player = await getPlayerByRank(rank);
        }

        await createImage(player);
        message.channel.send({ file: "image/cache/osuCard-" + player.apiv2.username + ".png" })
            .then((message) => {
                message.react('👍');

                // First argument is a filter function
                message.awaitReactions((reaction, user) => user.id != message.author.id && (reaction.emoji.name == '👍'),
                    { max: 1, time: 30000 }).then((reactions) => {
                        let claimingUser;
                        for (const [key, user] of reactions.get('👍')?.users.entries()) {
                            if (user.id !== message.author.id) {
                                claimingUser = user;
                            }
                        }
                        if (!claimingUser) {
                            message.reply('Operation cancelled.');
                            return;
                        }
                        setOwnedPlayer(message.guild.id, claimingUser.id, player.apiv2.id);
                        message.channel.send(`**${player.apiv2.username}** has been claimed by **${claimingUser.username}**!`);

                        //     .then(message.reply(`Player ${player.apiv2.username} has been claimed!`));
                        //message.channel.send(`**${player.apiv2.username}** has been claimed by **${reactions.first().users.}**!`)
                    }).catch((err) => {
                        console.log(err);
                        console.log(`Nobody reacted to ${player.apiv2.username} after 30 seconds, operation canceled`);
                    });
            });
        const result = await getUser(apiToken, 8759374);
        console.log(result);
    }

    if (command === 'cards') {
        let playerIds = await getOwnedPlayers(message.guild.id, message.author.id);
        let ownedPlayers = [];
        let ownedPlayersNames = "";

        for (let i = 0; i < playerIds.length; i++) {
            let player = await getPlayer(playerIds[i]);
            ownedPlayers.push(player);
            //ownedPlayersNames.concat(" ", ownedPlayers[i].apiv2.username);
            ownedPlayersNames += `${ownedPlayers[i].apiv2.username}\t#${ownedPlayers[i].apiv2.statistics.global_rank}\n`;
        }
        message.channel.send(ownedPlayersNames);
        ownedPlayers.sort((a, b) => {
            return a.apiv2.statistics.global_rank - b.apiv2.statistics.global_rank;
        });


        //message.channel.send({ embed: { title: `**${message.author.username}'s owned players**` } }.then(msg => ownedPlayers));
        // const msg = `
        // **${message.author.username}'s owned players**

        // `;
        // for (let i = 0; i < ownedPlayers.length; i++) {
        //     finalmessage = msg.concat(`#${ownedPlayers[i].apiv2.statistics.global_rank} - ${ownedPlayers[i].apiv2.username}\n`);
        // }
        //message.channel.send({ embed: { title: `**${message.author.username}'s owned players**` } }.then(msg => ));

        // await lib.discord.channels['@0.2.0'].messages.create({
        //     "channel_id": `${context.params.event.channel_id}`,
        //     "content": "",
        //     "tts": false,
        //     "embeds": [
        //         {
        //             "type": "rich",
        //             "title": `${message.author.username}'s owned players`,
        //             "description": `${ownedPlayers[i].apiv2.statistics.global_rank} - ${ownedPlayers[i].apiv2.username}`,
        //             "color": 0xff7aff,
        //             "image": {
        //                 "url": `${user.avatarURL}`,
        //                 "height": 100,
        //                 "width": 100
        //             }
        //         }
        //     ]
        // });
    }

    // SERVER DETAILS
    //if (message.content === `${prefix}`)
    if (command === 'help') {
        message.channel.send("Commands:\nhelp, roll, cards")
    }
})



client.login(token);