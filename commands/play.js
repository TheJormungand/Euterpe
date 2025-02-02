const {GuildMember, SlashCommandBuilder} = require('discord.js');
const fs = require('fs');
const { createAudioResource } = require('@discordjs/voice');
const { join } = require('node:path');

module.exports = {
  data: new SlashCommandBuilder()
      .setName('eu-play')
      .setDescription('Play a song! Use URL or playlist name.')
      .addStringOption(option =>
        option.setName('url')
            .setDescription('URL of song or playlist')
            .setRequired(true))
      .addBooleanOption(option =>
        option.setName('keep')
          .setDescription('Keep current queue. Default: false')
          .setRequired(false)),
  async execute(interaction, queue) {
    
    // Check if you are in a voice channel and can play music
    if (!(interaction.member instanceof GuildMember) || !interaction.member.voice.channel) {
      return void interaction.reply({
        content: 'You are not in a voice channel!',
        flags: MessageFlags.Ephemeral,
      });
    } else if (
      interaction.guild.members.me.voice.channelId &&
      interaction.member.voice.channelId !== interaction.guild.members.me.voice.channelId
    ) {
      return void interaction.reply({
        content: 'You are not in my voice channel!',
        flags: MessageFlags.Ephemeral,
      });
    }
    
    // Defer the reply to make sure the interaction doesn't get blocked
    await interaction.deferReply();

    // Get the query from the user
    const query = interaction.options.getString('url', true);
    console.log("User Raw Query: "+query);
    var query_id = 0;

    // Get bool whether to replace queue or keep it and add more songs, default: false
    var keep = interaction.options.getBoolean('keep');
    if (keep == null) keep = false;

    // Create helper variables and functions
    var MasterRecord = [];
    var playlist = [];
    async function fileExists(filePath) {
      try {
        await fs.promises.access(filePath);
        console.log("File Exists: "+filePath);
        return true;
      } catch (error) {
        console.log("File Does Not Exist: "+filePath);
        return false;
      }
    }

    // Check if the query might be a URL to a playlist
    if (query.includes('list=')) {
      query_id = query.split('list=')[1].split('&')[0].split('?si=')[0];
      console.log("Playlist ID: "+query_id);
      if (fileExists(`playlists/${query_id}`)) {
        console.log("Local Playlist Name: " + query_id);
        await fs.promises.readFile(`playlists/${query_id}`, 'utf8').then(data => {
          playlist = data.split('\r\n'); // Split by new line
          console.log("Playlist Loaded:\n"+playlist);
        });
        var playlist_title = "N/A";
        const queueTemp = []
        for await(const song of playlist) {
          const path = join(__dirname,'..','data', song.split(",")[0]+'.mp3');
          const resource = createAudioResource(path, { inlineVolume: true,
          metadata: {
              id: song.split(",")[0],
              title: song.split(",")[1],
              url: song.split(",")[2],
              path: path,
            }
          });
          resource.volume.setVolume(0.2);
          queueTemp.push(resource);
          console.log("Added "+song.split(",")[0]+" to queue");
          console.log("Metadata: id:"+resource.metadata.id+" title:"+resource.metadata.title+" path:"+resource.metadata.path);
          playlist_title = song.split(",")[3];
        }
        queue.add(queueTemp, keep);
        console.log("Finished adding songs to queue\n");
        queue.play(interaction);
        return void interaction.followUp({
          content: '🎶 | Playing the playlist '+playlist_title+" !",
      });
      } else {
        return void interaction.followUp({
            content: `❌ | **${query}** not found! Please use a valid URL or playlist name. Use /add to download the song or playlist.`,
        });
      }

    // Case when a query might be a URL to a single video
    } else if (query.includes('watch?v=') || query.includes('youtu.be')) {
      if (query.includes('watch?v=')) query_id = query.split('watch?v=')[1].split('&')[0].split('?si=')[0];
      else query_id = query.split('youtu.be/')[1].split("&")[0].split('?si=')[0];
      console.log("Video ID: "+query_id);
      if(fileExists(`data/${query_id}.mp3`)) {
        let metas;
        try {
          await fs.promises.readFile(`data/${query_id}.info.json`, 'utf8').then(data => {
            metas = JSON.parse(data);
          });
        }
        catch (error) {
          console.error(error)
        }
        if (metas == undefined) {
          console.warn("Metadata for file: "+query_id+".mp3 not loaded!");
          metas.title = "Metadata Unavailable";
        }
        const path = join(__dirname,'..','data',`${query_id}.mp3`);
        const resource = createAudioResource(path, { inlineVolume: true ,
          metadata: {
            id: query_id,
            title: metas.title,
            url: query,
            path: path,
          }
        }).volume.setVolume(0.2);
        queue.add(resource, keep);
        console.log("Added "+query_id+" to queue");
        console.log("Metadata: id:"+resource.metadata.id+" title:"+resource.metadata.title+" path:"+resource.metadata.path);
        queue.play(interaction);
        return void interaction.followUp({
          content: '🎶 | Playing the song '+metas.title+' !',
        });
      } else {
        console.log("Song "+query_id+"not found!");
        return void interaction.followUp({
          content: '❌ | Song not found! Download it first using /add',
        });
      }

    // Case when the query might be a playlist name
    } else {

      //Load MasterRecord for fetching playlist names
      await fs.promises.readFile(`playlists/MasterRecord`, 'utf8').then(data => {
        MasterRecord = data.split('\r\n'); // Split by new line
        console.log("Master Record Loaded:\n"+MasterRecord);
      });

      //Fetch playlist ID
      for await(const playlist of MasterRecord) {
        if (playlist.split(",")[1] == query) {
          query_id = playlist.split(",")[0];
          console.log("Master Playlist Name: "+query_id);
          break;
        }
      };

      if (await fileExists(`playlists/${query_id}`)) {
        console.log("Local Playlist Name: " + query_id);
        await fs.promises.readFile(`playlists/${query_id}`, 'utf8').then(data => {
          playlist = data.split('\r\n'); // Split by new line
          console.log("Playlist Loaded:\n"+playlist);
        });
        const queueTemp = []
        for await(const song of playlist) {
          const path = join(__dirname,'..','data', song.split(",")[0]+'.mp3');
          const resource = createAudioResource(path, { inlineVolume: true,
          metadata: {
              id: song.split(",")[0],
              title: song.split(",")[1],
              url: song.split(",")[2],
              path: path,
            }
          });
          resource.volume.setVolume(0.2);
          queueTemp.push(resource);
          console.log("Added "+song.split(",")[0]+" to queue");
          console.log("Metadata: id:"+resource.metadata.id+" title:"+resource.metadata.title+" path:"+resource.metadata.path);
        }
        queue.add(queueTemp, keep);
        console.log("Finished adding songs to queue\n");
        queue.play(interaction);
        return void interaction.followUp({
          content: '🎶 | Playing the playlist '+query+" !",
      });
      } else {
        return void interaction.followUp({
            content: `❌ | **${query}** not found! Please use a valid URL or playlist name. Use /add to download the song or playlist.`,
        });
      }
    }
  }
};
