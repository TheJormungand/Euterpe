const { SlashCommandBuilder } = require('discord.js');
const fs = require('fs');

module.exports = {
  data: new SlashCommandBuilder()
  .setName('show')
  .setDescription("Show what's in the archives!")
    .addStringOption(option =>
        option.setName('playlist_name')
            .setDescription('Name of the playlist, if empty show all playlist names')
            .setRequired(false)),
  async execute(interaction) {
    try {
        await interaction.deferReply();
        const displayStringLines = [];
        const playlist_name = interaction.options.getString('playlist_name', false);
        const messagesToSend = [];
        var MasterRecord = [];
        await fs.promises.readFile(`playlists/MasterRecord`, 'utf8').then(data => {
            MasterRecord = data.split('\r\n'); // Split by new line
          });
        if (playlist_name === null) {
            let uniquePlaylists = [...new Set(MasterRecord)].filter(n => n); // Get unique playlists from MasterRecord
            let index = 1;
            for await (let playlist of uniquePlaylists) {
                console.log(`Accessing: `+`playlists/${playlist.split(',')[0]}`);
                await fs.promises.readFile(`playlists/${playlist.split(',')[0]}`, 'utf8').then(data => {
                    let linesNumber = data.split('\r\n').length-1; // Split by new line
                    displayStringLines.push(`${index}. "${playlist.split(',')[1]}" : ${linesNumber} songs`);
                  });
                index++;
            }
        } else {
            displayStringLines.push(`Playlist: ${playlist_name}`);
            let playlist_id = MasterRecord.find(element => element.includes(playlist_name)); //search for playlist name in MasterRecord
            if (playlist_id !== undefined) {
                await fs.promises.readFile(`playlists/${playlist_id.split(',')[0]}`, 'utf8').then(data => {
                    let lines = data.split('\r\n').filter(n => n); // Split by new line
                    let index = 1;
                    for (let line of lines) {
                        displayStringLines.push(`${index}. ${line.split(',')[1]}`);
                        index++;
                    }
                  });
            } else {
                return void interaction.followUp({content: `Playlist "${playlist_name}" not found.`});
            }
        }
        // Construct the messages to send, max 2000 characters per message
        let message = "";
        for await (let line of displayStringLines) {
            if (message.length + line.length > 2000) {
                messagesToSend.push(message);
                message = "";
            }
            message += line + "\n";
        }
        messagesToSend.push(message);
        for await (let messageToSend of messagesToSend) {
            await interaction.followUp({content: messageToSend});
        }
    }
    catch (error) {
      console.error(error);
      return void interaction.followUp({content: "An error occurred while trying to show the archives."});
    }
  },
};
