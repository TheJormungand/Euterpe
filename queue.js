const { createAudioResource } = require('@discordjs/voice');

class Queue {
    constructor(player) {
        this.queue = [];
        this.playing = false;
        this.currentTrackIndex = 0;
        this.player = player;
        this.interaction;
        this.channel
        this.loopMode = 0;
        // 0 = no loop
        // 1 = loop queue
        // 2 = loop track
    }

    //add song to queue
    add(song, keep) {
        if (keep){
            if (Array.isArray(song)) {
                for (const element of song) {
                    this.queue.push(element)
                    console.log("[QUEUE][add] Added "+element.metadata.title+" to queue");
                }
            }
            else {
                this.queue.push(song);
                console.log("[QUEUE][add] Added "+song.metadata.title+" to queue");
            }
        } else {
            this.clear();
            if (Array.isArray(song)) {
                for (const element of song) {
                    this.queue.push(element)
                    console.log("[QUEUE][add] Added "+element.metadata.title+" to queue");
                }
            }
            else {
                this.queue.push(song);
                console.log("[QUEUE][add] Added "+song.metadata.title+" to queue");
            }
        }
    }

    //check length of queue
    length() {
        return this.queue.length;
    }

    clear() {
        this.queue = [];
        this.playing = false;
        this.currentTrackIndex = 0;
        this.loopMode = 0;
        this.player.stop();
        console.log("[QUEUE][clear] Cleared queue");
    }

    currentTrack() {
        if (this.queue.length === 0) {
            console.log("[QUEUE][currentTrack] No tracks in Queue");
            return null;
        } else {
            console.log("[QUEUE][currentTrack] Current track: "+this.queue[this.currentTrackIndex].metadata.title);
            return this.queue[this.currentTrackIndex];
        }
    }

    skipTrack(){
        if (this.queue.length === 0) {
            console.log("[QUEUE][skipTrack] No tracks in Queue");
            return null;
        } else {
            this.player.stop();
            console.log("[QUEUE][skipTrack] Track skipped")
        }
    }

    nextTrack() {
        if (this.queue.length === 0) {
            console.log("[QUEUE][nextTrack] No tracks in Queue");
            return null;
        } else {
            if (this.currentTrackIndex < this.queue.length - 1) {
                if(this.loopMode === 2){
                    // What if song was skipped while loop mode = track? Well, let's not worry about it and call it a feature. Could use a flag later though.
                    this.recreateAudioResource();
                    this.player.play(this.queue[this.currentTrackIndex]);
                    this.playing = true;
                    console.log("[QUEUE][nextTrack] Looping track, playing same track: "+this.queue[this.currentTrackIndex].metadata.title);
                    return this.queue[this.currentTrackIndex];
                } else {
                    this.currentTrackIndex++;
                    this.recreateAudioResource();
                    this.player.play(this.queue[this.currentTrackIndex]);
                    this.playing = true;
                    console.log("[QUEUE][nextTrack] Playing next track: "+this.queue[this.currentTrackIndex].metadata.title);
                    return this.queue[this.currentTrackIndex];
                }
            } else {
                if(this.loopMode === 1){
                    this.currentTrackIndex = 0;
                    this.recreateAudioResource();
                    this.player.play(this.queue[this.currentTrackIndex]);
                    this.playing = true;
                    console.log("[QUEUE][nextTrack] Looping queue, playing first track: "+this.queue[this.currentTrackIndex].metadata.title);
                    return this.queue[this.currentTrackIndex];
                } else if(this.loopMode === 2){
                    this.recreateAudioResource();
                    this.player.play(this.queue[this.currentTrackIndex]);
                    this.playing = true;
                    console.log("[QUEUE][nextTrack] Looping track, playing same track: "+this.queue[this.currentTrackIndex].metadata.title);
                    return this.queue[this.currentTrackIndex];
                } else {
                    this.playing = false;
                    console.log("[QUEUE][nextTrack] No more tracks in Queue, stopped playing");
                    return null;
                }
            }
        }
    }

    previousTrack() {
        if (this.queue.length === 0) {
            console.log("[QUEUE][previousTrack] No tracks in Queue");
            return null;
        } else {
            if (this.currentTrackIndex > 0) {
                this.currentTrackIndex--;
                this.recreateAudioResource();
                this.player.play(this.queue[this.currentTrackIndex]);
                this.playing = true;
                console.log("[QUEUE][previousTrack] Playing previous track: "+this.queue[this.currentTrackIndex].metadata.title);
                return this.queue[this.currentTrackIndex];
            } else {
                console.log("[QUEUE][previousTrack] Already at the beginning of the queue");
                return this.queue[this.currentTrackIndex];
            }
        }
    }

    recreateAudioResource(){
        if (this.queue[this.currentTrackIndex].ended){
            console.log("[QUEUE][play] Track in ended state, recreating AudioResource");
            const path = this.queue[this.currentTrackIndex].metadata.path
            const resource = createAudioResource(path, { inlineVolume: true, 
            metadata: {
                id: this.queue[this.currentTrackIndex].metadata.id,
                title: this.queue[this.currentTrackIndex].metadata.title,
                url: this.queue[this.currentTrackIndex].metadata.url,
                path: path,
                }
            });
            resource.volume.setVolume(0.2);
            this.queue[this.currentTrackIndex] = resource;
        }
    }

    play(interaction) {
        if (this.queue.length === 0) {
            console.log("[QUEUE][play] No tracks in Queue");
            return null;
        } else {
            if (!this.playing ){
                this.recreateAudioResource();
                this.player.play(this.queue[this.currentTrackIndex]);
                this.playing = true;
                console.log("[QUEUE][play] Playing track: "+this.queue[this.currentTrackIndex].metadata.title);
                this.interaction = interaction;
                this.channel = interaction.channel;
                return this.queue[this.currentTrackIndex];
            } 
        }
    }

    loop(loopType){
        if (loopType === 0){
            this.loopMode = 0;
            console.log("[QUEUE][loop] Looping disabled");
        } else if (loopType === 1){
            this.loopMode = 1;
            console.log("[QUEUE][loop] Looping queue");
        } else if (loopType === 2){
            this.loopMode = 2;
            console.log("[QUEUE][loop] Looping track");
        }
    }

    shuffle(){
        if (this.queue.length === 0) {
            console.log("[QUEUE][shuffle] No tracks in Queue");
            return null;
        } else {
            let currentIndex = this.queue.length,  randomIndex;
            while (currentIndex != 0) {
                randomIndex = Math.floor(Math.random() * currentIndex);
                currentIndex--;
                [this.queue[currentIndex], this.queue[randomIndex]] = [this.queue[randomIndex], this.queue[currentIndex]];
            }
            console.log("[QUEUE][shuffle] Shuffled queue");
        }
    }    
}

module.exports = Queue;