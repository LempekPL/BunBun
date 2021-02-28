let Discord = require("discord.js");
module.exports.info = {
    name: "choose",
    example: "`#PREFIX##COMMAND# <option 1> | <option 2>`",
    info: "Will choose for you. You can add more than 2 options. `| <option n>`",
    tags: ["choose","option","opinion"]
}

module.exports.run = async (client, message, args) => {
    if (await client.util.blockCheck(client.util.codename(__dirname),message)) return;
    let i = Math.floor(Math.random() * client.config.c.length);
    let ce = client.config.c[i];
    args = args.join(" ");
    if (!args) return client.emit("uisae", "U04", message, "");
    let text = args.split("|");
    if (!text[1]) return message.reply("You need at least 2 options. Separated by \`|\`.");
    let brua = Math.floor((Math.random() * text.length));
    console.log(brua)
    let resp = text[brua];
    let choose = new Discord.MessageEmbed()
        choose.setTitle("**Choose**");
        choose.setDescription(resp);
        choose.setColor(ce);
        if (client.config.settings.subowners.length==0) {
            choose.setFooter("© "+client.users.cache.get(client.config.settings.ownerid).username, client.users.cache.get(client.config.settings.ownerid).avatarURL());
        } else {
            let owners = client.users.cache.get(client.config.settings.ownerid).username
            client.config.settings.subowners.forEach(sub => {
                owners+=` & ${client.users.cache.get(sub).username}`;
            });
            choose.setFooter("© "+owners, client.user.avatarURL());
        }
        choose.setTimestamp();
    message.channel.send(choose);
}