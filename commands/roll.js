const {SlashCommandBuilder} = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
		.setName('eu-roll')
		.setDescription('Roll the dice!')
    .addStringOption(option =>
      option.setName('dice')
        .setDescription('type of dice to roll eg. d10')
        .setRequired(true)),
  async execute(interaction) {
    await interaction.deferReply();
    const dice = interaction.options.getString('dice');
    const roll = dice.split('d');
    const toRoll = parseInt(roll[1],10);
    if (roll.length !== 2 || roll[0]!== '' || Number.isNaN(toRoll) || roll[1] === ''){
        return void interaction.followUp({
            content: '❌ | Wrong roll command, use it like this: /roll d10',
        });
    }
    const randomNumber = Math.floor(Math.random() * toRoll) + 1;
    var optionalMsg = ''
    if(randomNumber === toRoll) optionalMsg = 'Good job!';
    if(randomNumber === 69) optionalMsg = 'Nice.';
    if(randomNumber === 1) optionalMsg = 'Heh.';
    return void interaction.followUp({
      content: `Rolling d${toRoll}...\nYou rolled ${randomNumber}! ${optionalMsg}`,
    });
  },
};
