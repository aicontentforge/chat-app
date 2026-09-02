import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

import api from "../services/api";
import socket from "../services/socket";

import "../styles/globalchat.css";

import SharePostSheet from "../components/SharePostSheet";
import UserList from "../components/UserList";
import DonorBadge from "../components/DonorBadge";
import BadgeCollection from "../components/BadgeCollection";

function relativeTime(date) {
    const diff = Date.now() - new Date(date).getTime();

    const seconds = Math.floor(diff / 1000);

    if (seconds < 60) return "just now";

    const minutes = Math.floor(seconds / 60);

    if (minutes < 60) return `${minutes}m`;

    const hours = Math.floor(minutes / 60);

    if (hours < 24) return `${hours}h`;

    const days = Math.floor(hours / 24);

    if (days < 7) return `${days}d`;

    return new Date(date).toLocaleDateString();
}


function renderMentions(text, navigate) {
    if (!text) return null;

    const parts = text.split(/(@[a-zA-Z0-9_]+)/g);

    return parts.map((part, index) => {
        if (part.startsWith("@")) {
            const username = part.substring(1);

            return (
                <span
                    key={index}
                    className="global-mention"
                    onClick={() =>
                        navigate(`/profile/${username}`)
                    }
                >
                    {part}
                </span>
            );
        }

        return <span key={index}>{part}</span>;
    });
}


function GlobalChat() {

    const navigate = useNavigate();

    const currentUser = (() => {
        try {
            return JSON.parse(
                localStorage.getItem("user")
            );
        } catch {
            return null;
        }
    })();


    /* =========================================
       POSTS
    ========================================= */

    const [posts, setPosts] = useState([]);

    const [loading, setLoading] = useState(true);

    const [text, setText] = useState("");

    const [posting, setPosting] = useState(false);


    /* =========================================
       MODERATION
    ========================================= */

    const [reportingPost, setReportingPost] = useState(null);

    const [showReportPost, setShowReportPost] =
        useState(false);

    const [blockingUser, setBlockingUser] =
        useState(null);

    const [showBlockConfirm, setShowBlockConfirm] =
        useState(false);


    /* =========================================
       SHARE
    ========================================= */

    const [sharePost, setSharePost] =
        useState(null);

    const [showShareSheet, setShowShareSheet] =
        useState(false);


    /* =========================================
       MY PROFILE MENU
    ========================================= */

    const [showProfileMenu, setShowProfileMenu] =
        useState(false);

    const [showMyCollection, setShowMyCollection] =
        useState(false);


    /* =========================================
       SIDEBAR DATA
    ========================================= */

    const [conversations, setConversations] =
        useState(() => {

            try {

                return JSON.parse(
                    localStorage.getItem(
                        "chatConversations"
                    )
                ) || [];

            } catch {

                return [];

            }

        });


    const [groups, setGroups] = useState([]);

    const [onlineUsers, setOnlineUsers] =
        useState([]);


    /* =========================================
       MOBILE SIDEBAR
    ========================================= */

    const [sidebarOpen, setSidebarOpen] =
        useState(false);


    /* =========================================
       TOUCH GESTURE
    ========================================= */

    const touchStartX = useRef(null);

    const touchStartY = useRef(null);


    /* =========================================
       FEED SCROLL (keep newest message in view)
    ========================================= */

    const feedRef = useRef(null);


    /* =========================================
       SOCKET
    ========================================= */

    useEffect(() => {

        if (!currentUser?.username) return;

        socket.connect();

        socket.emit(
            "join",
            currentUser.username
        );


        socket.on(
            "online_users",
            (users) => {

                setOnlineUsers(users);

            }
        );


        return () => {

            socket.off("online_users");

            socket.disconnect();

        };

    }, []);


    /* =========================================
       LOAD SIDEBAR DATA
    ========================================= */

    useEffect(() => {

        if (!currentUser?.username) return;


        api.get(
            `/messages/conversations/${currentUser.username}`
        )
            .then(res => {

                setConversations(res.data);

                localStorage.setItem(
                    "chatConversations",
                    JSON.stringify(res.data)
                );

            })
            .catch(err => {

                console.log(
                    "Conversation load error:",
                    err
                );

            });


        api.get(
            `/groups/${currentUser.username}`
        )
            .then(res => {

                setGroups(res.data);

            })
            .catch(err => {

                console.log(
                    "Group load error:",
                    err
                );

            });

    }, []);


    /* =========================================
       LOAD POSTS

       Rendered oldest -> newest (top -> bottom)
       so the feed reads like a chat log, with
       the newest message always sitting at the
       bottom. Sorting here (instead of trusting
       the API's order) means this keeps working
       correctly no matter which order the server
       sends posts in.
    ========================================= */

    const loadPosts = async () => {

        try {

            const response =
                await api.get(
                    "/global-chat/posts",
                    {
                        params: {
                            user:
                                currentUser?.username ||
                                ""
                        }
                    }
                );

            const oldestFirst =
                [...response.data].sort(
                    (a, b) =>
                        new Date(a.createdAt) -
                        new Date(b.createdAt)
                );

            setPosts(oldestFirst);

        } catch (error) {

            console.error(
                "GLOBAL CHAT LOAD ERROR:",
                error
            );

        } finally {

            setLoading(false);

        }

    };


    useEffect(() => {

        loadPosts();

    }, []);


    /* =========================================
       KEEP NEWEST MESSAGE IN VIEW

       Runs after the initial load and every time
       a post is added/removed, so the feed always
       settles on the latest message at the bottom
       (right side, for your own messages) instead
       of leaving the view scrolled somewhere in
       the middle.
    ========================================= */

    useEffect(() => {

        if (loading) return;

        const feedEl = feedRef.current;

        if (!feedEl) return;

        feedEl.scrollTop = feedEl.scrollHeight;

    }, [posts.length, loading]);


    /* =========================================
       CREATE POST
    ========================================= */

    const createPost = async (e) => {

        e.preventDefault();

        if (!text.trim()) return;

        if (!currentUser?.username) return;

        setPosting(true);

        try {

            const response =
                await api.post(
                    "/global-chat/posts",
                    {
                        authorId:
                            currentUser.username,

                        text: text.trim(),

                        imageUrl: ""
                    }
                );


            if (response.data.success) {

                /*
                 * Appended to the END so it lands at
                 * the bottom (newest message), not the
                 * top. The feed auto-scrolls down to
                 * reveal it - see the scroll effect below.
                 */

                setPosts(prev => [
                    ...prev,
                    response.data.post
                ]);

                setText("");

            }

        } catch (error) {

            console.error(
                "CREATE POST ERROR:",
                error
            );

        } finally {

            setPosting(false);

        }

    };


    /* =========================================
       LIKE
    ========================================= */

    const toggleLike = async (post) => {

        if (!currentUser?.username) return;

        try {

            const response =
                await api.post(
                    `/global-chat/posts/${post.id}/like`,
                    {
                        userId:
                            currentUser.username
                    }
                );


            setPosts(prev =>
                prev.map(item =>

                    item.id === post.id

                        ? {
                            ...item,

                            liked:
                                response.data.liked,

                            likeCount:
                                response.data.likeCount,

                            likedBy:
                                response.data.likedBy
                        }

                        : item

                )
            );

        } catch (error) {

            console.error(
                "LIKE ERROR:",
                error
            );

        }

    };


    /* =========================================
       COMMENTS
    ========================================= */

    const openComments = (postId) => {

        navigate(
            `/global/post/${postId}`
        );

    };


    /* =========================================
       SHARE
    ========================================= */

    const openShareSheet = (post) => {

        setSharePost(post);

        setShowShareSheet(true);

    };


    const closeShareSheet = () => {

        setShowShareSheet(false);

        setSharePost(null);

    };


    /* =========================================
       REPORT
    ========================================= */

    const reportPost = async (
        postId,
        reason = "Other"
    ) => {

        if (!currentUser?.username) return;

        try {

            const response =
                await api.post(
                    `/global-chat/posts/${postId}/report`,
                    {
                        reporterId:
                            currentUser.username,

                        reason
                    }
                );


            if (response.data.success) {

                setPosts(prev =>
                    prev.filter(
                        post =>
                            post.id !== postId
                    )
                );

                setShowReportPost(false);

                setReportingPost(null);

                alert(
                    "Post reported successfully."
                );

            }

        } catch (error) {

            console.error(
                "REPORT POST ERROR:",
                error
            );

            alert(
                error.response?.data?.message ||
                "Failed to report post."
            );

        }

    };


    /* =========================================
       BLOCK USER
    ========================================= */

    const blockUser = async (username) => {

        if (!currentUser?.username) return;

        if (!username) return;

        try {

            const response =
                await api.post(
                    `/global-chat/users/${username}/block`,
                    {
                        blocker:
                            currentUser.username
                    }
                );


            if (response.data.success) {

                setPosts(prev =>
                    prev.filter(
                        post =>
                            post.author?.username !==
                            username
                    )
                );


                setShowBlockConfirm(false);

                setBlockingUser(null);

                alert(
                    `${username} has been blocked.`
                );

            }

        } catch (error) {

            console.error(
                "BLOCK USER ERROR:",
                error
            );

            alert(
                error.response?.data?.message ||
                "Failed to block user."
            );

        }

    };


    /* =========================================
       PIN CHAT
    ========================================= */

    const pinChat = async (chatUser) => {

        if (!currentUser?.username) return;

        try {

            const response =
                await api.post(
                    "/users/pin-chat",
                    {
                        username:
                            currentUser.username,

                        chatUser
                    }
                );


            const pinned =
                response.data.pinned || [];


            setConversations(prev => {

                return [...prev].sort(
                    (a, b) => {

                        const aUser =
                            a.sender ===
                            currentUser.username

                                ? a.receiver

                                : a.sender;


                        const bUser =
                            b.sender ===
                            currentUser.username

                                ? b.receiver

                                : b.sender;


                        const aPinned =
                            pinned.includes(aUser);

                        const bPinned =
                            pinned.includes(bUser);


                        if (
                            aPinned &&
                            !bPinned
                        ) return -1;


                        if (
                            !aPinned &&
                            bPinned
                        ) return 1;


                        return 0;

                    }
                );

            });

        } catch (error) {

            console.log(
                "PIN CHAT ERROR:",
                error
            );

        }

    };


    /* =========================================
       SELECT CHAT
    ========================================= */

    const selectConversation = (username) => {

        localStorage.setItem(
            "selectedUser",
            username
        );

        setSidebarOpen(false);

        navigate("/chat");

    };


    /* =========================================
       NEW CHAT
    ========================================= */

    const openNewChat = () => {

        setSidebarOpen(false);

        navigate("/chat");

    };


    /* =========================================
       SWIPE HANDLERS
    ========================================= */

    const handleTouchStart = (e) => {

        if (
            window.innerWidth >= 768
        ) {
            return;
        }


        const touch =
            e.touches[0];


        touchStartX.current =
            touch.clientX;

        touchStartY.current =
            touch.clientY;

    };


    const handleTouchEnd = (e) => {

        if (
            window.innerWidth >= 768
        ) {
            return;
        }


        if (
            touchStartX.current === null ||
            touchStartY.current === null
        ) {
            return;
        }


        const touch =
            e.changedTouches[0];


        const deltaX =
            touch.clientX -
            touchStartX.current;


        const deltaY =
            touch.clientY -
            touchStartY.current;


        touchStartX.current = null;

        touchStartY.current = null;


        /*
         * Horizontal gesture only.
         * This prevents normal message/feed
         * scrolling from triggering the sidebar.
         */

        if (
            Math.abs(deltaX) <=
            Math.abs(deltaY)
        ) {
            return;
        }


        /*
         * Minimum swipe distance.
         */

        if (
            Math.abs(deltaX) < 60
        ) {
            return;
        }


        /*
         * Finger moves right-to-left
         * => open sidebar.
         */

        if (
            deltaX < 0 &&
            !sidebarOpen
        ) {

            setSidebarOpen(true);

        }


        /*
         * Finger moves left-to-right
         * => close sidebar.
         */

        if (
            deltaX > 0 &&
            sidebarOpen
        ) {

            setSidebarOpen(false);

        }

    };


    /* =========================================
       CURRENT USER AVATAR
    ========================================= */

    const currentAvatar =
        currentUser?.avatar ||
        `https://api.dicebear.com/9.x/initials/svg?seed=${currentUser?.username || "User"}`;


    /* =========================================
       RENDER
    ========================================= */

    return (

        <div className="global-chat-shell">


            {/* =====================================
                MOBILE BACKDROP
            ===================================== */}

            {sidebarOpen && (

                <div
                    className="global-sidebar-backdrop"
                    onClick={() =>
                        setSidebarOpen(false)
                    }
                />

            )}


            {/* =====================================
                SIDEBAR
            ===================================== */}

            <aside
                className={
                    sidebarOpen
                        ? "global-sidebar open"
                        : "global-sidebar"
                }
            >

                <div className="global-sidebar-top">


                    <div className="global-sidebar-brand global-my-profile">

                        <button
                            type="button"
                            className="global-my-profile-trigger"
                            onClick={() =>
                                setShowProfileMenu(prev => !prev)
                            }
                        >
                            <img
                                src={currentAvatar}
                                alt=""
                                className="global-my-profile-avatar"
                            />
                        </button>

                        <div>

                            <h2>
                                {currentUser?.displayName ||
                                    currentUser?.username ||
                                    "Profile"}
                            </h2>

                            <span>
                                My Profile
                            </span>

                        </div>


                        {showProfileMenu && (

                            <>

                                <div
                                    className="global-my-profile-backdrop"
                                    onClick={() =>
                                        setShowProfileMenu(false)
                                    }
                                />

                                <div className="global-my-profile-menu">

                                    <button
                                        type="button"
                                        onClick={() => {

                                            setShowMyCollection(true);

                                            setShowProfileMenu(false);

                                        }}
                                    >
                                        🏅 Collection
                                    </button>

                                </div>

                            </>

                        )}

                    </div>


                    <button
                        className="global-new-chat-btn"
                        onClick={openNewChat}
                    >
                        <span>＋</span>
                        New Chat
                    </button>


                    <button
                        className="global-new-group-btn"
                        onClick={() => {

                            setSidebarOpen(false);

                            navigate(
                                "/create-group"
                            );

                        }}
                    >
                        <span>👥</span>
                        New Group
                    </button>


                    <button
                        className="global-world-btn active"
                        onClick={() =>
                            setSidebarOpen(false)
                        }
                    >
                        <span>🌐</span>
                        Global Chat

                        <span className="global-active-dot" />

                    </button>

                </div>


                <div className="global-sidebar-label">
                    Conversations
                </div>


                <div className="global-sidebar-list">

                    <UserList

                        conversations={
                            conversations
                        }

                        groups={groups}

                        currentUser={
                            currentUser?.username
                        }

                        selectedUser={null}

                        onlineUsers={
                            onlineUsers
                        }

                        setSelectedUser={
                            selectConversation
                        }

                        pinChat={pinChat}

                    />

                </div>


                <div className="global-sidebar-footer">

                    <div className="global-sidebar-user">

                        <img
                            src={currentAvatar}
                            alt=""
                        />

                        <div>

                            <strong>
                                {
                                    currentUser?.displayName ||
                                    currentUser?.username ||
                                    "User"
                                }
                            </strong>

                            <span>
                                Online
                            </span>

                        </div>

                    </div>

                </div>

            </aside>


            {/* =====================================
                MAIN AREA
            ===================================== */}

            <main
                className="global-chat-main"
                onTouchStart={handleTouchStart}
                onTouchEnd={handleTouchEnd}
            >


                {/* =================================
                    HEADER
                ================================= */}

                <header className="global-chat-header">


                    <button
                        className="global-mobile-menu"
                        onClick={() =>
                            setSidebarOpen(true)
                        }
                        aria-label="Open sidebar"
                    >
                        ☰
                    </button>


                    <div className="global-header-icon">
                        🌎
                    </div>


                    <div className="global-header-info">

                        <h1>
                            World Chat
                        </h1>

                        <p>
                            Connect with people
                            around the world
                        </p>

                    </div>


                    <div className="global-header-status">

                        <span />

                        Live

                    </div>

                </header>


                {/* =================================
                    FEED
                ================================= */}

                <section
                    className="global-chat-feed"
                    ref={feedRef}
                >

                    {loading ? (

                        <div className="global-chat-loading">

                            <div className="global-loading-spinner" />

                            <span>
                                Loading World Chat...
                            </span>

                        </div>

                    ) : posts.length === 0 ? (

                        <div className="global-chat-empty">

                            <div className="global-chat-empty-icon">
                                🌎
                            </div>

                            <h2>
                                Welcome to World Chat
                            </h2>

                            <p>
                                No posts yet.
                                Be the first person
                                to start the conversation.
                            </p>

                        </div>

                    ) : (

                        <div className="global-post-list">

                            {posts.map(post => (

                                <article
    className={
        post.author?.username === currentUser?.username
            ? "global-post-card global-post-own"
            : "global-post-card global-post-other"
    }
    key={post.id}
>


                                    {/* AUTHOR */}

                                    <div className="global-post-author">


                                        <img
                                            src={
                                                post.author?.avatar ||
                                                `https://api.dicebear.com/9.x/initials/svg?seed=${post.author?.username || "User"}`
                                            }
                                            alt=""
                                            className="global-post-avatar"
                                        />


                                        <div className="global-post-author-info">

                                            <div className="global-post-name">

                                                {
                                                    post.author?.displayName ||
                                                    post.author?.username
                                                }

                                                {post.author?.username && (
                                                    <DonorBadge
                                                        username={post.author.username}
                                                    />
                                                )}

                                            </div>


                                            <div className="global-post-meta">

                                                {post.author?.age
                                                    ? `${post.author.age} · `
                                                    : ""}

                                                {relativeTime(
                                                    post.createdAt
                                                )}

                                            </div>

                                        </div>


                                        <div className="global-post-moderation">


                                            <button
                                                onClick={() => {

                                                    setReportingPost(
                                                        post
                                                    );

                                                    setShowReportPost(
                                                        true
                                                    );

                                                }}
                                            >
                                                Report
                                            </button>


                                            {post.author?.username !==
                                                currentUser?.username && (

                                                <button
                                                    onClick={() => {

                                                        setBlockingUser(
                                                            post.author.username
                                                        );

                                                        setShowBlockConfirm(
                                                            true
                                                        );

                                                    }}
                                                >
                                                    Block
                                                </button>

                                            )}

                                        </div>

                                    </div>


                                    {/* TEXT */}

                                    {post.text && (

                                        <div className="global-post-text">

                                            {renderMentions(
                                                post.text,
                                                navigate
                                            )}

                                        </div>

                                    )}


                                    {/* IMAGE */}

                                    {post.imageUrl && (

                                        <img
                                            src={post.imageUrl}
                                            alt=""
                                            className="global-post-image"
                                        />

                                    )}


                                    {/* ACTIONS */}

                                    <div className="global-post-actions">


                                        <button
                                            className={
                                                post.liked
                                                    ? "global-post-action liked"
                                                    : "global-post-action"
                                            }
                                            onClick={() =>
                                                toggleLike(post)
                                            }
                                        >

                                            <span>
                                                {post.liked
                                                    ? "❤️"
                                                    : "🤍"}
                                            </span>

                                            <span>
                                                {post.likeCount || 0}
                                            </span>

                                        </button>


                                        <button
                                            className="global-post-action"
                                            onClick={() =>
                                                openComments(
                                                    post.id
                                                )
                                            }
                                        >

                                            💬

                                            <span>
                                                Comments
                                            </span>

                                        </button>


                                        <button
                                            className="global-post-action"
                                            onClick={() =>
                                                openShareSheet(
                                                    post
                                                )
                                            }
                                        >

                                            ↗️

                                            <span>
                                                Share
                                            </span>

                                        </button>


                                        {post.imageUrl && (

                                            <button
                                                className="global-post-action global-download-action"
                                                onClick={() => {

                                                    const link =
                                                        document.createElement(
                                                            "a"
                                                        );

                                                    link.href =
                                                        post.imageUrl;

                                                    link.download =
                                                        `world-post-${post.id}`;

                                                    document.body.appendChild(
                                                        link
                                                    );

                                                    link.click();

                                                    document.body.removeChild(
                                                        link
                                                    );

                                                }}
                                            >
                                                ⬇️
                                            </button>

                                        )}

                                    </div>

                                </article>

                            ))}

                        </div>

                    )}

                </section>


                {/* =================================
                    BOTTOM COMPOSER
                ================================= */}

                <div className="global-composer-area">

                    <form
                        className="global-create-post"
                        onSubmit={createPost}
                    >

                        <img
                            src={currentAvatar}
                            alt=""
                            className="global-create-post-avatar"
                        />


                        <div className="global-composer-content">

                            <textarea
                                value={text}
                                onChange={e =>
                                    setText(
                                        e.target.value
                                    )
                                }
                                placeholder="Share something with everyone..."
                                rows={1}
                                onKeyDown={e => {

                                    if (
                                        e.key === "Enter" &&
                                        !e.shiftKey
                                    ) {

                                        e.preventDefault();

                                        createPost(e);

                                    }

                                }}
                            />


                            <div className="global-composer-bottom">

                                <span>
                                    {text.length > 0
                                        ? `${text.length} characters`
                                        : "Press Enter to post"}
                                </span>


                                <button
                                    type="submit"
                                    disabled={
                                        posting ||
                                        !text.trim()
                                    }
                                >

                                    {posting
                                        ? "Posting..."
                                        : "Post"}

                                    <span>
                                        ➤
                                    </span>

                                </button>

                            </div>

                        </div>

                    </form>

                </div>

            </main>


            {/* =====================================
                SHARE SHEET
            ===================================== */}

            <SharePostSheet
                open={showShareSheet}
                post={sharePost}
                conversations={conversations}
                currentUser={
                    currentUser?.username
                }
                onClose={
                    closeShareSheet
                }
            />


            {/* =====================================
                REPORT MODAL
            ===================================== */}

            {showReportPost &&
                reportingPost && (

                <div
                    className="global-moderation-overlay"
                    onClick={() => {

                        setShowReportPost(
                            false
                        );

                        setReportingPost(
                            null
                        );

                    }}
                >

                    <div
                        className="global-moderation-dialog"
                        onClick={e =>
                            e.stopPropagation()
                        }
                    >

                        <div className="global-dialog-icon">
                            ⚠️
                        </div>

                        <h3>
                            Report Post
                        </h3>

                        <p>
                            Why are you reporting
                            this post?
                        </p>


                        <button
                            onClick={() =>
                                reportPost(
                                    reportingPost.id,
                                    "Spam"
                                )
                            }
                        >
                            Spam
                        </button>


                        <button
                            onClick={() =>
                                reportPost(
                                    reportingPost.id,
                                    "Harassment"
                                )
                            }
                        >
                            Harassment
                        </button>


                        <button
                            onClick={() =>
                                reportPost(
                                    reportingPost.id,
                                    "Inappropriate"
                                )
                            }
                        >
                            Inappropriate content
                        </button>


                        <button
                            onClick={() =>
                                reportPost(
                                    reportingPost.id,
                                    "Other"
                                )
                            }
                        >
                            Other
                        </button>


                        <button
                            className="global-dialog-cancel"
                            onClick={() => {

                                setShowReportPost(
                                    false
                                );

                                setReportingPost(
                                    null
                                );

                            }}
                        >
                            Cancel
                        </button>

                    </div>

                </div>

            )}


            {/* =====================================
                BLOCK MODAL
            ===================================== */}

            {showBlockConfirm &&
                blockingUser && (

                <div
                    className="global-moderation-overlay"
                    onClick={() => {

                        setShowBlockConfirm(
                            false
                        );

                        setBlockingUser(
                            null
                        );

                    }}
                >

                    <div
                        className="global-moderation-dialog"
                        onClick={e =>
                            e.stopPropagation()
                        }
                    >

                        <div className="global-dialog-icon">
                            🚫
                        </div>

                        <h3>
                            Block @{blockingUser}?
                        </h3>

                        <p>
                            You will no longer see
                            this user's World Chat
                            posts or comments.
                        </p>


                        <button
                            className="global-danger-button"
                            onClick={() =>
                                blockUser(
                                    blockingUser
                                )
                            }
                        >
                            Block User
                        </button>


                        <button
                            className="global-dialog-cancel"
                            onClick={() => {

                                setShowBlockConfirm(
                                    false
                                );

                                setBlockingUser(
                                    null
                                );

                            }}
                        >
                            Cancel
                        </button>

                    </div>

                </div>

            )}


            {/* =====================================
                MY BADGE COLLECTION
            ===================================== */}

            {showMyCollection && (

                <div
                    className="global-moderation-overlay"
                    onClick={() =>
                        setShowMyCollection(false)
                    }
                >

                    <div
                        className="global-collection-dialog"
                        onClick={e =>
                            e.stopPropagation()
                        }
                    >

                        <button
                            type="button"
                            className="global-collection-close"
                            onClick={() =>
                                setShowMyCollection(false)
                            }
                            aria-label="Close"
                        >
                            ✕
                        </button>

                        <BadgeCollection
                            username={currentUser?.username}
                            title="My Badge Collection"
                            subtitle="Badges you've held at the end of each month"
                        />

                    </div>

                </div>

            )}

        </div>

    );

}


export default GlobalChat;