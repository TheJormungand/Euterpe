const { spawn } = require('child_process');
const { SlashCommandBuilder } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('add')
		.setDescription('Add a song to the repositories!')
        .addStringOption(option =>
            option.setName('url')
                .setDescription('URL of song or playlist')
                .setRequired(true)),
    async execute(interaction) {
        const query = interaction.options.getString('url', true);
        try {
            await interaction.deferReply();
            if (query.includes('list=')) {
                console.log('Playlist detected!');
                const ytdlprocess = spawn('yt-dlp', ['--config-location', '~/Euterpe/yt-dlp.conf', query]);
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