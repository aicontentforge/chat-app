import { useEffect, useRef, useState } from "react";
import { FaMicrophone, FaTrash } from "react-icons/fa6";
import { IoSend } from "react-icons/io5";
import api from "../services/api";

/*
 * Picks the first MIME type the device's MediaRecorder actually
 * supports. Some Android WebViews don't support audio/webm at
 * all (the previous hard-coded `new MediaRecorder(stream)` with
 * no mimeType would then silently produce an empty/corrupt
 * recording) - this tries the modern codec first and falls back
 * to whatever the device does support.
 */
function pickSupportedMimeType() {

    const candidates = [
        "audio/webm;codecs=opus",
        "audio/webm",
        "audio/mp4",
        "audio/ogg;codecs=opus",
        "audio/aac"
    ];

    if (typeof MediaRecorder === "undefined" || !MediaRecorder.isTypeSupported) {
        return "";
    }

    return candidates.find(type => MediaRecorder.isTypeSupported(type)) || "";

}


function formatDuration(totalSeconds) {

    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;

    return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;

}


function AudioRecorder({ onUploaded, onRecordingChange }) {

    const recorderRef = useRef(null);
    const chunksRef = useRef([]);
    const streamRef = useRef(null);
    const timerRef = useRef(null);
    const cancelledRef = useRef(false);

    const [recording, setRecording] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [seconds, setSeconds] = useState(0);

    useEffect(() => {

        return () => {

            clearInterval(timerRef.current);

            if (streamRef.current) {
                streamRef.current.getTracks().forEach(track => track.stop());
            }

        };

    }, []);

    const stopStream = () => {

        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }

    };

    const startRecording = async () => {

        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {

            alert(
                "This device/browser doesn't support microphone recording."
            );
            return;

        }

        try {

            const stream = await navigator.mediaDevices.getUserMedia({
                audio: true
            });

            streamRef.current = stream;

            const mimeType = pickSupportedMimeType();

            const recorder = mimeType
                ? new MediaRecorder(stream, { mimeType })
                : new MediaRecorder(stream);

            recorderRef.current = recorder;
            chunksRef.current = [];
            cancelledRef.current = false;

            recorder.ondataavailable = (e) => {

                if (e.data && e.data.size > 0) {
                    chunksRef.current.push(e.data);
                }

            };

            recorder.onstop = async () => {

                stopStream();
                clearInterval(timerRef.current);

                if (cancelledRef.current || chunksRef.current.length === 0) {
                    chunksRef.current = [];
                    return;
                }

                try {

                    setUploading(true);

                    const blob = new Blob(chunksRef.current, {
                        type: recorder.mimeType || "audio/webm"
                    });

                    if (blob.size < 500) {
                        // Recorded practically nothing (tapped
                        // and released immediately) - not worth
                        // sending an empty/near-empty clip.
                        setUploading(false);
                        return;
                    }

                    const extension = (recorder.mimeType || "audio/webm")
                        .split(";")[0]
                        .split("/")[1] || "webm";

                    const formData = new FormData();

                    formData.append(
                        "audio",
                        blob,
                        `voice.${extension}`
                    );

                    const res = await api.post(
                        "/audio",
                        formData,
                        {
                            headers: {
                                "Content-Type": "multipart/form-data"
                            }
                        }
                    );

                    onUploaded(res.data.audio);

                } catch (err) {

                    console.error(err);
                    alert("Voice message failed to upload. Check your connection and try again.");

                } finally {

                    setUploading(false);

                }

            };

            recorder.start();

            setSeconds(0);
            setRecording(true);
            onRecordingChange?.(true);

            timerRef.current = setInterval(() => {
                setSeconds(prev => prev + 1);
            }, 1000);

        } catch (err) {

            console.error(err);

            alert(
                err?.name === "NotAllowedError"
                    ? "Microphone permission was denied."
                    : "Could not start recording on this device."
            );

        }

    };

    const stopRecording = () => {

        cancelledRef.current = false;

        if (recorderRef.current && recorderRef.current.state !== "inactive") {
            recorderRef.current.stop();
        }

        setRecording(false);
        onRecordingChange?.(false);

    };

    const cancelRecording = () => {

        cancelledRef.current = true;

        if (recorderRef.current && recorderRef.current.state !== "inactive") {
            recorderRef.current.stop();
        }

        setRecording(false);
        setSeconds(0);
        onRecordingChange?.(false);

    };


    if (recording) {

        return (

            <div className="voice-recording-bar">

                <button
                    type="button"
                    className="voice-recording-cancel"
                    onClick={cancelRecording}
                    title="Cancel"
                >
                    <FaTrash />
                </button>

                <span className="voice-recording-dot" />

                <span className="voice-recording-time">
                    {formatDuration(seconds)}
                </span>

                <span className="voice-recording-hint">
                    Recording…
                </span>

                <button
                    type="button"
                    className="voice-recording-send"
                    onClick={stopRecording}
                    title="Send voice message"
                >
                    <IoSend />
                </button>

            </div>

        );

    }

    return (

        <>

            <button
                className="icon-btn"
                onClick={startRecording}
                disabled={uploading}
                title="Voice message"
            >
                <FaMicrophone />
            </button>

            {uploading && (
                <span className="voice-uploading-label">
                    Sending voice message…
                </span>
            )}

        </>

    );

}

export default AudioRecorder;
