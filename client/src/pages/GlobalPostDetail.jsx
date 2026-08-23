import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../services/api";
import DonorBadge from "../components/DonorBadge";
import "../styles/globalpostdetail.css";

function flagFromCountryCode(code) {

    if (!code || code.length !== 2) {
        return "";
    }

    return code
        .toUpperCase()
        .split("")
        .map(
            char =>
                String.fromCodePoint(
                    127397 + char.charCodeAt(0)
                )
        )
        .join("");
}


function relativeTime(date) {

    const diff =
        Date.now() -
        new Date(date).getTime();

    const seconds =
        Math.floor(diff / 1000);

    if (seconds < 60) {
        return "just now";
    }

    const minutes =
        Math.floor(seconds / 60);

    if (minutes < 60) {
        return `${minutes}m`;
    }

    const hours =
        Math.floor(minutes / 60);

    if (hours < 24) {
        return `${hours}h`;
    }

    const days =
        Math.floor(hours / 24);

    if (days < 7) {
        return `${days}d`;
    }

    return new Date(date).toLocaleDateString();
}


function renderMentions(text, navigate) {

    if (!text) {
        return null;
    }

    const parts =
        text.split(
            /(@[a-zA-Z0-9_]+)/g
        );

    return parts.map((part, index) => {

        if (
            part.startsWith("@")
        ) {

            const username =
                part.substring(1);

            return (
                <span
                    key={index}
                    className="global-mention"
                    onClick={() =>
                        navigate(
                            `/profile/${username}`
                        )
                    }
                >
                    {part}
                </span>
            );

        }

        return (
            <span key={index}>
                {part}
            </span>
        );

    });

}


function GlobalPostDetail() {

    const {
        postId
    } = useParams();

    const navigate =
        useNavigate();

    const currentUser =
        JSON.parse(
            localStorage.getItem("user")
        );

    const [post, setPost] =
        useState(null);

    const [comments, setComments] =
        useState([]);

    const [text, setText] =
        useState("");

    const [loading, setLoading] =
        useState(true);

    const [suggestions, setSuggestions] =
        useState([]);

    const [showSuggestions, setShowSuggestions] =
        useState(false);

    const inputRef =
        useRef(null);


    // =========================================
    // LOAD POST + COMMENTS
    // =========================================

    useEffect(() => {

        const load = async () => {

            try {

                const postsResponse =
                    await api.get(
                        "/global-chat/posts",
                        {
                            params: {
                                user:
                                    currentUser?.username || ""
                            }
                        }
                    );

                const foundPost =
                    postsResponse.data.find(
                        item =>
                            String(item.id) ===
                            String(postId)
                    );

                setPost(foundPost || null);


                const commentsResponse =
                    await api.get(
                        `/global-chat/posts/${postId}/comments`
                    );

                setComments(
                    commentsResponse.data
                );

            } catch (error) {

                console.error(
                    "POST DETAIL ERROR:",
                    error
                );

            } finally {

                setLoading(false);

            }

        };

        load();

    }, [postId]);


    // =========================================
    // MENTION SEARCH
    // =========================================

    useEffect(() => {

        const match =
            text.match(
                /(?:^|\s)@([a-zA-Z0-9_]*)$/
            );

        if (!match) {

            setSuggestions([]);
            setShowSuggestions(false);

            return;

        }

        const query =
            match[1];

        if (!query) {

            setSuggestions([]);
            setShowSuggestions(false);

            return;

        }

        const timer =
            setTimeout(async () => {

                try {

                    const response =
                        await api.get(
                            "/global-chat/users/search",
                            {
                                params: {
                                    q: query
                                }
                            }
                        );

                    setSuggestions(
                        response.data
                    );

                    setShowSuggestions(
                        response.data.length > 0
                    );

                } catch (error) {

                    console.error(
                        "MENTION SEARCH ERROR:",
                        error
                    );

                }

            }, 200);

        return () =>
            clearTimeout(timer);

    }, [text]);


    // =========================================
    // REPLY
    // =========================================

    const replyTo =
        (username) => {

            setText(
                `@${username} `
            );

            setShowSuggestions(false);

            setTimeout(() => {

                inputRef.current?.focus();

                if (
                    inputRef.current
                ) {

                    inputRef.current.selectionStart =
                        inputRef.current.value.length;

                    inputRef.current.selectionEnd =
                        inputRef.current.value.length;

                }

            }, 0);

        };


    // =========================================
    // SELECT MENTION
    // =========================================

    const selectMention =
        (username) => {

            setText(prev => {

                return prev.replace(
                    /@[a-zA-Z0-9_]*$/,
                    `@${username} `
                );

            });

            setShowSuggestions(false);

            setTimeout(() => {
                inputRef.current?.focus();
            }, 0);

        };


    // =========================================
    // SUBMIT COMMENT
    // =========================================

    const submitComment =
        async (e) => {

            e.preventDefault();

            if (
                !text.trim() ||
                !currentUser?.username
            ) {
                return;
            }

            try {

                const response =
                    await api.post(
                        `/global-chat/posts/${postId}/comments`,
                        {
                            authorId:
                                currentUser.username,

                            text:
                                text.trim()
                        }
                    );

                setComments(prev => [
                    ...prev,
                    response.data.comment
                ]);

                setText("");

                setShowSuggestions(false);

            } catch (error) {

                console.error(
                    "COMMENT ERROR:",
                    error
                );

            }

        };


    if (loading) {

        return (
            <div className="global-post-detail-page">
                <div className="global-detail-loading">
                    Loading...
                </div>
            </div>
        );

    }


    if (!post) {

        return (
            <div className="global-post-detail-page">

                <button
                    className="global-detail-back"
                    onClick={() =>
                        navigate("/global-chat")
                    }
                >
                    ←
                </button>

                <div className="global-detail-not-found">
                    Post not found.
                </div>

            </div>
        );

    }


    return (

        <div className="global-post-detail-page">

            {/* =====================================
                HEADER
            ===================================== */}

            <div className="global-detail-header">

                <button
                    className="global-detail-back"
                    onClick={() =>
                        navigate("/global-chat")
                    }
                >
                    ←
                </button>

                <div>
                    <h2>Comments</h2>
                    <p>World Chat</p>
                </div>

            </div>


            {/* =====================================
                CONTENT
            ===================================== */}

            <div className="global-detail-content">

                {/* ORIGINAL POST */}

                <div className="global-original-post">

                    <div className="global-post-author">

                        <img
                            src={
                                post.author?.avatar ||
                                "https://api.dicebear.com/9.x/initials/svg?seed=User"
                            }
                            alt=""
                            className="global-post-avatar"
                        />

                        <div>

                            <div className="global-post-name">
                                {post.author?.displayName ||
                                    post.author?.username}
                                    <DonorBadge
        username={post.author?.username}
    />
                            </div>

                            <div className="global-post-meta">

                                {post.author?.age
                                    ? `${post.author.age} · `
                                    : ""}

                                {flagFromCountryCode(
                                    post.author?.countryCode
                                )}

                                {" · "}

                                {relativeTime(
                                    post.createdAt
                                )}

                            </div>

                        </div>

                    </div>


                    <div className="global-post-text">

                        {renderMentions(
                            post.text,
                            navigate
                        )}

                    </div>


                    {post.imageUrl && (

                        <img
                            src={post.imageUrl}
                            className="global-post-image"
                            alt=""
                        />

                    )}

                </div>


                {/* COMMENTS */}

                <div className="global-comments">

                    <div className="global-comments-title">

                        {comments.length}
                        {" "}
                        {comments.length === 1
                            ? "comment"
                            : "comments"}

                    </div>


                    {comments.map(comment => (

                        <div
                            key={comment.id}
                            className="global-comment"
                        >

                            <img
                                src={
                                    comment.author?.avatar ||
                                    "https://api.dicebear.com/9.x/initials/svg?seed=User"
                                }
                                alt=""
                                className="global-comment-avatar"
                            />


                            <div className="global-comment-body">

                                <div className="global-comment-top">

                                    <strong>
                                        {comment.author.displayName ||
        comment.author.username}

    <DonorBadge
        username={comment.author.username}
    />
                                    </strong>

                                    <span>
                                        {relativeTime(
                                            comment.createdAt
                                        )}
                                    </span>

                                </div>


                                <div className="global-comment-text">

                                    {renderMentions(
                                        comment.text,
                                        navigate
                                    )}

                                </div>


                                <button
                                    className="global-reply-button"
                                    onClick={() =>
                                        replyTo(
                                            comment.author?.username
                                        )
                                    }
                                >
                                    Reply
                                </button>

                            </div>

                        </div>

                    ))}

                </div>

            </div>


            {/* =====================================
                COMPOSER
            ===================================== */}

            <div className="global-comment-composer-wrapper">

                {showSuggestions && (

                    <div className="global-mention-dropdown">

                        {suggestions.map(user => (

                            <button
                                key={user.username}
                                className="global-mention-option"
                                onClick={() =>
                                    selectMention(
                                        user.username
                                    )
                                }
                            >

                                <img
                                    src={
                                        user.avatar ||
                                        "https://api.dicebear.com/9.x/initials/svg?seed=User"
                                    }
                                    alt=""
                                />

                                <div>

                                    <strong>
                                        {user.displayName ||
                                            user.username}
                                    </strong>

                                    <span>
                                        @{user.username}
                                    </span>

                                </div>

                            </button>

                        ))}

                    </div>

                )}


                <form
                    className="global-comment-composer"
                    onSubmit={submitComment}
                >

                    <img
                        src={
                            currentUser?.avatar ||
                            "https://api.dicebear.com/9.x/initials/svg?seed=User"
                        }
                        alt=""
                        className="global-composer-avatar"
                    />


                    <input
                        ref={inputRef}
                        value={text}
                        onChange={e =>
                            setText(
                                e.target.value
                            )
                        }
                        placeholder="Write a comment..."
                    />


                    <button
                        type="submit"
                        disabled={!text.trim()}
                        className="global-comment-send"
                    >
                        ➤
                    </button>

                </form>

            </div>

        </div>

    );

}

export default GlobalPostDetail;