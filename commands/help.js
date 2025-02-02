const fs = require('fs');
const { SlashCommandBuilder , MessageFlags} = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
		.setName('eu-help')
		.setDescription('List all available commands.'),
  async execute(interaction) {
    let str = '';
    const commandFiles = await fs.promises.readdir('./commands').filter(file => file.endsWith('.js'));

    for await (const file of commandFiles) {
      const command = require(`./${file}`);
      str += `Name: ${command.name}, Description: ${command.description} \n`;
    }

    return void interaction.reply({
      content: str,
      flags: MessageFlags.Ephemeral,
    });
  },
};
