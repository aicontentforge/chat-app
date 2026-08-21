import { useEffect, useState } from "react";

import {
    FaMicrophone,
    FaMicrophoneSlash,
    FaVideo,
    FaVideoSlash,
    FaVolumeHigh,
    FaVolumeLow,
    FaUserPlus,
    FaEllipsis,
    FaPhoneSlash
} from "react-icons/fa6";

import "../styles/callScreen.css";


function CallScreen({
    isCallActive,
    callType = "audio",
    contactName,
    onEnd,
    onAddPeople
}) {

    const [muted, setMuted] = useState(false);
    const [videoEnabled, setVideoEnabled] = useState(
        callType === "video"
    );
    const [speakerEnabled, setSpeakerEnabled] = useState(false);

    const [callStartedAt, setCallStartedAt] = useState(null);
    const [elapsedSeconds, setElapsedSeconds] = useState(0);

    const [isConnected, setIsConnected] = useState(false);


    /*
     * Reset call state whenever a new call starts.
     */
    useEffect(() => {

        if (!isCallActive) {
            setIsConnected(false);
            setCallStartedAt(null);
            setElapsedSeconds(0);
            return;
        }

        setMuted(false);
        setVideoEnabled(callType === "video");
        setSpeakerEnabled(false);

        setIsConnected(false);
        setCallStartedAt(null);
        setElapsedSeconds(0);


        /*
         * TEMPORARY:
         * Simulates the other user accepting the call
         * after 2 seconds.
         *
         * Replace this later with your Socket.IO/WebRTC
         * "call accepted" event.
         */
        const ringingTimer = setTimeout(() => {

            const startedAt = Date.now();

            setCallStartedAt(startedAt);
            setIsConnected(true);

        }, 2000);


        return () => {
            clearTimeout(ringingTimer);
        };

    }, [isCallActive, callType]);


    /*
     * Live call timer.
     */
    useEffect(() => {

        if (!isConnected || !callStartedAt) {
            return;
        }

        const timer = setInterval(() => {

            const seconds = Math.floor(
                (Date.now() - callStartedAt) / 1000
            );

            setElapsedSeconds(seconds);

        }, 1000);


        return () => {
            clearInterval(timer);
        };

    }, [isConnected, callStartedAt]);


    if (!isCallActive) {
        return null;
    }


    const formatTime = (totalSeconds) => {

        const minutes = Math.floor(totalSeconds / 60);

        const seconds = totalSeconds % 60;

        return `${String(minutes).padStart(2, "0")}:${String(
            seconds
        ).padStart(2, "0")}`;

    };


    const handleEndCall = () => {

        setIsConnected(false);
        setCallStartedAt(null);
        setElapsedSeconds(0);

        onEnd?.();

    };


    const initials = contactName
        ? contactName
            .split(" ")
            .map(word => word[0])
            .join("")
            .slice(0, 2)
            .toUpperCase()
        : "?";


    return (

        <div className="call-screen">

            <div className="call-screen-content">

                {/* =====================================
                    CALL TITLE
                ===================================== */}

                <div className="call-app-name">
                    ChatSphere call
                </div>


                {/* =====================================
                    AVATAR
                ===================================== */}

                <div className="call-avatar-wrapper">

                    <img
                        className="call-avatar"
                        src={
                            contactName
                                ? `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(
                                    contactName
                                )}`
                                : undefined
                        }
                        alt={contactName || "Contact"}
                    />

                    {!contactName && (
                        <div className="call-avatar-fallback">
                            {initials}
                        </div>
                    )}

                </div>


                {/* =====================================
                    CONTACT NAME
                ===================================== */}

                <h1 className="call-contact-name">
                    {contactName || "Unknown"}
                </h1>


                {/* =====================================
                    STATUS / TIMER
                ===================================== */}

                <div className="call-status">

                    {isConnected
                        ? formatTime(elapsedSeconds)
                        : "Ringing…"
                    }

                </div>


                {/* =====================================
                    CALL TYPE
                ===================================== */}

                <div className="call-type-label">

                    {callType === "video"
                        ? "Video call"
                        : "Voice call"
                    }

                </div>


                {/* =====================================
                    CONTROLS
                ===================================== */}

                <div className="call-controls">


                    {/* MUTE */}

                    <button
                        type="button"
                        className={`call-control-btn ${
                            muted ? "active" : ""
                        }`}
                        onClick={() =>
                            setMuted(prev => !prev)
                        }
                        title={
                            muted
                                ? "Unmute"
                                : "Mute"
                        }
                    >

                        {muted
                            ? <FaMicrophoneSlash />
                            : <FaMicrophone />
                        }

                        <span>
                            {muted
                                ? "Unmute"
                                : "Mute"
                            }
                        </span>

                    </button>


                    {/* VIDEO */}

                    {callType === "video" && (

                        <button
                            type="button"
                            className={`call-control-btn ${
                                !videoEnabled
                                    ? "active"
                                    : ""
                            }`}
                            onClick={() =>
                                setVideoEnabled(
                                    prev => !prev
                                )
                            }
                            title={
                                videoEnabled
                                    ? "Turn video off"
                                    : "Turn video on"
                            }
                        >

                            {videoEnabled
                                ? <FaVideo />
                                : <FaVideoSlash />
                            }

                            <span>
                                {videoEnabled
                                    ? "Video"
                                    : "Video off"
                                }
                            </span>

                        </button>

                    )}


                    {/* SPEAKER */}

                    <button
                        type="button"
                        className={`call-control-btn ${
                            speakerEnabled
                                ? "active"
                                : ""
                        }`}
                        onClick={() =>
                            setSpeakerEnabled(
                                prev => !prev
                            )
                        }
                        title="Speaker"
                    >

                        {speakerEnabled
                            ? <FaVolumeHigh />
                            : <FaVolumeLow />
                        }

                        <span>
                            Speaker
                        </span>

                    </button>


                    {/* ADD PEOPLE */}

                    <button
    type="button"
    className="call-control-btn"
    onClick={() => onAddPeople?.()}
    title="Add people"
>

                        <FaUserPlus />

                        <span>
                            Add
                        </span>

                    </button>


                    {/* MORE */}

                    <button
                        type="button"
                        className="call-control-btn"
                        title="More"
                    >

                        <FaEllipsis />

                        <span>
                            More
                        </span>

                    </button>

                </div>


                {/* =====================================
                    END CALL
                ===================================== */}

                <button
                    type="button"
                    className="end-call-btn"
                    onClick={handleEndCall}
                    title="End call"
                >

                    <FaPhoneSlash />

                </button>

            </div>

        </div>

    );

}


export default CallScreen;