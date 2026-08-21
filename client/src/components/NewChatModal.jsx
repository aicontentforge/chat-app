import { useEffect, useState } from "react";
import api from "../services/api";
import "../styles/newchatmodal.css";

function NewChatModal({

    open,
    onClose,
    onSelect

}) {

    const [users, setUsers] = useState([]);
    const [search, setSearch] = useState("");
    const [category, setCategory] = useState("All");
    const [onlineUsers, setOnlineUsers] = useState([]);

    useEffect(() => {

        if (!open) return;

        api.get("/users/discover")
            .then(res => {

                setUsers(res.data);

            });
        
        api.get("/users")
            .then(res => {

                const online = res.data
                    .filter(user => user.lastSeen === "ONLINE")
                    .map(user => user.username);

                setOnlineUsers(online);

            });

        

    }, [open]);



    if (!open) return null;

    const filtered = users.filter(user => {

        const text = search.toLowerCase();

        const categories = Array.isArray(user.categories)
            ? user.categories
            : JSON.parse(user.categories || "[]");

        const matchesSearch =

            user.username.toLowerCase().includes(text) ||

            (user.displayName || "")
                .toLowerCase()
                .includes(text) ||

            (user.uniqueId || "")
                .toLowerCase()
                .includes(text);

        if (!matchesSearch)
            return false;

        if (category === "All")
            return true;

        if (category === "Online")
            return onlineUsers.includes(user.username);

        if (category === "Recommended")
            return categories.length > 0;

        if (category === "Nearby")
            return user.city;

        return categories.includes(category);

    });

    return (

        <div className="modal-overlay">

            <div className="new-chat-modal">

                <div className="modal-header">

                    <h2>New Chat</h2>

                    <button onClick={onClose}>

                        ✕

                    </button>

                </div>

                <input

                    placeholder="Search username or Chat ID..."

                    value={search}

                    onChange={(e)=>setSearch(e.target.value)}

                />

                <div className="category-bar">

                    {[
                        "All",
                        "Recommended",
                        "Nearby",
                        "Online",
                        "Friends",
                        "Dating",
                        "Business",
                        "Knowledge",
                        "Gaming",
                        "Study",
                        "Travel"
                    ].map(item => (

                        <button

                            key={item}

                            className={category===item ? "active" : ""}

                            onClick={() => setCategory(item)}

                        >

                            {item}

                        </button>

                    ))}

                </div>

                <div className="modal-users">

                    {filtered.map(user=>(

                        <div

                            key={user.id}

                            className="modal-user"

                            onClick={()=>{

                                onSelect(user.username);

                                onClose();

                            }}

                        >

                            <img

                                src={

                                    user.avatar ||

                                    `https://api.dicebear.com/9.x/initials/svg?seed=${user.username}`

                                }

                                alt=""

                            />

                            <div>

                                <h4>

                                    {user.displayName}

                                </h4>

                                <small>

                                    @{user.username}

                                </small>

                                <br/>

                                <small>

                                    {user.uniqueId}

                                </small>

                            </div>

                        </div>

                    ))}

                </div>

            </div>

        </div>

    );

}

export default NewChatModal;