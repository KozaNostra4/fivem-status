const Discord = require('discord.js')
const wait = require('util').promisify(setTimeout);
const axios = require('axios')
const cron = require('cron'); 

const client = new Discord.Client({
    partials: ["MESSAGE", "CHANNEL", "REACTION"],
    intents: 32767,
});

client.config = require('./config.json');

process.on('unhandledRejection', error => {
    console.warn("\x1b[31m", 'Unhandled promise rejection:', error, '\x1b[0m');
});

client.on('shardError', error => {
	console.error("\x1b[31m", 'A websocket connection encountered an error:', error, '\x1b[0m');
});

client.on('ready', async () => {

    const guild = client.guilds.cache.get(client.config.guildID);
    console.log("\x1b[43m", 'Getting Ready...', '\x1b[0m');
    await wait(3000);
    client.user.setActivity(`${guild.name}`, {type: 'WATCHING'});
    client.user.setPresence({status: 'dnd'});
    console.log("\x1b[42m", `Woke up as ${client.user.tag}.`, '\x1b[0m');
    await wait(3000)
    const channel = guild.channels.cache.get(client.config.statusChannel);
    const ip = client.config.ip;
    const port = client.config.port;
    const message = client.config.messageStatus ? client.config.messageStatus : null;
    const serveripport = `${ip}:${port}`;
    const { data } = await axios.get(`http://${serveripport}/dynamic.json`);
    const regex = /\[([0-9]+)\]/;
    const queue = data.hostname.match(regex);
    const onlineEmoji = guild.emojis.cache.find(e => e.name === client.config.onlineEmoji)
    const offlineEmoji = guild.emojis.cache.find(e => e.name === client.config.offlineEmoji)

    
    const job = new cron.CronJob('00 * * * * *', async () => {
    try{
    if(queue){
        const queueEmbed = new Discord.MessageEmbed()
        .setColor('GREEN')
        .setDescription(`${message}`)
        .addFields(
            {name: '**Status**', value: `${onlineEmoji} Online`, inline: true},
            {name: "**Players**", value: `${data.clients}/${data.sv_maxclients}`, inline: true},
            {name: "**Queue**", value: `${queue[1]}`, inline: true})
        channel.messages.fetch().then((messages) => {
            if(messages.size === 0){
              channel.send({embeds: [queueEmbed]});
            }else {
              for(const message of messages){
                
                    const time = new Date();
                    const logtime = time.getTime();
                    const hours = Math.floor(logtime / 3600000) % 24;
                    const minutes = Math.floor(logtime / 60000) % 60; 
                    let setMinutes = '';
                    if(minutes < 10){
                        setMinutes = `0${minutes}`;
                    }else {
                        setMinutes = minutes;
                    };
                    queueEmbed.setFooter(`Updated: ${hours + 3}:${setMinutes}`);
                    message[1].edit({embeds: [queueEmbed]});
                
                
              };
            };
          });
    }else {
        const noqueueEmbed = new Discord.MessageEmbed()
        .setColor('GREEN')
        .setAuthor(guild.name, guild.iconURL({dynamic: true}))
        .setDescription(`${message}`)
        .addFields(
            {name: '**Status**', value: `${onlineEmoji} Online`, inline: true},
            {name: "**Players**", value: `${data.clients}/${data.sv_maxclients}`, inline: true},
            {name: "**Queue**", value: `0`, inline: true})
        channel.messages.fetch().then((messages) => {
            if(messages.size === 0){
                channel.send({embeds: [noqueueEmbed]});
            }else {
                for(const message of messages){
                        const time = new Date();
                        const logtime = time.getTime();
                        const hours = Math.floor(logtime / 3600000) % 24;
                        const minutes = Math.floor(logtime / 60000) % 60; 
                        let setMinutes = '';
                        if(minutes < 10){
                            setMinutes = `0${minutes}`;
                        }else {
                            setMinutes = minutes;
                        };
                        noqueueEmbed.setFooter(`Updated: ${hours + 3}:${setMinutes}`);
                        message[1].edit({embeds: [noqueueEmbed]});
              };
            };
          });
    };
}catch (error){
    console.warn(error);
    const offlineEmbed = new Discord.MessageEmbed()
    .setDescription(`${message}`)
    .setColor('RED')
    .setAuthor(guild.name, guild.iconURL({dynamic: true}))
    .setDescription(`${offlineEmoji}**Offline**`)
    channel.messages.fetch().then((messages) => {
      if(messages.size === 0){
        channel.send({embeds: [offlineEmbed]});
      }else {
        for(const message of messages){
                const time = new Date();
                const logtime = time.getTime();
                const hours = Math.floor(logtime / 3600000) % 24;
                const minutes = Math.floor(logtime / 60000) % 60; 
                let setMinutes = '';
                if(minutes < 10){
                    setMinutes = `0${minutes}`;
                }else {
                    setMinutes = minutes;
                };
                offlineEmbed.setFooter(`Updated: ${hours + 3}:${setMinutes}`);
                message[1].edit({embeds: [offlineEmbed]});
        };
      };
    });
};
});
job.start();

});


client.on('messageCreate', async (message) => {
    if(message.author.bot) return;
    const args = message.content.slice(client.config.prefix.length).trim().split(/ +/g);
    const cmd = args.shift().toLowerCase();
    if(cmd === 'status'){

        const ip = client.config.ip;
        const port = client.config.port;

        const serveripport = `${ip}:${port}`;
        const { data } = await axios.get(`http://${serveripport}/dynamic.json`);
        const regex = /\[([0-9]+)\]/;
        const queue = data.hostname.match(regex);

        const onlineEmoji = message.guild.emojis.cache.find(e => e.name === client.config.onlineEmoji);
        const offlineEmoji = message.guild.emojis.cache.find(e => e.name === client.config.offlineEmbed);

        try{
        if(queue){
            const queueEmbed = new Discord.MessageEmbed()
            .setColor('GREEN')
            .setDescription(`**${onlineEmoji}Online**`)
            .addFields(
                {name: "**Players**", value: `${data.clients}/${data.sv_maxclients}`, inline: true},
                {name: "**Queue**", value: `${queue[1]}`, inline: true})
            .setFooter(message.guild.name, message.guild.iconURL({dynamic: true}))
            .setThumbnail(message.guild.iconURL({dynamic: true}));
            message.channel.send({embeds: [queueEmbed]})
        }else {
            const noqueueEmbed = new Discord.MessageEmbed()
            .setColor('GREEN')
            .setDescription(`**${onlineEmoji}Online**`)
            .addFields(
                {name: "**Players**", value: `${data.clients}/${data.sv_maxclients}`, inline: true},
                {name: "**Queue**", value: `0`, inline: true})
            .setFooter(message.guild.name, message.guild.iconURL({dynamic: true}))
            .setThumbnail(message.guild.iconURL({dynamic: true}));
            message.channel.send({embeds: [noqueueEmbed]});
        };

    
    } catch (error){
        console.warn(error);
        const offlineEmbed = new Discord.MessageEmbed()
        .setColor('RED')
        .setDescription(`**${offlineEmoji}Offline**`)
        .setFooter(message.guild.name, message.guild.iconURL({dynamic: true}))
        .setThumbnail(message.guild.iconURL({dynamic: true}));
        message.channel.send({embeds: [offlineEmbed]});
    };
};

});









client.login(client.config.token)
