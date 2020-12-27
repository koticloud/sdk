import HasEvents from '../traits/HasEvents';

class AudioFile {
    constructor(source) {
        this.audio = new Audio();
        this.load(source);

        // Metadata
        this.duration = 0;

        // State
        this.loadedPercent = 0.0;
        this.currentTime = 0;
        this.volume = this.audio.volume;
        this.playbackRate = 1.0;

        this._addEventListeners();
    }

    _addEventListeners() {
        this.audio.addEventListener('loadedmetadata', (event) => {
            this.duration = this.audio.duration;
            this.emit('loadedmetadata');
        });

        // Fired when the first frame of the media has finished loading.
        this.audio.addEventListener('loadeddata', (event) => {
            this._setCurrentTime(this.audio.currentTime);

            this.emit('loadeddata');
        });

        // Data loading progress
        this.audio.addEventListener('progress', (event, progress) => {
            // NOTE: There seems to be no way to actually determine how much has
            // been loaded
        });

        // Data has been fully loaded till the end
        this.audio.addEventListener('canplaythrough', (event) => {
            this.loadedPercent = 100;

            this.emit('canplaythrough');

            this.emit('loadingProgress');
        });

        this.audio.addEventListener('timeupdate', (event) => {
            this._setCurrentTime(this.audio.currentTime);
        });

        this.audio.addEventListener('ended', (event) => {
            this._setCurrentTime(0);

            this.emit('trackEnded');
        });
    }

    /**
     * Load an audio track from a source
     * 
     * @param string source 
     */
    load(source) {
        this.stop();

        // if (source.startsWith('https://api.soundcloud.com')) {
        //     if (source.endsWith('/')) {
        //         source = source.substring(0, source.length - 1);
        //     }

        //     if (!this._calamansi._options.soundcloudClientId) {
        //         console.error('Please set your SoundCloud client id in the soundcloudClientId option to play SoundCloud tracks.');
        //     }

        //     source += '/stream?client_id=' + this._calamansi._options.soundcloudClientId;
        // }

        this.audio.src = source;
        this.audio.load();
    }

    /**
     * Start playing the current track from the start
     */
    playFromStart() {
        this.audio.pause();
        this.audio.currentTime = 0;
        this.currentTime = 0;
        this.audio.play();

        this.emit('play');
    }

    /**
     * Start/resume playback of the current track
     */
    play() {
        this.audio.play();

        this.emit('play');
    }

    /**
     * Pause playback of the current track
     */
    pause() {
        this.audio.pause();

        this.emit('pause');
    }

    /**
     * Stop playback of the current track
     */
    stop() {
        this.audio.pause();
        this.audio.currentTime = 0;
        this.currentTime = 0;

        this.emit('stop');
    }

    /**
     * Unload the currently loaded audio
     */
    unload() {
        this.audio.pause();
        this.audio.removeAttribute('src');
        this.audio.load();
    }

    _setCurrentTime(time) {
        this.currentTime = time;

        this.emit('timeupdate');
    }

    /**
     * Seek to a position
     * 
     * @param int time (seconds)
     */
    seekTo(time) {
        this.audio.currentTime = time;

        this._setCurrentTime(time);
    }

    /**
     * Set volume
     * 
     * @param float volume [0.0-1.0]
     */
    changeVolume(volume) {
        volume = volume >= 0 ? volume : 0;
        volume = volume <= 1 ? volume : 1;

        this.audio.volume = volume;
        this.volume = volume;

        this.emit('volumechange');
    }

    /**
     * Set playback rate
     * 
     * @param float rate [0.0-1.0]
     */
    changePlaybackRate(rate) {
        this.playbackRate = rate;
        this.audio.playbackRate = rate;

        this.emit('ratechange');
    }
}

/**
 * Traits
 */
Object.assign(AudioFile.prototype, HasEvents);

export default AudioFile;