const {SlashCommandBuilder, MessageFlags} = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
		.setName('purge')
		.setDescription('Delete the last messages in all chats.')
    .addIntegerOption(option =>
      option.setName('num')
        .setDescription('The number of messages you want to delete. (max 100)')
        .setRequired(true)),
  async execute(interaction) {
    const deleteCount = interaction.options.getInteger('num');

    if (!deleteCount || deleteCount < 2 || deleteCount > 100)
      return message.reply('Please provide a number between 2 and 100 for the number of messages to delete');

    const fetched = await interaction.channel.messages.fetch({
      limit: deleteCount,
    });

    interaction.channel
      .bulkDelete(fetched)
      .then(() => {
        interaction.reply({
          content: `Succesfully deleted messages`,
          flags: MessageFlags.Ephemeral,
        });
      })
      .catch(error => {
        interaction.reply({
          content: `Couldn't delete messages because of: ${error}`,
          flags: MessageFlags.Ephemeral,
        });
      });
  },
};
