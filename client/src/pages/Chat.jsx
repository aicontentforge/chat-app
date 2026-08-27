import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/chat.css";

import api from "../services/api";
import socket from "../services/socket";
import { API_ORIGIN } from "../config";

import ChatBox from "../components/ChatBox";
import ChatInput from "../components/ChatInput";
import UserList from "../components/UserList";

import ImageUpload from "../components/ImageUpload";

import AudioRecorder from "../components/AudioRecorder";
import FileUpload from "../components/FileUpload";

import "../styles/header.css";
import "../styles/input.css";
import { useTheme } from "../context/ThemeContext";
import Dashboard from "../components/Dashboard";
import Header from "../components/Header";
import InfoPanel from "../components/InfoPanel";
import InputArea from "../components/InputArea";
import NewChatModal from "../components/NewChatModal";
import MoreMenu from "../components/MoreMenu";
import ProfileModal from "../components/ProfileModal";
import FileGallery from "../components/FileGallery";
import SearchConversation from "../components/SearchConversation";
import MediaGallery from "../components/MediaGallery";
import LinksGallery from "../components/LinksGallery";
import StarredMessages from "../components/StarredMessages";
import WallpaperModal from "../components/WallpaperModal";
import CallScreen from "../components/CallScreen";
import AddPeopleSheet from "../components/AddPeopleSheet";
import ForwardModal from "../components/ForwardModal";
import SelectionBar from "../components/SelectionBar";


function Chat() {
    const navigate = useNavigate();
    const { theme, toggleTheme } = useTheme();

    const user = (() => {
        try {
            return JSON.parse(localStorage.getItem("user"));
        } catch {
            return null;
        }
    })();

    const [messages, setMessages] = useState([]);
    const [onlineUsers, setOnlineUsers] = useState([]);
    const [conversations, setConversations] = useState([]);
    const [selectedUser, setSelectedUser] = useState(

        localStorage.getItem("selectedUser") || null

    );
    const [typingUser, setTypingUser] = useState("");
    const [allUsers, setAllUsers] = useState([]);
    const [replyMessage, setReplyMessage] = useState(null);
    const [search, setSearch] = useState("");
    const [lastSeen, setLastSeen] = useState(null);
    const [groups, setGroups] = useState([]);
    const [selectMode, setSelectMode] = useState(false);
    const [selectedMsgIds, setSelectedMsgIds] = useState([]);
    const [forwardMessages, setForwardMessages] = useState(null);
    const [showDashboard, setShowDashboard] = useState(
        () => !localStorage.getItem("selectedUser")
    );
    const [showNewChat, setShowNewChat] = useState(false);
    const [showMoreMenu, setShowMoreMenu] = useState(false);
    const [showInfoPanel, setShowInfoPanel] = useState(false);
    const [showProfileModal, setShowProfileModal] = useState(false);
    const [profileData, setProfileData] = useState(null);
    const [showMedia, setShowMedia] = useState(false);

    const [media, setMedia] = useState([]);
    const [showFiles, setShowFiles] = useState(false);

    const [sharedFiles, setSharedFiles] = useState([]);
    const [showVoiceGallery,setShowVoiceGallery]=useState(false);

    const [voiceMessages,setVoiceMessages]=useState([]);
    const [showLinks,setShowLinks]=useState(false);

    const [sharedLinks,setSharedLinks]=useState([]);
    const [showSearchConversation,setShowSearchConversation]=useState(false);

    const [conversationResults,setConversationResults]=useState([]);
    const [showStarredMessages, setShowStarredMessages] = useState(false);
    const [starredMessages, setStarredMessages] = useState([]);
    const [showWallpaper, setShowWallpaper] = useState(false);
    const [wallpaper, setWallpaper] = useState(
    localStorage.getItem("wallpaper") || ""
    );
    const [blocked, setBlocked] = useState(false);
    const [menuPosition, setMenuPosition] = useState({
    top: 0,
    left: 0
});
    const [isCallActive, setIsCallActive] = useState(false);

    const [callType, setCallType] = useState("audio");
    const [showAddPeople, setShowAddPeople] = useState(false);

    const [callParticipants, setCallParticipants] = useState([]);
    const [translationEnabled, setTranslationEnabled] =
    useState(
        localStorage.getItem("translationEnabled") === "true"
    );

const [translationLanguage, setTranslationLanguage] =
    useState(
        localStorage.getItem("translationLanguage") || "en"
    );

    const [sidebarOpen, setSidebarOpen] = useState(false);

const chatMainRef = useRef(null);
const sidebarRef = useRef(null);
    



    useEffect(() => {
    if (!user) {
        navigate("/login");
    }
}, [user, navigate]);


// Connect socket once
useEffect(() => {

        if ("Notification" in window) {

            if (Notification.permission !== "granted") {

                Notification.requestPermission();

            }

        }


        socket.connect();

        api.get("/users").then(res => {

            setAllUsers(res.data);

        });

        api.get(`/groups/${user.username}`).then(res => {

            setGroups(res.data);

        });

        socket.emit("join", user.username);

        socket.on("online_users", (users) => {
            setOnlineUsers(users);
        });

        socket.on("typing", (data) => {
            setTypingUser(data.sender);
        });

        socket.on("stop_typing", () => {
            setTypingUser("");
        });

        socket.on("message_deleted", (id) => {

            setMessages(prev =>
                prev.filter(msg => msg.id !== id)
            );

        });

        socket.on("message_blocked", () => {

    alert("This user has blocked you.");

});

        socket.on("receive_group_message", (msg) => {

            setMessages(prev => [...prev, msg]);

            if (

                msg.sender !== user.username &&

                document.hidden &&

                Notification.permission === "granted"

            ) {

                new Notification(

                    `${msg.sender} (Group)`,

                    {

                        body:

                            msg.message ||

                            (msg.image && "📷 Image") ||

                            (msg.audio && "🎤 Voice Message") ||

                            (msg.file && "📎 File")

                    }

                );

            }

        });

        socket.on("receive_message", async (msg) => {

    setMessages((prev) => {

        const exists = prev.some(m => m.id === msg.id);

        if (exists) return prev;

        return [...prev, msg];

    });

    const muted = await api.get(
        `/users/is-muted/${user.username}/${msg.sender}`
    );

    if (
        !muted.data.muted &&
        msg.sender !== user.username &&
        document.hidden &&
        Notification.permission === "granted"
    ) {

        new Notification(msg.sender, {
            body:
                msg.message ||
                (msg.image && "📷 Image") ||
                (msg.audio && "🎤 Voice Message") ||
                (msg.file && "📎 File"),

            icon: user.avatar
                ? `${API_ORIGIN}${user.avatar}`
                : undefined
        });

    }

    setConversations(prev => {

    const otherUser =
        msg.sender === user.username
            ? msg.receiver
            : msg.sender;

    const updated = prev.filter(chat => {

        const chatUser =
            chat.sender === user.username
                ? chat.receiver
                : chat.sender;

        return chatUser !== otherUser;

    });

    const next = [
        {
            sender: msg.sender,
            receiver: msg.receiver,
            message: msg.message,
            time: msg.time,
            seen: msg.seen
        },
        ...updated
    ];

    localStorage.setItem(
        "chatConversations",
        JSON.stringify(next)
    );

    return next;
});

});
        socket.on("messages_seen", () => {

            setMessages(prev =>

                prev.map(msg => ({

                    ...msg,

                    seen: 1

                }))

            );

        });


        
        socket.on("message_reacted", (data) => {

    console.log("Reaction event:", data);

    setMessages(prev => {

        console.log("Messages:", prev);

        return prev.map(msg => {

            if (msg.id === data.id) {

                console.log("Matched message", msg.id);

                return {
                    ...msg,
                    reaction: data.reaction
                };

            }

            return msg;

        });

    });

});


        socket.on("message_pinned", (data) => {

            setMessages(prev =>

                prev.map(msg =>

                    msg.id === data.id

                        ? {

                            ...msg,

                            pinned: data.pinned

                        }

                        : msg

                )

            );

        });


        socket.on("message_edited", (data) => {

            setMessages(prev =>

                prev.map(msg =>

                    msg.id === data.id

                        ? {

                            ...msg,

                            message: data.message,

                            edited: 1,

                            editedTime: data.editedTime

                        }

                        : msg

                )

            );

        });

        return () => {
            socket.off("online_users");
            socket.off("typing");
            socket.off("stop_typing");
            socket.off("receive_message");
            socket.off("messages_seen");
            socket.off("message_reacted");
            socket.off("message_pinned");
            socket.off("message_deleted");
            socket.off("message_edited");
            socket.off("receive_group_message");
            socket.off("message_blocked");

            socket.disconnect();
        };
    }, []);

    // Load messages whenever a user is selected
    useEffect(() => {

    api.get(`/messages/conversations/${user.username}`).then(res => {

    setConversations(res.data);

    localStorage.setItem(
        "chatConversations",
        JSON.stringify(res.data)
    );

});

    if (!selectedUser) return;

    const checkBlocked = async () => {

    try {

        const res = await api.get(
            `/users/is-blocked/${selectedUser}/${user.username}`
        );

        setBlocked(res.data.blocked);

    } catch (err) {

        console.log(err);

    }

};

checkBlocked();

    if (selectedUser.startsWith("group_")) {

    const groupId = selectedUser.replace("group_", "");

    socket.emit("join_group", groupId);

    api
        .get(`/groups/messages/${groupId}`)
        .then(res => {

            setMessages(res.data);

        });

    return;

}

    api
    .get(`/users/lastseen/${selectedUser}`)
    .then(res => {

        setLastSeen(res.data.lastSeen);

    });

    api
        .get(`/messages/${user.username}/${selectedUser}`)
        .then(res => {

            setMessages(res.data);
            api
                .get(`/messages/conversations/${user.username}`)
                .then(res => {

                    setConversations(res.data);

                });

            socket.emit("seen_messages", {

                sender: selectedUser,

                receiver: user.username

            });

        });

}, [selectedUser]);

// ========================================
// MOBILE SIDEBAR SWIPE GESTURE
// ========================================

useEffect(() => {

    const chatMain = chatMainRef.current;

    if (!chatMain) return;


    let touchStartX = 0;
    let touchStartY = 0;


    const handleTouchStart = (e) => {

        if (window.innerWidth >= 768) return;

        const touch = e.touches[0];

        touchStartX = touch.clientX;
        touchStartY = touch.clientY;

    };


    const handleTouchEnd = (e) => {

        if (window.innerWidth >= 768) return;

        const touch = e.changedTouches[0];

        const deltaX =
            touch.clientX - touchStartX;

        const deltaY =
            touch.clientY - touchStartY;


        // Must be primarily horizontal
        if (Math.abs(deltaX) <= Math.abs(deltaY)) {
            return;
        }


        // Minimum swipe distance
        if (Math.abs(deltaX) < 60) {
            return;
        }


        // Finger moved left → right, starting near
        // the screen edge (like a native drawer)
        // OPEN SIDEBAR
        if (deltaX > 0 && touchStartX < 40) {

            setSidebarOpen(true);

        }


        // Finger moved right → left
        // CLOSE SIDEBAR
        else if (deltaX < 0) {

            setSidebarOpen(false);

        }

    };


    chatMain.addEventListener(
        "touchstart",
        handleTouchStart,
        { passive: true }
    );

    chatMain.addEventListener(
        "touchend",
        handleTouchEnd,
        { passive: true }
    );


    return () => {

        chatMain.removeEventListener(
            "touchstart",
            handleTouchStart
        );

        chatMain.removeEventListener(
            "touchend",
            handleTouchEnd
        );

    };

}, []);

// ========================================
// SWIPE-TO-CLOSE ON THE OPEN SIDEBAR ITSELF
// ========================================

useEffect(() => {

    const sidebarEl = sidebarRef.current;

    if (!sidebarEl || !sidebarOpen) return;


    let touchStartX = 0;
    let touchStartY = 0;

    const handleTouchStart = (e) => {

        const touch = e.touches[0];

        touchStartX = touch.clientX;
        touchStartY = touch.clientY;

    };

    const handleTouchEnd = (e) => {

        const touch = e.changedTouches[0];

        const deltaX = touch.clientX - touchStartX;
        const deltaY = touch.clientY - touchStartY;

        if (Math.abs(deltaX) <= Math.abs(deltaY)) return;
        if (deltaX > -50) return;

        setSidebarOpen(false);

    };

    sidebarEl.addEventListener(
        "touchstart",
        handleTouchStart,
        { passive: true }
    );

    sidebarEl.addEventListener(
        "touchend",
        handleTouchEnd,
        { passive: true }
    );

    return () => {

        sidebarEl.removeEventListener(
            "touchstart",
            handleTouchStart
        );

        sidebarEl.removeEventListener(
            "touchend",
            handleTouchEnd
        );

    };

}, [sidebarOpen]);

    const typing = () => {
        if (!selectedUser) return;

        socket.emit("typing", {
            sender: user.username,
            receiver: selectedUser
        });
    };

    const stopTyping = () => {
        if (!selectedUser) return;

        socket.emit("stop_typing", {
            sender: user.username,
            receiver: selectedUser
        });
    };

    const send = (text, translation = {}) => {

    if (!selectedUser) return;

    const {
        originalMessage = text,
        translatedMessage = null,
        translationEnabled = false
    } = translation;


    // ==============================
    // GROUP MESSAGE
    // ==============================

    if (selectedUser.startsWith("group_")) {

        const groupId =
            selectedUser.replace("group_", "");

        socket.emit("send_group_message", {

            groupId,

            sender: user.username,

            message: text,

            originalMessage,

            translatedMessage,

            translationEnabled,

            image: "",
            audio: "",
            file: "",
            fileName: "",

            replyTo: replyMessage?.id || null

        });

        setReplyMessage(null);

        return;
    }


    // ==============================
    // PRIVATE MESSAGE
    // ==============================

    socket.emit("send_message", {

        sender: user.username,

        receiver: selectedUser,

        message: text,

        originalMessage,

        translatedMessage,

        translationEnabled,

        image: "",
        audio: "",
        file: "",
        fileName: "",

        replyTo: replyMessage?.id || null

    });

    setReplyMessage(null);
};

    

    const logout = () => {
        localStorage.removeItem("user");
        localStorage.removeItem("selectedUser");
        socket.disconnect();
        navigate("/login");
    };

    const searchMessages = (text) => {

    setSearch(text);

    if (!selectedUser) return;

    if (text.trim() === "") {

        api
            .get(`/messages/${user.username}/${selectedUser}`)
            .then(res => {

                setMessages(res.data);

            });

        return;

    }

    api
        .get(`/messages/search/${user.username}/${selectedUser}/${text}`)
        .then(res => {

            setMessages(res.data);

        });

};

const openMoreMenu = (e) => {

    const rect = e.currentTarget.getBoundingClientRect();

    const menuWidth = 230;

    // Clamp so the dropdown can never render partly off-screen
    // on narrow phones (it used to be anchored purely off the
    // button's position with no viewport check).
    const left = Math.min(
        Math.max(8, rect.right - menuWidth),
        window.innerWidth - menuWidth - 8
    );

    setMenuPosition({
        top: rect.bottom + 8,
        left
    });

    setShowMoreMenu(true);
};

const closeMoreMenu = () => {
    setShowMoreMenu(false);
};

    const pinChat = async (chatUser) => {

    const res = await api.post("/users/pin-chat", {

        username: user.username,

        chatUser

    });

    const pinned = res.data.pinned;

    setConversations(prev => {

        return [...prev].sort((a, b) => {

            const aUser =
                a.sender === user.username
                    ? a.receiver
                    : a.sender;

            const bUser =
                b.sender === user.username
                    ? b.receiver
                    : b.sender;

            const aPinned = pinned.includes(aUser);

            const bPinned = pinned.includes(bUser);

            if (aPinned && !bPinned) return -1;

            if (!aPinned && bPinned) return 1;

            return 0;

        });

    });

};


    const startVoiceCall = async () => {

    if (!selectedUser) return;

    try {

        await navigator.mediaDevices.getUserMedia({
            audio: true
        });

        setCallParticipants([]);

        setCallType("audio");

        setIsCallActive(true);

    } catch {

        alert("Microphone permission denied.");

    }

};


const startVideoCall = async () => {

    if (!selectedUser) return;

    try {

        await navigator.mediaDevices.getUserMedia({
            audio: true,
            video: true
        });

        setCallParticipants([]);

        setCallType("video");

        setIsCallActive(true);

    } catch {

        alert("Camera or microphone permission denied.");

    }

};


const endCall = () => {

    setIsCallActive(false);

};

const handleStar = (id) => {

    socket.emit("react_message", {

        id,
        reaction: "⭐"

    });

};


/* =========================
   MULTI-SELECT MESSAGES
========================= */

const enterSelectMode = (id) => {
    setSelectMode(true);
    setSelectedMsgIds([id]);
};

const toggleMsgSelect = (id) => {
    setSelectedMsgIds((prev) =>
        prev.includes(id)
            ? prev.filter((item) => item !== id)
            : [...prev, id]
    );
};

const exitSelectMode = () => {
    setSelectMode(false);
    setSelectedMsgIds([]);
};

const getSelectedMessages = () =>
    messages.filter((m) => selectedMsgIds.includes(m.id));

const canBulkDelete =
    selectedMsgIds.length > 0 &&
    getSelectedMessages().every(
        (m) => m.sender === user.username
    );

const bulkForward = () => {
    const picked = getSelectedMessages();
    if (picked.length === 0) return;
    setForwardMessages(picked);
};

const bulkPin = () => {
    selectedMsgIds.forEach((id) => {
        socket.emit("pin_message", { id, pinned: true });
    });
    exitSelectMode();
};

const bulkReact = (emoji) => {
    selectedMsgIds.forEach((id) => {
        socket.emit("react_message", { id, reaction: emoji });
    });
    exitSelectMode();
};

const bulkReply = () => {
    const picked = getSelectedMessages();
    if (picked.length === 0) return;

    const combinedText = picked
        .map((m) =>
            m.message ||
            (m.image && "📷 Photo") ||
            (m.audio && "🎤 Voice message") ||
            (m.file && "📎 File") ||
            ""
        )
        .filter(Boolean)
        .join("  •  ");

    setReplyMessage({
        id: null,
        sender: `${picked.length} messages`,
        message: combinedText
    });

    exitSelectMode();
};

const bulkDelete = () => {
    selectedMsgIds.forEach((id) => {
        socket.emit("delete_message", id);
    });
    exitSelectMode();
};


/* =========================
   FORWARD
========================= */

const sendForward = (targets) => {

    if (!forwardMessages || forwardMessages.length === 0) return;

    targets.forEach((target) => {

        const isGroup = target.startsWith("group_");
        const groupId = isGroup
            ? target.replace("group_", "")
            : null;

        forwardMessages.forEach((msg) => {

            const payload = {
                sender: user.username,
                message: msg.message || "",
                image: msg.image || "",
                audio: msg.audio || "",
                file: msg.file || "",
                fileName: msg.fileName || "",
                replyTo: null
            };

            if (isGroup) {

                socket.emit("send_group_message", {
                    ...payload,
                    groupId
                });

            } else {

                socket.emit("send_message", {
                    ...payload,
                    receiver: target
                });

            }

        });

    });

    setForwardMessages(null);
    exitSelectMode();

};


/*
 Leaving the current chat should also leave any
 in-progress selection behind.
*/
useEffect(() => {
    setSelectMode(false);
    setSelectedMsgIds([]);
}, [selectedUser]);

const handleAddPeople = (usernames) => {

    if (!usernames || usernames.length === 0) {
        return;
    }

    setCallParticipants((prev) => {

        const existing = new Set(prev);

        const merged = [
            ...prev,
            ...usernames.filter(
                username => !existing.has(username)
            )
        ];

        return merged;

    });

    setShowAddPeople(false);

};


const openAddPeopleSheet = () => {

    setShowAddPeople(true);

};

const closeAddPeopleSheet = () => {

    setShowAddPeople(false);

};



const reportUser = async () => {

    if (!selectedUser) return;

    if (!window.confirm(`Report ${selectedUser}?`))
        return;

    try {

        await api.post("/users/report", {

            reporter: user.username,

            reported: selectedUser

        });

        alert("User reported successfully.");

        setShowMoreMenu(false);

    } catch (err) {

        console.log(err);

    }

};

const clearChat = async () => {

    if (!selectedUser) return;

    if (!window.confirm("Clear this conversation?"))
        return;

    try {

        await api.delete(
            `/messages/clear/${user.username}/${selectedUser}`
        );

        setMessages([]);

        setShowMoreMenu(false);

    } catch (err) {

        console.log(err);

    }

};

const openProfile = async () => {

    try {

        const res = await api.get(
            `/users/profile/${selectedUser}`
        );

        setProfileData(res.data);

        setShowProfileModal(true);

    } catch (err) {

        console.error(err);

    }

};

const closeProfile = () => {
    setShowProfileModal(false);
};


const openSharedMedia = async () => {

    try{

        const res = await api.get(

            `/messages/media/${user.username}/${selectedUser}`

        );

        setMedia(res.data);

        setShowMedia(true);

    }

    catch(err){

        console.log(err);

    }

};

const openFiles = async () => {

    try {

        const res = await api.get(

            `/messages/files/${user.username}/${selectedUser}`

        );

        setSharedFiles(res.data);

        setShowFiles(true);

    }

    catch (err) {

        console.log(err);

    }

};

const openVoiceMessages = async()=>{

    const res = await api.get(
        `/messages/voices/${user.username}/${selectedUser}`
    );

    setVoiceMessages(res.data);

    setShowVoiceGallery(true);

};

const openLinks = async()=>{

    const res = await api.get(

`/messages/links/${user.username}/${selectedUser}`

    );

    setSharedLinks(res.data);

    setShowLinks(true);

};

const searchConversation = async (keyword) => {

    if (!selectedUser) return;

    if (keyword.trim() === "") {

        setConversationResults([]);

        return;

    }

    try {

        const res = await api.get(

            `/messages/search-all/${user.username}/${selectedUser}/${keyword}`

        );

        setConversationResults(res.data);

    }

    catch (err) {

        console.log(err);

    }

};

const openSearch = () => {

    setShowSearchConversation(true);

};

const openStarredMessages = async () => {

    try {

        const res = await api.get(
            `/messages/starred/${user.username}/${selectedUser}`
        );

        setStarredMessages(res.data);

        setShowStarredMessages(true);

    } catch (err) {

        console.log(err);

    }

};


const changeWallpaper = () => {
    setShowWallpaper(true);
};

const selectWallpaper = (img) => {
    setWallpaper(img);
    localStorage.setItem("wallpaper", img);
    setShowWallpaper(false);
};



const toggleMute = async () => {

    if (!selectedUser) return;

    try {

        const res = await api.post(
            "/users/toggle-mute",
            {
                username: user.username,
                mutedUser: selectedUser
            }
        );

        alert(
            res.data.muted
                ? "Conversation muted."
                : "Conversation unmuted."
        );

    } catch (err) {

        console.log(err);

    }

};


const exportChat = async () => {

    if (!selectedUser) return;

    try {

        const res = await api.get(
            `/messages/export/${user.username}/${selectedUser}`
        );

        let text = "";

        res.data.forEach(msg => {

            text += `[${msg.time}] ${msg.sender}: `;

            if (msg.message)
                text += msg.message;

            if (msg.image)
                text += " [Image]";

            if (msg.audio)
                text += " [Voice]";

            if (msg.file)
                text += ` [File: ${msg.fileName}]`;

            text += "\n";

        });

        const blob = new Blob([text], {
            type: "text/plain"
        });

        const url = URL.createObjectURL(blob);

        const a = document.createElement("a");

        a.href = url;

        a.download = `${selectedUser}-chat.txt`;

        a.click();

        URL.revokeObjectURL(url);

    } catch (err) {

        console.log(err);

    }

};

const blockUser = async () => {

    if (!selectedUser) return;

    try {

        const res = await api.post("/users/block", {

            blocker: user.username,

            blocked: selectedUser

        });

        alert(

            res.data.blocked
                ? "User blocked."
                : "User unblocked."

        );

    } catch (err) {

        console.log(err);

    }

};

const toggleAutoTranslation = () => {

    setTranslationEnabled(prev => {

        const next = !prev;

        localStorage.setItem(
            "translationEnabled",
            String(next)
        );

        return next;
    });
};

const changeTranslationLanguage = (language) => {

    setTranslationLanguage(language);

    localStorage.setItem(
        "translationLanguage",
        language
    );
};


const updateConversationStorage = (data) => {
    localStorage.setItem(
        "chatConversations",
        JSON.stringify(data)
    );
};







if (!user) {
    return null;
}


    return (
        <div className="chat-layout">

            {!sidebarOpen && (
                <button
                    type="button"
                    className="sidebar-edge-tab"
                    onClick={() => setSidebarOpen(true)}
                    aria-label="Open chats"
                >
                    ›
                </button>
            )}

            <div
    ref={sidebarRef}
    className={`sidebar ${
        sidebarOpen ? "sidebar-open" : ""
    }`}
>

    <div className="sidebar-top">

        <div className="logo">

            <div className="logo-icon">💬</div>

            <div>

                <h2>ChatSphere</h2>

                <span>Professional Messenger</span>

            </div>

        </div>

        <button
            className="new-chat-btn"
            onClick={() => setShowNewChat(true)}
        >
            ＋ New Chat
        </button>

        <button
            className="new-group-btn"
            onClick={() => navigate("/create-group")}
        >
            👥 New Group
        </button>

        <button
    className="global-chat-btn"
    onClick={() => navigate("/global-chat")}
>
    🌐 Global Chat
</button>

        <button
    className={`dashboard-btn${showDashboard ? " active" : ""}`}
    onClick={() => {
        setShowDashboard(true);
        setSidebarOpen(false);
    }}
>
    🏠 Dashboard
</button>

    </div>

    <div className="sidebar-search-box">

        <input
            className="sidebar-search-input"
            placeholder="Search chats..."
        />

    </div>

    <UserList

    conversations={conversations}

    groups={groups}

    currentUser={user.username}

    selectedUser={showDashboard ? null : selectedUser}

    onlineUsers={onlineUsers}

    setSelectedUser={(user) => {

    localStorage.setItem("selectedUser", user);

    setSelectedUser(user);

    setShowDashboard(false);

    setSidebarOpen(false);

}}

    pinChat={pinChat}

/>

</div>

{sidebarOpen && (
    <div
        className="sidebar-backdrop"
        onClick={() => setSidebarOpen(false)}
    />
)}

            <div
    ref={chatMainRef}
    className="chat-main"
    style={{
        backgroundImage: wallpaper ? `url(${wallpaper})` : "",
        backgroundSize: "cover",
        backgroundPosition: "center"
    }}
>
                <Header
                    user={user}
                    selectedUser={showDashboard ? null : selectedUser}
                    onlineUsers={onlineUsers}
                    theme={theme}
                    toggleTheme={toggleTheme}
                    navigate={navigate}
                    logout={logout}
                    startVoiceCall={startVoiceCall}
                    startVideoCall={startVideoCall}
                    openMoreMenu={openMoreMenu}
                    openInfoPanel={() => setShowInfoPanel(true)}
                    onBack={() => setShowDashboard(true)}
                />

                <>
    {!showDashboard && (

        selectMode ? (

            <SelectionBar
                count={selectedMsgIds.length}
                canDelete={canBulkDelete}
                onForward={bulkForward}
                onPin={bulkPin}
                onReply={bulkReply}
                onReact={bulkReact}
                onDelete={bulkDelete}
                onCancel={exitSelectMode}
            />

        ) : (

        <div className="chat-search-bar">

            <input
                className="search-input"
                type="text"
                placeholder="Search messages..."
                value={search}
                onChange={(e) => searchMessages(e.target.value)}
            />

        </div>
        )
    )}

    <div className="messages">

        {showDashboard ? (

                        <Dashboard
                            user={user}
                            conversations={conversations}
                            groups={groups}
                            onlineUsers={onlineUsers}
                            onOpenChat={(username) => {
                                localStorage.setItem("selectedUser", username);
                                setSelectedUser(username);
                                setShowDashboard(false);
                            }}
                        />

                    ) : (

                        <ChatBox
                            messages={messages}
                            currentUser={user.username}
                            onReply={setReplyMessage}
                            onStar={handleStar}
                            onForward={(msg) => setForwardMessages([msg])}
                            selectMode={selectMode}
                            selectedMsgIds={selectedMsgIds}
                            onEnterSelect={enterSelectMode}
                            onToggleSelect={toggleMsgSelect}
                        />

                    )}

                </div>

</>

{!showDashboard && !blocked && (
                <InputArea
                    selectedUser={selectedUser}
                    search={search}
                    searchMessages={searchMessages}
                    typingUser={typingUser}
                    replyMessage={replyMessage}
                    setReplyMessage={setReplyMessage}
                    send={send}
                    typing={typing}
                    stopTyping={stopTyping}
                    socket={socket}
                    user={user}

                    translationEnabled={translationEnabled}
                    translationLanguage={translationLanguage}
                />
)}


{!showDashboard && blocked && (
    <div className="blocked-banner">
        🚫 You cannot send messages because this user has blocked you.
    </div>
)}

            </div>

            {showInfoPanel && (
    <InfoPanel
    user={user}
    selectedUser={selectedUser}
    onlineUsers={onlineUsers}
    onClose={() => setShowInfoPanel(false)}

    openProfile={openProfile}
    openSharedMedia={openSharedMedia}
    openStarredMessages={openStarredMessages}
    openFiles={openFiles}
    openVoiceMessages={openVoiceMessages}
    openLinks={openLinks}
    openSearch={openSearch}
    toggleMute={toggleMute}
    changeWallpaper={changeWallpaper}
    exportChat={exportChat}
    blockUser={blockUser}
    reportUser={reportUser}
    clearChat={clearChat}

    translationEnabled={translationEnabled}
    translationLanguage={translationLanguage}
/>
)}

            <NewChatModal

                open={showNewChat}

                onClose={() => setShowNewChat(false)}

                onSelect={(username) => {

                    localStorage.setItem(

                        "selectedUser",

                        username

                    );

                    setSelectedUser(username);

                    setShowDashboard(false);

                    setSidebarOpen(false);

                }}

            />

            <ForwardModal
                open={!!forwardMessages}
                messages={forwardMessages || []}
                conversations={conversations}
                groups={groups}
                currentUser={user.username}
                onClose={() => setForwardMessages(null)}
                onForward={sendForward}
            />

            <MoreMenu
    open={showMoreMenu}
    onClose={closeMoreMenu}
    onReport={reportUser}
    onClearChat={clearChat}
    position={menuPosition}
    translationEnabled={translationEnabled}
    onToggleTranslation={toggleAutoTranslation}
/>

    <ProfileModal
    open={showProfileModal}
    onClose={closeProfile}
    profile={profileData}
/>

<MediaGallery

    open={showMedia}

    images={media}

    onClose={()=>setShowMedia(false)}

/>

<FileGallery

    open={showFiles}

    files={sharedFiles}

    onClose={() => setShowFiles(false)}

/>

<LinksGallery

    open={showLinks}

    links={sharedLinks}

    onClose={() => setShowLinks(false)}

/>

<SearchConversation
    open={showSearchConversation}
    messages={conversationResults}
    onSearch={searchConversation}
    onClose={() => setShowSearchConversation(false)}
/>
<StarredMessages

    open={showStarredMessages}

    messages={starredMessages}

    onClose={() => setShowStarredMessages(false)}

/>
<WallpaperModal
    open={showWallpaper}
    onClose={() => setShowWallpaper(false)}
    onSelect={selectWallpaper}
/>

<CallScreen
    isCallActive={isCallActive}
    callType={callType}
    contactName={selectedUser}
    onEnd={() => {
        setIsCallActive(false);
        setCallParticipants([]);
        setShowAddPeople(false);
    }}
    onAddPeople={openAddPeopleSheet}
/>

<AddPeopleSheet
    open={showAddPeople}
    users={allUsers}
    currentUser={user.username}
    currentContact={selectedUser}
    onlineUsers={onlineUsers}
    existingParticipants={callParticipants}
    onClose={closeAddPeopleSheet}
    onAdd={handleAddPeople}
/>


        </div>
    );
}


export default Chat;