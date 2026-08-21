import { useRef, useState } from "react";
import api from "../services/api";

function AudioRecorder({ onUploaded }) {

    const recorderRef = useRef(null);
    const chunksRef = useRef([]);

    const [recording, setRecording] = useState(false);
    const [uploading, setUploading] = useState(false);

    const startRecording = async () => {

        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {

            alert("Your browser does not support microphone recording.");
            return;

        }

        try {

            const stream = await navigator.mediaDevices.getUserMedia({
                audio: true
            });

            const recorder = new MediaRecorder(stream);

            recorderRef.current = recorder;

            chunksRef.current = [];

            recorder.ondataavailable = (e) => {

                chunksRef.current.push(e.data);

            };

            recorder.onstop = async () => {

                try {

                    setUploading(true);

                    const blob = new Blob(chunksRef.current, {
                        type: "audio/webm"
                    });

                    const formData = new FormData();

                    formData.append(
                        "audio",
                        blob,
                        "voice.webm"
                    );

                    const res = await api.post(

                        "/audio",

                        formData,

                        {

                            headers: {

                                "Content-Type":
                                    "multipart/form-data"

                            }

                        }

                    );

                    onUploaded(res.data.audio);

                } catch (err) {

                    console.error(err);

                    alert("Audio upload failed.");

                } finally {

                    setUploading(false);

                }

            };

            recorder.start();

            setRecording(true);

        }

        catch (err) {

            console.error(err);

            alert("Microphone permission denied.");

        }

    };

    const stopRecording = () => {

        recorderRef.current.stop();

        setRecording(false);

    };

    return (

        <>

            <button

                className="icon-btn"

                onClick={

                    recording

                        ? stopRecording

                        : startRecording

                }

                title={

                    recording

                        ? "Stop Recording"

                        : "Voice Message"

                }

            >

                {

                    recording

                        ? "⏹️"

                        : "🎤"

                }

            </button>

            {

                uploading && (

                    <span

                        style={{

                            marginLeft: "8px",

                            fontSize: "13px",

                            color: "#666"

                        }}

                    >

                        Uploading...

                    </span>

                )

            }

        </>

    );

}

export default AudioRecorder;