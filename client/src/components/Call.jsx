import { useEffect, useRef } from "react";
import socket from "../services/socket";

function Call({ currentUser, selectedUser }) {

    const localAudio = useRef(null);
    const remoteAudio = useRef(null);

    const localVideo = useRef(null);
    const remoteVideo = useRef(null);

    const pc = useRef(null);
    const localStream = useRef(null);

    const createPeer = () => {

        const peer = new RTCPeerConnection({

            iceServers: [

                {
                    urls: "stun:stun.l.google.com:19302"
                }

            ]

        });

        peer.onicecandidate = (event) => {

            if (event.candidate) {

                socket.emit("ice_candidate", {

                    to: selectedUser,
                    candidate: event.candidate

                });

            }

        };

        peer.ontrack = (event) => {

            remoteAudio.current.srcObject = event.streams[0];
            remoteVideo.current.srcObject = event.streams[0];

        };

        pc.current = peer;

        return peer;

    };

    useEffect(() => {

        socket.on("incoming_call", async ({ from, offer }) => {

            if (!window.confirm(`${from} is calling. Accept?`)) {

                socket.emit("reject_call", { to: from });

                return;

            }

            try {

                const stream =
                    await navigator.mediaDevices.getUserMedia({
                        audio: true,
                        video: true
                    });

                localStream.current = stream;

                localAudio.current.srcObject = stream;

                localVideo.current.srcObject = stream;

                const peer = createPeer();

                stream.getTracks().forEach(track => {

                    peer.addTrack(track, stream);

                });

                await peer.setRemoteDescription(offer);

                const answer = await peer.createAnswer();

                await peer.setLocalDescription(answer);

                socket.emit("answer_call", {

                    to: from,
                    answer

                });

            } catch {

                alert("No microphone detected.");

            }

        });

        socket.on("call_accepted", async (answer) => {

            if (pc.current) {

                await pc.current.setRemoteDescription(answer);

            }

        });

        socket.on("receive_ice_candidate", async (candidate) => {

            if (pc.current) {

                await pc.current.addIceCandidate(candidate);

            }

        });

        socket.on("call_ended", () => {

            pc.current?.close();

        });

        return () => {

            socket.off("incoming_call");
            socket.off("call_accepted");
            socket.off("receive_ice_candidate");
            socket.off("call_ended");

        };

    }, []);

    const call = async () => {

        try {

            const stream =
                await navigator.mediaDevices.getUserMedia({
                    audio: true,
                    video: true
                });

            localStream.current = stream;

            localAudio.current.srcObject = stream;

            localVideo.current.srcObject = stream;

            const peer = createPeer();

            stream.getTracks().forEach(track => {

                peer.addTrack(track, stream);

            });

            const offer = await peer.createOffer();

            await peer.setLocalDescription(offer);

            socket.emit("call_user", {

                from: currentUser,
                to: selectedUser,
                offer

            });

        } catch {

            alert("No microphone detected.");

        }

    };

    const endCall = () => {

        pc.current?.close();

        socket.emit("end_call", {

            to: selectedUser

        });

    };

    return (

        /*
         * These elements only exist to hold the WebRTC
         * media streams (srcObject) - the actual call UI
         * is rendered by <CallScreen/>. They must stay
         * mounted (not conditionally rendered) so the refs
         * are always ready, but they must never take up
         * layout space - previously they had no sizing
         * safeguard, so every open conversation showed two
         * full-width "broken video" placeholders under the
         * input bar.
         */

        <div className="call-media-holder" aria-hidden="true">

            <audio
                ref={localAudio}
                autoPlay
                muted
            />

            <video
                ref={localVideo}
                autoPlay
                muted
                playsInline
            />

            <audio
                ref={remoteAudio}
                autoPlay
            />

            <video
                ref={remoteVideo}
                autoPlay
                playsInline
            />

        </div>

    );

}

export default Call;