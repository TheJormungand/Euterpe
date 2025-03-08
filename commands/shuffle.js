const {GuildMember, SlashCommandBuilder, MessageFlags} = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
		.setName('shuffle')
		.setDescription('Shuffle the queue!'),
  async execute(interaction, queue) {
    if (!(interaction.member instanceof GuildMember) || !interaction.member.voice.channel) {
      return void interaction.reply({
        content: 'You are not in a voice channel!',
        flags: MessageFlags.Ephemeral,
      });
    }

    if (
      interaction.guild.members.me.voice.channelId &&
      interaction.member.voice.channelId !== interaction.guild.members.me.voice.channelId
    ) {
      return void interaction.reply({
        content: 'You are not in my voice channel!',
        flags: MessageFlags.Ephemeral,
      });
    }

    await interaction.deferReply();
    queue.shuffle();
    return void interaction.followUp({content: `🔀 | Shuffled the queue!`});
  }
}
