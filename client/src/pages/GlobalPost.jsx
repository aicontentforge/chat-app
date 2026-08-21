import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../services/api";

function GlobalPost() {

    const { postId } = useParams();

    const navigate = useNavigate();

    const [post, setPost] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {

        api.get(
            `/global-chat/posts/${postId}`
        )
        .then(res => {

            setPost(res.data);

        })
        .catch(err => {

            console.error(
                "LOAD GLOBAL POST ERROR:",
                err
            );

        })
        .finally(() => {

            setLoading(false);

        });

    }, [postId]);

    if (loading) {
        return <div>Loading post...</div>;
    }

    if (!post) {
        return (
            <div>
                Post not found.
            </div>
        );
    }

    return (
        <div className="global-chat-page">

            <div className="global-chat-header">

                <button
                    className="global-chat-back"
                    onClick={() => navigate(-1)}
                >
                    ←
                </button>

                <div>

                    <h2>
                        World Chat
                    </h2>

                    <p>
                        Shared post
                    </p>

                </div>

            </div>

            <div className="global-chat-content">

                <div className="global-post-card">

                    <div className="global-post-author">

                        <img
                            src={
                                post.author?.avatar ||
                                "https://api.dicebear.com/9.x/initials/svg?seed=User"
                            }
                            className="global-post-avatar"
                            alt=""
                        />

                        <div>

                            <div className="global-post-name">
                                {post.author?.displayName ||
                                    post.author?.username}
                            </div>

                        </div>

                    </div>

                    {post.text && (
                        <div className="global-post-text">
                            {post.text}
                        </div>
                    )}

                    {post.imageUrl && (
                        <img
                            src={post.imageUrl}
                            className="global-post-image"
                            alt=""
                        />
                    )}

                </div>

            </div>

        </div>
    );
}

export default GlobalPost;