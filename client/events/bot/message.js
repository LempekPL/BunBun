let Discord = require('discord.js');
let config = require("../../../data/config.json");
let db = require('../../../util/db.js');
let cooldown = new Set();
let slowmode;

module.exports = async (message, client) => {
    //filter
    if (message.author.bot) return;
    // checking database
    await db.checkGuild(message.guild.id);
    await db.checkUser(message.author.id);
    await db.checkBot(client.user.id);

    let prefix = await db.get("guilds", message.guild.id, "prefix");
    if (prefix == undefined) prefix = config.settings.prefix;
    if (message.content == `<@${client.user.id}>` || message.content == `<@!${client.user.id}>`) {
        message.reply("My prefix is `" + prefix + "`");
    }
    if (!message.content.startsWith(prefix)) return;
    
    //bot global bans
    let gbans = await db.get("bot", client.user.id, "globalBans");
    if (gbans.length>0) {
        if (gbans.includes(message.author.id)) {
            await require("../../../util/util").gban(message, client);
            return;
        }
    }

    let args = message.content.slice(prefix.length).trim().split(/ +/g);
    let command = args.shift().toLowerCase();
    let cmod = message.content.split(" ")[0];
    let commandfile = client.commands.get(cmod.slice(prefix.length));

    runcmd(command, commandfile, args, message, client);
}

async function runcmd(command, commandfile, args, message, client) {
    if (commandfile) {
        // cooldown filter
        if (cooldown.has(message.author.id)) {
            // cooldown reminder
            let second = 1;
            let minute = second * 60;
            let coolmins = Math.floor(slowmode / (minute));
            let coolsecs = Math.floor((slowmode % (minute)) / (second));
            message.delete();
            message.reply(`you need to wait \`${coolmins}\`m \`${coolsecs}\`s between commands.`).then(message => {
                message.delete({
                    timeout: slowmode*1000,
                    reason: 'Autoremove'
                });
            });
        } else {
            // doesn't give cooldown for server administrators and main owner
            if (!message.member.hasPermission("ADMINISTRATOR") || message.author.id != config.settings.ownerid) {
                cooldown.add(message.author.id);
            }

            // running command
            await commandfile.run(client, message, args);

            // used commands counting
            let comCount = await db.get("bot", client.user.id, "commands");
            let userCommand = await db.get("users", message.author.id, "favCommands");
            await comCount++;
            if (!userCommand[commandfile.info.name]) {
                userCommand[commandfile.info.name] = 1;
            } else {
                userCommand[commandfile.info.name]++;
            }
            await db.update("bot", client.user.id, "commands", comCount);
            await db.update("users", message.author.id, "favCommands", userCommand);

            // logging used command
            let whook = new Discord.WebhookClient(config.webhooks.all.split("/")[5], config.webhooks.all.split("/")[6]);
            let loggen = new Discord.MessageEmbed;
            loggen.setTitle(message.author.tag + " used command: " + command);
            loggen.setDescription(message.content);
            loggen.setColor('#ffff00')
            loggen.setFooter("© Lempek", client.users.cache.get('249253855613812736').avatarURL);
            loggen.addField("Server ID", message.guild.name + " (" + message.guild.id + ")");
            loggen.addField("Channel ID", message.channel.name + " (" + message.channel.id + ")");
            loggen.addField("Message ID", message.id);
            loggen.addField("Message Created", message.createdAt);
            loggen.addField("User Message Link", "https://discordapp.com/channels/" + message.guild.id + "/" + message.channel.id + "/" + message.id);
            loggen.addField("Command", comCount);
            loggen.addField("Owner", message.author.tag + " (" + message.author.id + ")");
            loggen.setTimestamp();
            if (message.author.id != config.settings.ownerid) {
                await whook.send(loggen);
            }
            setTimeout(() => {
                cooldown.delete(message.author.id)
            }, slowmode * 1000)
        }
    }

}