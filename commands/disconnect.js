const { getVoiceConnection } = require('@discordjs/voice');
const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
		.setName('eu-dc')
		.setDescription('Disconnect Euterpe from the voice channel.'),
  async execute(interaction, queue) {
    const connection = getVoiceConnection(interaction.guildId);
    try {
      if (connection) {
        queue.clear();
        connection.destroy();
      } else {
        return void interaction.reply({
          content: 'Euterpe is not connected to a voice channel.',
        });
      }
    } catch (error) {
      console.error(error);
      return void interaction.reply({
        content: 'An error occurred while trying to disconnect Euterpe.',
      });
    }
    return void interaction.reply({
      content: '🌷 | Thank you for your patronage.',
    });
  },
};
