const {SlashCommandBuilder} = require('discord.js');
const fs = require('fs');
const { spawn } = require('child_process');

module.exports = {
  data: new SlashCommandBuilder()
  .setName('rename')
  .setDescription("Rename playlist in the archives!")
    .addStringOption(option =>
        option.setName('playlist')
            .setDescription('Name of the current playlist or YouTube URL to playlist')
            .setRequired(true))
    .addStringOption(option =>
        option.setName('new_name')
            .setDescription('New name of the playlist')
            .setRequired(true)),
  async execute(interaction) {
    async function getNameFromID(ID, MasterRecord) {
        for await (let playlist_line of MasterRecord) {
            let [playlist_id, playlist_title] = playlist_line.split(',');
            if (playlist_id === ID) {
                console.log(`Playlist Name: ${playlist_title} found.`); 
                return playlist_title;
            }
        }
        console.log(`Playlist ID: ${ID} not found.`);
        return false;
    }
    async function getIDFromName(name, MasterRecord) {
        for await (let playlist_line of MasterRecord) {
            let [playlist_id, playlist_title] = playlist_line.split(',');
            if (playlist_title === name) {
                console.log(`Playlist ID: ${playlist_id} found.`);
                return playlist_id;
            }
        }
        console.log(`Playlist Name: ${name} not found.`);
        return false;
    }
    try {
        await interaction.deferReply();
        var MasterRecord = [];
        await fs.promises.readFile(`playlists/MasterRecord`, 'utf8').then(data => {
            MasterRecord = data.split('\r\n'); // Split by new line
          });
        var playlist = interaction.options.getString('playlist', true);
        const new_name = interaction.options.getString('new_name', true);
        var playlist_name;
        var playlist_id;
        if (await getIDFromName(new_name, MasterRecord)) {
            return void interaction.followUp({content: `Playlist "${new_name}" already exists.`});
        }
        if (playlist.includes('list=')) {
            playlist_id = playlist.split('list=')[1].split('&')[0].split('?si=')[0];
            playlist_name = await getNameFromID(playlist_id, MasterRecord);
            if (!playlist_name) {
                return void interaction.followUp({content: `Playlist "${playlist}" not found.`});
            }
        } else {
            playlist_id = await getIDFromName(playlist, MasterRecord);
            if (!playlist_id) {
                return void interaction.followUp({content: `Playlist "${playlist}" not found.`});
            }
            playlist_name = playlist;
        }
        console.log(`Renaming Playlist: ${playlist_name} to ${new_name}`);
        var sedprocess = spawn('sed', ['-i', `-e s/,${playlist_name}/,${new_name}/g`, 'playlists/MasterRecord']);
        sedprocess.stderr.setEncoding('utf8');
        sedprocess.stderr.on('data', function(data) {
            data=data.toString();
            console.error(data);
            return void interaction.followUp({content: `An error occurred while trying to rename the playlist.`});
        });
        sedprocess.stdout.setEncoding('utf8');
        sedprocess.stdout.on('data', function(data) {
            data=data.toString();
            console.log(data);
        });
        sedprocess.on('close', function(code) {
            console.log(`MasterRecord update ended with code: ${code}.`);
        });
        var sedprocess2 = spawn('sed', ['-i', `-e s/,${playlist_name}/,${new_name}/g`, `playlists/${playlist_id}`]);
        sedprocess2.stderr.setEncoding('utf8');
        sedprocess2.stderr.on('data', function(data) {
            data=data.toString();
            console.error(data);
            return void interaction.followUp({content: `An error occurred while trying to rename the playlist.`});
        });
        sedprocess2.stdout.setEncoding('utf8');
        sedprocess2.stdout.on('data', function(data) {
            data=data.toString();
            console.log(data);
        });
        sedprocess2.on('close', function(code) {
            console.log(`Playlist update ended with code: ${code}.`);
        });
        return void interaction.followUp({content: `Playlist "${playlist_name}" renamed to "${new_name}".`});
    }
    catch (error) {
      console.error(error);
      return void interaction.followUp({content: "An error occurred while trying to show the archives."});
    }
  },
};
