const { spawn } = require('child_process');
const { SlashCommandBuilder } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('add')
		.setDescription('Add a song to the repositories!')
        .addStringOption(option =>
            option.setName('url')
                .setDescription('URL of song or playlist')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('playlist_name')
                .setDescription('Name of the playlist, default is YouTube playlist name')
                .setRequired(false)),
    async execute(interaction) {
        const query = interaction.options.getString('url', true);
        const playlistName = interaction.options.getString('playlist_name', false);
        try {
            await interaction.deferReply();
            if (query.includes('list=')) {
                console.log('Playlist detected!');
                var ytdlprocess;
                if (playlistName) {
                    console.log(`Custom Playlist Name: ${playlistName}`);
                    ytdlprocess = spawn('yt-dlp', ['--config-location', '~/Euterpe/yt-dlp.conf',
                        '--exec', `echo \"%(id)s,%(title)s,%(original_url)s,${playlistName}\">>\"playlists/%(playlist_id)s\"`,
                        '--exec', `echo \"%(playlist_id)s,${playlistName}\">>\"playlists/MasterRecord\"`,
                        '--exec', `playlist:sed -i -f sedconf.sed playlists/MasterRecord & del playlists\\sed*`,
                        '--exec', 'sed -i -f sedconf.sed playlists/%(playlist_id)s',                        
                        query]);
                } else {
                    ytdlprocess = spawn('yt-dlp', ['--config-location', '~/Euterpe/yt-dlp.conf',
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
                    return void interaction.followUp({
                        content: 'Download complete!',
                    });
                });
            } else if (query.includes('watch?v=') || query.includes('youtu.be')) {
                console.log('Video detected!');
                const ytdlprocess = spawn('yt-dlp', ['--config-location', '~/Euterpe/yt-dlp.conf', '--no-exec', query]);
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
                    return void interaction.followUp({
                        content: 'Download complete!',
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