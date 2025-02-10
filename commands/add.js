const { spawn } = require('child_process');
const { SlashCommandBuilder } = require('discord.js');
const fs = require('fs');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('add')
		.setDescription('Add a song to the repositories!')
        .addStringOption(option =>
            option.setName('url')
                .setDescription('URL of song or playlist')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('tagname')
                .setDescription('Name of the playlist, default is YouTube playlist name. For single video there is no default.')
                .setRequired(false)),
    async execute(interaction) {
        await interaction.deferReply();
        const query = interaction.options.getString('url', true);
        const playlistName = interaction.options.getString('tagname', false);
        async function getIDFromPlaylistName(name, MasterRecord) {
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
            var MasterRecord = [];
            await fs.promises.readFile(`playlists/MasterRecord`, 'utf8').then(data => {
                MasterRecord = data.split('\r\n'); // Split by new line
            });
            if (query.includes('list=')) {
                console.log('Playlist detected!');
                var ytdlprocess;
                if (playlistName) {
                    if (await getIDFromPlaylistName(playlistName, MasterRecord)) {
                        return void interaction.followUp({
                            content: `❌ | Playlist "${playlistName}" already exists. Cannot add a playlist to another playlist!`,
                        });
                    }
                    console.log(`Custom Playlist Name: ${playlistName}`);
                    ytdlprocess = spawn('yt-dlp', ['--config-location', '~/Euterpe/yt-dlp.conf',
                        '--download-archive', 'data/MasterRecord',
                        '--exec', `echo \"%(id)s,%(title)s,%(original_url)s,${playlistName}\">>\"playlists/%(playlist_id)s\"`,
                        '--exec', `echo \"%(playlist_id)s,${playlistName}\">>\"playlists/MasterRecord\"`,
                        '--exec', `playlist:sed -i -f sedconf.sed playlists/MasterRecord & del playlists\\sed*`,
                        '--exec', 'sed -i -f sedconf.sed playlists/%(playlist_id)s',                        
                        query]);
                } else {
                    ytdlprocess = spawn('yt-dlp', ['--config-location', '~/Euterpe/yt-dlp.conf',
                        '--download-archive', 'data/MasterRecord',
                        '--exec', `echo \"%(id)s,%(title)s,%(original_url)s,%(playlist_title)s\">>\"playlists/%(playlist_id)s\"`,
                        '--exec', `echo \"%(playlist_id)s,%(playlist_title)s\">>\"playlists/MasterRecord\"`,
                        '--exec', `playlist:sed -i -f sedconf.sed playlists/MasterRecord & del playlists\\sed*`,
                        '--exec', 'sed -i -f sedconf.sed playlists/%(playlist_id)s',                        
                        query]);
                }
                ytdlprocess.stderr.setEncoding('utf8');
                ytdlprocess.stderr.on('data', function(data) {
                    data=data.toString();
                    console.error(data);
                });
                ytdlprocess.stdout.setEncoding('utf8');
                ytdlprocess.stdout.on('data', function(data) {
                    data=data.toString();
                    console.log(data);
                    if (data.includes('[download]')) {
                        interaction.editReply({
                            content: data,
                        });
                    };
                });
                ytdlprocess.on('close', function(code) {                
                    console.log('Download complete! Exit code: ' + code);
                    if (code !== 0) {
                        return void interaction.followUp({
                            content: '❌ | An error occurred while trying to add the playlist.',
                        });
                    } else return void interaction.followUp({
                        content: '✅ | Playlist added to the archives!',
                    });
                });
            } else if (query.includes('watch?v=') || query.includes('youtu.be')) {
                console.log('Video detected!');
                var ytdlprocess;
                if (!playlistName) {
                    return void interaction.followUp({
                        content: '❌ | Please provide a playlist/tag name for a single video!',
                    });
                }
                var playlist_id = await getIDFromPlaylistName(playlistName, MasterRecord);
                if (playlist_id) {  // Playlist given is already in the archives, add video to this playlist
                    ytdlprocess = spawn('yt-dlp', ['--config-location', '~/Euterpe/yt-dlp.conf',
                        '--exec', `echo \"%(id)s,%(title)s,%(original_url)s,${playlistName}\">>\"playlists/${playlist_id}\"`,
                        '--exec', `echo \"${playlist_id},${playlistName}\">>\"playlists/MasterRecord\"& echo %(id)s`,
                        '--exec', `sed -i -f sedconf.sed playlists/MasterRecord & del playlists\\sed* & echo %(id)s`,
                        '--exec', `sed -i -f sedconf.sed playlists/${playlist_id} & echo %(id)s`,
                        query]);
                } else {    // no playlist in archives, manually create new playlist/tag for the video
                    const generatedID = require('crypto').createHash('md5').update(playlistName).digest('hex');
                    console.log(`Generated Playlist ID: ${generatedID}`);
                    ytdlprocess = spawn('yt-dlp', ['--config-location', '~/Euterpe/yt-dlp.conf',
                        '--exec', `echo \"%(id)s,%(title)s,%(original_url)s,${playlistName}\">>\"playlists/${generatedID}\"`,
                        '--exec', `echo \"${generatedID},${playlistName}\">>\"playlists/MasterRecord\"& echo %(id)s`,
                        '--exec', `sed -i -f sedconf.sed playlists/MasterRecord & del playlists\\sed* & echo %(id)s`,
                        '--exec', `sed -i -f sedconf.sed playlists/${generatedID} & echo %(id)s`,
                        query]);
                }
                ytdlprocess.stderr.on('data', function(data) {
                    data=data.toString();
                    console.error(data);
                });
                ytdlprocess.stdout.setEncoding('utf8');
                ytdlprocess.stdout.on('data', function(data) {
                    data=data.toString();
                    console.log(data);
                    if (data.includes('[download]')) {
                        interaction.editReply({
                            content: data,
                        });
                    };
                });
                ytdlprocess.on('close', function(code) {                
                    console.log('Download complete! Exit code: ' + code);
                    if (code !== 0) {
                        return void interaction.followUp({
                            content: '❌ | An error occurred while trying to add the video.',
                        });
                    } else return void interaction.followUp({
                        content: '✅ | Video added to the archives!',
                    });
                });
            } else {
                return void interaction.followUp({
                    content: `❌ | **${query}** is not a valid youtube video link!`,
                });
            }
        } catch (error) {
            console.log(error);
            interaction.followUp({
                content: 'There was an error trying to execute that command: ' + error.message,
            });
        }
    }
};