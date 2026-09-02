import { useEffect, useRef, useState } from "react";
import { FaPlay, FaPause } from "react-icons/fa6";

/*
 * A fixed-looking "waveform" - real per-file amplitude analysis
 * (via Web Audio's decodeAudioData) would be more authentic but
 * adds real risk (async decoding, unsupported formats, extra
 * load per message) for a cosmetic bar pattern. This gives the
 * same WhatsApp-style visual without any of that.
 */
const BAR_HEIGHTS = [
    6, 11, 16, 9, 19, 13, 22, 10, 17, 24,
    12, 20, 8, 15, 23, 11, 18, 9, 21, 14,
    7, 16, 20, 10, 13, 18, 8, 15, 12, 6
];

function formatTime(totalSeconds) {

    if (!isFinite(totalSeconds) || totalSeconds < 0) {
        return "0:00";
    }

    const minutes = Math.floor(totalSeconds / 60);
    const seconds = Math.floor(totalSeconds % 60);

    return `${minutes}:${String(seconds).padStart(2, "0")}`;

}


function VoiceMessagePlayer({ src, mine }) {

    const audioRef = useRef(null);
    const trackRef = useRef(null);

    const [isPlaying, setIsPlaying] = useState(false);
    const [duration, setDuration] = useState(0);
    const [currentTime, setCurrentTime] = useState(0);
    const [loadError, setLoadError] = useState(false);

    useEffect(() => {

        const audio = audioRef.current;
        if (!audio) return;

        const handleLoaded = () => {
            if (isFinite(audio.duration)) {
                setDuration(audio.duration);
            }
        };

        const handleTimeUpdate = () => setCurrentTime(audio.currentTime);

        const handleEnded = () => {
            setIsPlaying(false);
            setCurrentTime(0);
        };

        const handleError = () => setLoadError(true);

        audio.addEventListener("loadedmetadata", handleLoaded);
        audio.addEventListener("durationchange", handleLoaded);
        audio.addEventListener("timeupdate", handleTimeUpdate);
        audio.addEventListener("ended", handleEnded);
        audio.addEventListener("error", handleError);

        return () => {
            audio.removeEventListener("loadedmetadata", handleLoaded);
            audio.removeEventListener("durationchange", handleLoaded);
            audio.removeEventListener("timeupdate", handleTimeUpdate);
            audio.removeEventListener("ended", handleEnded);
            audio.removeEventListener("error", handleError);
        };

    }, [src]);

    const togglePlay = () => {

        const audio = audioRef.current;
        if (!audio || loadError) return;

        if (isPlaying) {

            audio.pause();
            setIsPlaying(false);

        } else {

            // Pause every other voice message on the page first,
            // so you never end up with two playing at once.
            document
                .querySelectorAll("audio[data-voice-message]")
                .forEach(el => {
                    if (el !== audio) el.pause();
                });

            audio.play()
                .then(() => setIsPlaying(true))
                .catch(() => setLoadError(true));

        }

    };

    const seekTo = (clientX) => {

        const audio = audioRef.current;
        const track = trackRef.current;

        if (!audio || !track || !duration) return;

        const rect = track.getBoundingClientRect();

        const ratio = Math.min(
            1,
            Math.max(0, (clientX - rect.left) / rect.width)
        );

        audio.currentTime = ratio * duration;
        setCurrentTime(audio.currentTime);

    };

    const progressRatio = duration ? currentTime / duration : 0;

    return (

        <div className={`voice-player ${mine ? "voice-player-mine" : ""}`}>

            <audio
                ref={audioRef}
                src={src}
                data-voice-message="true"
                preload="metadata"
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
            />

            <button
                type="button"
                className="voice-player-toggle"
                onClick={togglePlay}
                disabled={loadError}
                title={isPlaying ? "Pause" : "Play"}
            >
                {isPlaying ? <FaPause /> : <FaPlay />}
            </button>

            <div
                ref={trackRef}
                className="voice-player-track"
                onClick={(e) => seekTo(e.clientX)}
            >

                {BAR_HEIGHTS.map((height, index) => {

                    const barRatio = (index + 0.5) / BAR_HEIGHTS.length;

                    return (

                        <span
                            key={index}
                            className={`voice-player-bar ${
                                barRatio <= progressRatio
                                    ? "voice-player-bar-played"
                                    : ""
                            }`}
                            style={{ height: `${height}px` }}
                        />

                    );

                })}

            </div>

            <span className="voice-player-time">
                {loadError
                    ? "--:--"
                    : formatTime(isPlaying || currentTime > 0 ? currentTime : duration)}
            </span>

        </div>

    );

}

export default VoiceMessagePlayer;
