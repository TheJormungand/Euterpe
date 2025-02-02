const {GuildMember, SlashCommandBuilder, MessageFlags } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
  .setName('eu-stop')
  .setDescription('Stop the player!'),
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
    if (!queue.playing) {
      return void interaction.followUp({
        content: '❌ | No music is being played!',
      });
    }
    queue.clear();
    return void interaction.followUp({content: '🛑 | Stopped the player!'});
  },
};
