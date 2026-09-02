import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";
import socket from "../services/socket";

/*
 * The actual WebRTC engine for voice/video calls.
 *
 * This used to be a self-contained component with its own
 * call()/endCall() functions and its own hidden <video>/<audio>
 * elements - but nothing in the rest of the app ever called
 * call()/endCall(). The header's call buttons just flipped a
 * boolean to show <CallScreen>, which faked "connected" after a
 * 2 second timer. No offer/answer/ICE ever reached the other
 * device, so nobody ever actually got a call.
 *
 * This version does nothing by itself - Chat.jsx drives it
 * through the ref API below, and gets the live MediaStreams back
 * through the on*Stream callbacks so CallScreen can render real
 * audio/video instead of a mock.
 */

const Call = forwardRef(function Call(
    {
        currentUser,
        onIncomingCall,   // ({ from, callType }) => void
        onRinging,        // () => void
        onConnected,      // () => void
        onEnded,          // (reason: "ended" | "rejected" | "failed") => void
        onLocalStream,    // (MediaStream | null) => void
        onRemoteStream,   // (MediaStream | null) => void
        onError           // (message: string) => void
    },
    ref
) {

    const pc = useRef(null);
    const localStreamRef = useRef(null);
    const remotePeerRef = useRef(null);
    const pendingCandidatesRef = useRef([]);
    const pendingIncomingRef = useRef(null);

    const cleanup = () => {

        if (pc.current) {
            pc.current.close();
            pc.current = null;
        }

        if (localStreamRef.current) {
            localStreamRef.current.getTracks().forEach(track => track.stop());
            localStreamRef.current = null;
        }

        pendingCandidatesRef.current = [];
        pendingIncomingRef.current = null;
        remotePeerRef.current = null;

        onLocalStream?.(null);
        onRemoteStream?.(null);

    };

    const flushCandidates = async () => {

        const queued = pendingCandidatesRef.current;
        pendingCandidatesRef.current = [];

        for (const candidate of queued) {

            try {
                await pc.current.addIceCandidate(candidate);
            } catch (err) {
                console.error("ICE candidate error:", err);
            }

        }

    };

    const createPeer = (remoteUser) => {

        const peer = new RTCPeerConnection({

            iceServers: [

                { urls: "stun:stun.l.google.com:19302" },
                { urls: "stun:stun1.l.google.com:19302" }

            ]

        });

        peer.onicecandidate = (event) => {

            if (event.candidate) {

                socket.emit("ice_candidate", {
                    to: remoteUser,
                    candidate: event.candidate
                });

            }

        };

        peer.ontrack = (event) => {
            onRemoteStream?.(event.streams[0]);
        };

        peer.onconnectionstatechange = () => {

            if (peer.connectionState === "failed") {

                onError?.("The call connection was lost.");
                hangUp("failed");

            }

        };

        pc.current = peer;
        remotePeerRef.current = remoteUser;

        return peer;

    };

    const getMedia = async (callType) => {

        try {

            return await navigator.mediaDevices.getUserMedia({
                audio: true,
                video: callType === "video"
            });

        } catch (err) {

            throw new Error(
                err?.name === "NotAllowedError" || err?.name === "PermissionDeniedError"
                    ? "Microphone/camera permission was denied."
                    : "Could not access the microphone/camera on this device."
            );

        }

    };

    function hangUp() {

        if (remotePeerRef.current) {
            socket.emit("end_call", { to: remotePeerRef.current });
        }

        cleanup();

    }

    useEffect(() => {

        const handleIncoming = ({ from, offer, callType }) => {

            // Already on a call - politely decline instead of
            // silently dropping the offer on the floor.
            if (pc.current || pendingIncomingRef.current) {
                socket.emit("reject_call", { to: from });
                return;
            }

            pendingIncomingRef.current = {
                from,
                offer,
                callType: callType === "video" ? "video" : "audio"
            };

            onIncomingCall?.({
                from,
                callType: pendingIncomingRef.current.callType
            });

        };

        const handleAccepted = async (answer) => {

            try {

                if (!pc.current) return;

                await pc.current.setRemoteDescription(answer);
                await flushCandidates();

                onConnected?.();

            } catch (err) {

                console.error(err);
                onError?.("Could not complete the call.");

            }

        };

        const handleIceCandidate = async (candidate) => {

            if (pc.current && pc.current.remoteDescription) {

                try {
                    await pc.current.addIceCandidate(candidate);
                } catch (err) {
                    console.error("ICE candidate error:", err);
                }

            } else {

                pendingCandidatesRef.current.push(candidate);

            }

        };

        const handleEnded = () => {
            cleanup();
            onEnded?.("ended");
        };

        const handleRejected = () => {
            cleanup();
            onEnded?.("rejected");
        };

        socket.on("incoming_call", handleIncoming);
        socket.on("call_accepted", handleAccepted);
        socket.on("receive_ice_candidate", handleIceCandidate);
        socket.on("call_ended", handleEnded);
        socket.on("call_rejected", handleRejected);
        // some backends echo the caller's own event name back -
        // listen for both so a decline is never silently missed.
        socket.on("reject_call", handleRejected);

        return () => {

            socket.off("incoming_call", handleIncoming);
            socket.off("call_accepted", handleAccepted);
            socket.off("receive_ice_candidate", handleIceCandidate);
            socket.off("call_ended", handleEnded);
            socket.off("call_rejected", handleRejected);
            socket.off("reject_call", handleRejected);

        };

    }, []);

    useImperativeHandle(ref, () => ({

        async startCall(remoteUser, callType) {

            try {

                const stream = await getMedia(callType);

                localStreamRef.current = stream;
                onLocalStream?.(stream);

                const peer = createPeer(remoteUser);

                stream.getTracks().forEach(track => peer.addTrack(track, stream));

                const offer = await peer.createOffer();
                await peer.setLocalDescription(offer);

                socket.emit("call_user", {
                    from: currentUser,
                    to: remoteUser,
                    offer,
                    callType
                });

                onRinging?.();

            } catch (err) {

                console.error(err);
                onError?.(err.message || "Could not start the call.");
                cleanup();

            }

        },

        async acceptCall() {

            const pending = pendingIncomingRef.current;

            if (!pending) return;

            try {

                const stream = await getMedia(pending.callType);

                localStreamRef.current = stream;
                onLocalStream?.(stream);

                const peer = createPeer(pending.from);

                stream.getTracks().forEach(track => peer.addTrack(track, stream));

                await peer.setRemoteDescription(pending.offer);
                await flushCandidates();

                const answer = await peer.createAnswer();
                await peer.setLocalDescription(answer);

                socket.emit("answer_call", {
                    to: pending.from,
                    answer
                });

                pendingIncomingRef.current = null;

                onConnected?.();

            } catch (err) {

                console.error(err);
                onError?.(err.message || "Could not accept the call.");
                socket.emit("reject_call", { to: pending.from });
                cleanup();

            }

        },

        declineCall() {

            const pending = pendingIncomingRef.current;

            if (pending) {
                socket.emit("reject_call", { to: pending.from });
            }

            pendingIncomingRef.current = null;

        },

        hangUp,

        toggleMute(muted) {

            localStreamRef.current?.getAudioTracks().forEach(track => {
                track.enabled = !muted;
            });

        },

        toggleVideo(enabled) {

            localStreamRef.current?.getVideoTracks().forEach(track => {
                track.enabled = enabled;
            });

        }

    }));

    // No DOM footprint - CallScreen owns the actual <video>/<audio>
    // elements, this only drives the streams behind them.
    return null;

});

export default Call;
