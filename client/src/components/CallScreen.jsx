import { useEffect, useRef, useState } from "react";

import {
    FaMicrophone,
    FaMicrophoneSlash,
    FaVideo,
    FaVideoSlash,
    FaVolumeHigh,
    FaVolumeLow,
    FaUserPlus,
    FaEllipsis,
    FaPhoneSlash,
    FaPhone
} from "react-icons/fa6";

import "../styles/callScreen.css";


function CallScreen({
    isCallActive,
    callType = "audio",
    callStatus = "connected",     // "outgoing" | "incoming" | "connected"
    contactName,
    localStream,
    remoteStream,
    onEnd,
    onAccept,
    onDecline,
    onToggleMute,
    onToggleVideo,
    onAddPeople
}) {

    const [muted, setMuted] = useState(false);
    const [videoEnabled, setVideoEnabled] = useState(
        callType === "video"
    );
    const [speakerEnabled, setSpeakerEnabled] = useState(false);

    const [callStartedAt, setCallStartedAt] = useState(null);
    const [elapsedSeconds, setElapsedSeconds] = useState(0);

    const localVideoRef = useRef(null);
    const remoteVideoRef = useRef(null);
    const remoteAudioRef = useRef(null);


    /*
     * Reset call state whenever a new call starts.
     */
    useEffect(() => {

        if (!isCallActive) {
            setCallStartedAt(null);
            setElapsedSeconds(0);
            return;
        }

        setMuted(false);
        setVideoEnabled(callType === "video");
        setSpeakerEnabled(false);

    }, [isCallActive, callType]);


    /*
     * The timer starts the moment the call actually connects,
     * driven by the real "call_accepted" / accept flow - not a
     * fixed delay pretending the other side picked up.
     */
    useEffect(() => {

        if (callStatus === "connected" && !callStartedAt) {
            setCallStartedAt(Date.now());
        }

        if (callStatus !== "connected") {
            setCallStartedAt(null);
            setElapsedSeconds(0);
        }

    }, [callStatus]);


    useEffect(() => {

        if (callStatus !== "connected" || !callStartedAt) {
            return;
        }

        const timer = setInterval(() => {

            setElapsedSeconds(
                Math.floor((Date.now() - callStartedAt) / 1000)
            );

        }, 1000);

        return () => clearInterval(timer);

    }, [callStatus, callStartedAt]);


    /*
     * Bind the real MediaStreams to the actual media elements.
     */
    useEffect(() => {

        if (localVideoRef.current) {
            localVideoRef.current.srcObject = localStream || null;
        }

    }, [localStream]);

    useEffect(() => {

        if (remoteVideoRef.current) {
            remoteVideoRef.current.srcObject = remoteStream || null;
        }

        if (remoteAudioRef.current) {
            remoteAudioRef.current.srcObject = remoteStream || null;
        }

    }, [remoteStream]);


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


    const statusLabel = () => {

        if (callStatus === "incoming") return "Incoming call…";
        if (callStatus === "connected") return formatTime(elapsedSeconds);
        return "Ringing…";

    };


    const toggleMute = () => {

        const next = !muted;
        setMuted(next);
        onToggleMute?.(next);

    };


    const toggleVideo = () => {

        const next = !videoEnabled;
        setVideoEnabled(next);
        onToggleVideo?.(next);

    };


    const initials = contactName
        ? contactName
            .split(" ")
            .map(word => word[0])
            .join("")
            .slice(0, 2)
            .toUpperCase()
        : "?";


    const showVideo =
        callType === "video" &&
        callStatus === "connected";


    return (

        <div className="call-screen">

            {/* remote audio always plays once connected, even for
                video calls the <video> element carries the audio
                track too, so this only matters for voice calls */}

            {callStatus === "connected" && callType === "audio" && (
                <audio ref={remoteAudioRef} autoPlay />
            )}

            {showVideo && (

                <div className="call-video-stage">

                    <video
                        ref={remoteVideoRef}
                        className="call-remote-video"
                        autoPlay
                        playsInline
                    />

                    <video
                        ref={localVideoRef}
                        className={`call-local-video ${
                            videoEnabled ? "" : "call-local-video-off"
                        }`}
                        autoPlay
                        playsInline
                        muted
                    />

                </div>

            )}

            <div
                className={`call-screen-content ${
                    showVideo ? "call-screen-content-video" : ""
                }`}
            >

                <div className="call-app-name">
                    ChatSphere call
                </div>


                {!showVideo && (

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

                        {callStatus !== "connected" && (
                            <span className="call-ring-pulse" />
                        )}

                    </div>

                )}


                <h1 className="call-contact-name">
                    {contactName || "Unknown"}
                </h1>


                <div className="call-status">
                    {statusLabel()}
                </div>


                <div className="call-type-label">
                    {callType === "video" ? "Video call" : "Voice call"}
                </div>


                {/* =====================================
                    INCOMING CALL - accept / decline
                ===================================== */}

                {callStatus === "incoming" ? (

                    <div className="call-incoming-actions">

                        <button
                            type="button"
                            className="call-decline-btn"
                            onClick={onDecline}
                            title="Decline"
                        >
                            <FaPhoneSlash />
                            <span>Decline</span>
                        </button>

                        <button
                            type="button"
                            className="call-accept-btn"
                            onClick={onAccept}
                            title="Accept"
                        >
                            <FaPhone />
                            <span>Accept</span>
                        </button>

                    </div>

                ) : (

                    <>

                        <div className="call-controls">

                            <button
                                type="button"
                                className={`call-control-btn ${muted ? "active" : ""}`}
                                onClick={toggleMute}
                                title={muted ? "Unmute" : "Mute"}
                            >
                                {muted ? <FaMicrophoneSlash /> : <FaMicrophone />}
                                <span>{muted ? "Unmute" : "Mute"}</span>
                            </button>

                            {callType === "video" && (

                                <button
                                    type="button"
                                    className={`call-control-btn ${
                                        !videoEnabled ? "active" : ""
                                    }`}
                                    onClick={toggleVideo}
                                    title={videoEnabled ? "Turn video off" : "Turn video on"}
                                >
                                    {videoEnabled ? <FaVideo /> : <FaVideoSlash />}
                                    <span>{videoEnabled ? "Video" : "Video off"}</span>
                                </button>

                            )}

                            <button
                                type="button"
                                className={`call-control-btn ${speakerEnabled ? "active" : ""}`}
                                onClick={() => setSpeakerEnabled(prev => !prev)}
                                title="Speaker"
                            >
                                {speakerEnabled ? <FaVolumeHigh /> : <FaVolumeLow />}
                                <span>Speaker</span>
                            </button>

                            <button
                                type="button"
                                className="call-control-btn"
                                onClick={() => onAddPeople?.()}
                                title="Add people"
                            >
                                <FaUserPlus />
                                <span>Add</span>
                            </button>

                            <button
                                type="button"
                                className="call-control-btn"
                                title="More"
                            >
                                <FaEllipsis />
                                <span>More</span>
                            </button>

                        </div>

                        <button
                            type="button"
                            className="end-call-btn"
                            onClick={onEnd}
                            title="End call"
                        >
                            <FaPhoneSlash />
                        </button>

                    </>

                )}

            </div>

        </div>

    );

}


export default CallScreen;
