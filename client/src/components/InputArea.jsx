import { useEffect, useState } from "react";

import ChatInput from "./ChatInput";
import AttachmentMenu from "./AttachmentMenu";

import api from "../services/api";

function InputArea({
    selectedUser,
    search,
    searchMessages,
    typingUser,
    replyMessage,
    setReplyMessage,
    send,
    typing,
    stopTyping,
    user,
    socket,

    translationEnabled = false,
    translationLanguage = "en"
}) {

    const [inputText, setInputText] = useState("");
    const [translatedPreview, setTranslatedPreview] = useState("");
    const [translationLoading, setTranslationLoading] = useState(false);
    const [sendAsTranslated, setSendAsTranslated] = useState(false);


    /*
    =========================================================
    TRANSLATION
    =========================================================
    */

    useEffect(() => {

        if (
            !translationEnabled ||
            !inputText.trim()
        ) {
            setTranslatedPreview("");
            setTranslationLoading(false);
            setSendAsTranslated(false);

            return;
        }


        const timer = setTimeout(async () => {

            try {

                setTranslationLoading(true);

                const res = await api.post(
                    "/translate",
                    {
                        text: inputText,
                        targetLanguage: translationLanguage
                    }
                );

                setTranslatedPreview(
                    res.data.translatedText || ""
                );

            } catch (err) {

                console.error(
                    "Translation failed:",
                    err
                );

                setTranslatedPreview("");

            } finally {

                setTranslationLoading(false);

            }

        }, 600);


        return () => clearTimeout(timer);

    }, [
        inputText,
        translationEnabled,
        translationLanguage
    ]);


    /*
    =========================================================
    SEND TEXT
    =========================================================
    */

    const handleSend = () => {

        const originalText = inputText.trim();

        if (!originalText) {
            return;
        }


        const translatedText =
            translatedPreview?.trim() || "";


        /*
        Send through Chat.jsx so its existing
        group/private-message logic remains intact.
        */

        send(
            sendAsTranslated && translatedText
                ? translatedText
                : originalText,
            {
                originalMessage: originalText,

                translatedMessage:
                    translationEnabled &&
                    translatedText
                        ? translatedText
                        : null,

                translationEnabled:
                    translationEnabled &&
                    !!translatedText
            }
        );


        setInputText("");
        setTranslatedPreview("");
        setSendAsTranslated(false);

    };


    /*
    =========================================================
    IMAGE
    =========================================================
    */

    const sendImage = (imageUrl) => {

        if (selectedUser.startsWith("group_")) {

            socket.emit(
                "send_group_message",
                {
                    groupId:
                        selectedUser.replace(
                            "group_",
                            ""
                        ),

                    sender: user.username,

                    image: imageUrl,

                    message: "",

                    audio: "",

                    file: "",

                    fileName: "",

                    replyTo:
                        replyMessage?.id || null
                }
            );

        } else {

            socket.emit(
                "send_message",
                {
                    sender: user.username,

                    receiver: selectedUser,

                    image: imageUrl,

                    message: "",

                    replyTo:
                        replyMessage?.id
                }
            );

        }

        setReplyMessage(null);

    };


    /*
    =========================================================
    AUDIO
    =========================================================
    */

    const sendAudio = (audioUrl) => {

        if (selectedUser.startsWith("group_")) {

            socket.emit(
                "send_group_message",
                {
                    groupId:
                        selectedUser.replace(
                            "group_",
                            ""
                        ),

                    sender: user.username,

                    audio: audioUrl,

                    message: "",

                    image: "",

                    file: "",

                    fileName: "",

                    replyTo:
                        replyMessage?.id || null
                }
            );

        } else {

            socket.emit(
                "send_message",
                {
                    sender: user.username,

                    receiver: selectedUser,

                    audio: audioUrl,

                    image: "",

                    message: "",

                    replyTo:
                        replyMessage?.id
                }
            );

        }

        setReplyMessage(null);

    };


    /*
    =========================================================
    FILE
    =========================================================
    */

    const sendFile = (fileData) => {

        if (selectedUser.startsWith("group_")) {

            socket.emit(
                "send_group_message",
                {
                    groupId:
                        selectedUser.replace(
                            "group_",
                            ""
                        ),

                    sender: user.username,

                    file: fileData.url,

                    fileName: fileData.name,

                    message: "",

                    image: "",

                    audio: "",

                    replyTo:
                        replyMessage?.id || null
                }
            );

        } else {

            socket.emit(
                "send_message",
                {
                    sender: user.username,

                    receiver: selectedUser,

                    file: fileData.url,

                    fileName: fileData.name,

                    message: "",

                    image: "",

                    audio: "",

                    replyTo:
                        replyMessage?.id
                }
            );

        }

        setReplyMessage(null);

    };


    if (!selectedUser) {
        return null;
    }


    return (

        <div className="input-area">


            {/* TYPING */}

            {typingUser && (

                <p className="typing-text">

                    {typingUser} is typing...

                </p>

            )}


            {/* REPLY */}

            {replyMessage && (

                <div className="reply-box">

                    <b>
                        Replying to {replyMessage.sender}
                    </b>

                    <br />

                    {
                        replyMessage.message ||

                        (replyMessage.image &&
                            "📷 Image") ||

                        (replyMessage.audio &&
                            "🎤 Voice") ||

                        (replyMessage.file &&
                            "📎 File")
                    }

                    <br />

                    <button
                        type="button"
                        onClick={() =>
                            setReplyMessage(null)
                        }
                    >
                        Cancel
                    </button>

                </div>

            )}


            {/* CHAT INPUT */}

            <ChatInput
                value={inputText}

                onChange={setInputText}

                onSend={handleSend}

                onTyping={typing}

                onStopTyping={stopTyping}

                attachment={

                    <AttachmentMenu
                        sendImage={sendImage}
                        sendFile={sendFile}
                    />

                }

                onSendAudio={sendAudio}
            />


            {/* TRANSLATION PREVIEW */}

            {translationEnabled &&
                inputText.trim() && (

                    <div className="translation-preview">

                        <div className="translation-preview-header">

                            <span>
                                Translation
                            </span>

                            {translationLoading && (

                                <span>
                                    Translating…
                                </span>

                            )}

                        </div>


                        {!translationLoading &&
                            translatedPreview && (

                                <>

                                    <div className="translation-preview-text">

                                        {translatedPreview}

                                    </div>


                                    <div className="translation-choice">

                                        <button
                                            type="button"
                                            className={
                                                !sendAsTranslated
                                                    ? "active"
                                                    : ""
                                            }
                                            onClick={() =>
                                                setSendAsTranslated(
                                                    false
                                                )
                                            }
                                        >
                                            Original
                                        </button>


                                        <button
                                            type="button"
                                            className={
                                                sendAsTranslated
                                                    ? "active"
                                                    : ""
                                            }
                                            onClick={() =>
                                                setSendAsTranslated(
                                                    true
                                                )
                                            }
                                        >
                                            Translated
                                        </button>

                                    </div>

                                </>

                            )}

                    </div>

                )}

        </div>

    );

}

export default InputArea;