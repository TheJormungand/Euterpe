const fs = require('fs');
const Discord = require('discord.js');
const Client = require('./client/Client');
const { AudioPlayerStatus, NoSubscriberBehavior, createAudioPlayer, joinVoiceChannel, getVoiceConnection } = require('@discordjs/voice');
const Queue = require('./queue');
const client = new Client();
require('dotenv').config();

// Import all command files and register them with the bot for further use
// Note that in production environment you need to execute the deploy-commands.js script to deploy the commands to Discord
// This is a one-time operation and you only need to do it once after you add a new command or change meta properties (name, description, options) of a command
client.commands = new Discord.Collection();
const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));
for (const file of commandFiles) {
  const command = require(`./commands/${file}`);
  if ('data' in command && 'execute' in command) {
    client.commands.set(command.data.name, command);
    console.log(`[INFO] Command ${command.data.name} registered.`);
  } else {
    console.log(`[WARNING] The command at ${file} is missing a required "data" or "execute" property.`);
  }
}

// Ensure data and playlists directories exist
if (!fs.existsSync('../data')){
  fs.mkdirSync('../data');
}
if (!fs.existsSync('../playlists')){
  fs.mkdirSync('../playlists');
}

const player = createAudioPlayer({
	behaviors: {
		noSubscriber: NoSubscriberBehavior.Pause,
	},
});

const queue = new Queue(player);
let connection;

// Register the event listener for the interactionCreate event to handle your commands
// This event will be emitted whenever a new interaction is created (which includes commands)
// Listener will execute the command if it exists
client.on('interactionCreate', async interaction => {
  const command = client.commands.get(interaction.commandName.toLowerCase());
  try {
    console.log(`Received Command: ${interaction.commandName.toLowerCase()}`);
    if (interaction.commandName.toLowerCase() == 'play'){
      // Connect to the voice channel
      connection = getVoiceConnection(interaction.guildId);
      if (connection === undefined) {
        console.log('No connection found. Creating new connection.');
        var connection = joinVoiceChannel({
          channelId: interaction.member.voice.channelId,
          guildId: interaction.guildId,
          adapterCreator: interaction.guild.voiceAdapterCreator,
        });
        connection.subscribe(player);
        command.execute(interaction, queue);
      } else {
        console.log('Connection found. Using existing connection.');
        command.execute(interaction, queue);
      }
    } else {
      command.execute(interaction, queue);
    }
  } catch (error) {
    console.error(error);
    interaction.followUp({
      content: 'There was an error trying to execute that command!',
    });
  }
});

// Register event listeners for the client and player instance for additional logging
client.once('ready', async () => {
  console.log('At your service.');
});

client.once('reconnecting', () => {
  console.log('Reconnecting!');
});

client.once('disconnect', () => {
  console.log('Disconnect!');
});

// Player is currently playing audio
player.on(AudioPlayerStatus.Playing, () => {
	console.log('The audio player has started playing!');
});

// Player has finished playing track and can play next track in the queue
player.on(AudioPlayerStatus.Idle, () => {
  console.log('The audio player has stopped playing!');
  if(queue.nextTrack() !== null){
    queue.channel.send({
      content: `🎶 | Now playing **${queue.currentTrack().metadata.title}**!`,
    });
  } else {
    queue.channel.send({
      content: `✅ | Finished playing the queue!`,
    });
  }
});

player.on(AudioPlayerStatus.Paused, () => {
  console.log('The audio player has paused!');
});

player.on(AudioPlayerStatus.Buffering, () => {
  console.log('The audio player is buffering!');
});

player.on(AudioPlayerStatus.AutoPaused, () => {
  console.log('The audio player has automatically paused!');
});

client.login(process.env.ENV_TOKEN);
