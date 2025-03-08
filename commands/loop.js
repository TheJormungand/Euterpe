const {GuildMember, SlashCommandBuilder, MessageFlags} = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
		.setName('loop')
		.setDescription('Loop the music!')
    .addStringOption(option =>
      option.setName('mode')
        .setDescription('Choose the loop type')
        .setRequired(true)
        .addChoices(
          { name: 'Track', value: 'track' },
          { name: 'Queue', value: 'queue' },
          { name: 'Off', value: 'off' }
        )),
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
    
    const loopMode = interaction.options.getString('mode', true);
    if (loopMode === 'off') {
      queue.loop(0);
    } else if (loopMode === 'queue') {
      queue.loop(1);
    } else if (loopMode === 'track') {
      queue.loop(2);
    }

    const mode = loopMode === 2 ? "🔂" : loopMode === 1 ? "🔁" : loopMode === 0 ? "❌" : "▶";
    return void interaction.followUp({content: `${mode} | Loop mode updated!`});
  },
};
