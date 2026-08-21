import { useState, useRef } from "react";
import {
    FaPlay,
    FaPause,
    FaDownload,
    FaSearch
} from "react-icons/fa";
import { API_ORIGIN } from "../config";
import "../styles/voicegallery.css";

function VoiceGallery({

    open,

    voices,

    onClose

}) {

    const [search, setSearch] = useState("");

    const [playingId, setPlayingId] = useState(null);

    const audioRef = useRef(null);

    if (!open) return null;

    const filtered = voices.filter(v =>
        v.sender.toLowerCase().includes(search.toLowerCase())
    );

    const playAudio = (voice) => {

        if (
            playingId === voice.id &&
            audioRef.current
        ) {

            audioRef.current.pause();

            setPlayingId(null);

            return;

        }

        if (audioRef.current) {

            audioRef.current.pause();

        }

        const audio = new Audio(

            `${API_ORIGIN}${voice.audio}`

        );

        audioRef.current = audio;

        audio.play();

        setPlayingId(voice.id);

        audio.onended = () => {

            setPlayingId(null);

        };

    };

    return (

        <div className="voice-overlay">

            <div className="voice-modal">

                <div className="voice-header">

                    <h2>Voice Messages</h2>

                    <button onClick={onClose}>
                        ✕
                    </button>

                </div>

                <div className="voice-search">

                    <FaSearch />

                    <input

                        placeholder="Search sender..."

                        value={search}

                        onChange={(e)=>setSearch(e.target.value)}

                    />

                </div>

                <div className="voice-list">

                    {filtered.length === 0 ? (

                        <div className="voice-empty">

                            No voice messages

                        </div>

                    ) : (

                        filtered.map(voice=>(

                            <div

                                className="voice-item"

                                key={voice.id}

                            >

                                <button

                                    className="play-btn"

                                    onClick={()=>playAudio(voice)}

                                >

                                    {

                                        playingId===voice.id

                                        ?

                                        <FaPause/>

                                        :

                                        <FaPlay/>

                                    }

                                </button>

                                <div className="voice-info">

                                    <h4>

                                        {voice.sender}

                                    </h4>

                                    <span>

                                        {voice.time}

                                    </span>

                                </div>

                                <a

                                    href={`${API_ORIGIN}${voice.audio}`}

                                    download

                                >

                                    <FaDownload/>

                                </a>

                            </div>

                        ))

                    )}

                </div>

            </div>

        </div>

    );

}

export default VoiceGallery;