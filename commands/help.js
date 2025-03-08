const fs = require('fs');
const { SlashCommandBuilder , MessageFlags} = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
		.setName('help')
		.setDescription('List all available commands.'),
  async execute(interaction) {
    let str = '';
    await interaction.deferReply();
    str +=  '**/add <url> <tagname>**\n'  + 
    '    Add a song or playlist to repositories.\n'  + 
    '   	**url** 		- URL to YouTube containing song or a playlist\n'  + 
    '   	**tagname** 	- Name of your choosing for playlist/video that you wish to add and later use\n'  + 
    '   				  You can also specify existing tagname to add video to that local playlist\n\n'  + 
    '**/play <url> <keep>**\n'  + 
    '   	Play a song! Use URL or playlist name.\n'  + 
    '   	**url**			- URL or tagname used when adding playlist/video with /add command\n'  + 
    '   	**keep**		- Keeps songs previously added to the queue instead of replacing them, default false\n\n'  + 
    '**/loop <mode>**\n'  + 
    '   	Loop the music!\n'  + 
    '   	**mode**		- Mode of looping, Track loops currently playing song, Queue loops whole queue, Off turns looping off\n\n'  + 
    '**/show <playlist_name>**\n'  + 
    "   	Show what's in the archives!\n"  + 
    '   	**playlist_name**	- Name of playlist to show, if not given names of all playlists will be shown\n\n'  + 
    '**/rename <playlist> <new_name>**\n'  + 
    '   	Rename playlist in the archives!\n'  + 
    '   	**playlist**	- URL or Tagname used in /add command which you wish to rename\n'  + 
    '   					  For single videos or playlists created from single videos only tagname is supported\n'  + 
    '  	**new_name**	- New tagname to be used\n\n' +
    '**/roll <dice>**\n'  +
    '    Roll a dice!\n'  +
    '    **dice**		- Number of sides of the dice\n\n'; 
    const commands = interaction.client.commands.values();
    for await (const command of commands) {
      if(command.data.options.length==0) str += `**/${command.data.name}\n    ${command.data.description}\n\n`;
    }
    
    return void interaction.followUp({
      content: str,
      flags: MessageFlags.Ephemeral,
    });
  },
};
