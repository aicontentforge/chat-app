import "./Sidebar.css";

function Sidebar({

    users,
    selectedUser,
    setSelectedUser,
    search,
    setSearch,
    onlineUsers

}) {

    return (

        <div className="sidebar-container">

            <div className="sidebar-header">

                <div>

                    <h2>Messages</h2>

                    <small>Your conversations</small>

                </div>

                <button
    className="new-chat-btn"
    onClick={openNewChat}
>
    +
</button>

            </div>

            <div className="sidebar-search">

                <input

                    type="text"

                    placeholder="Search..."

                    value={search}

                    onChange={(e)=>setSearch(e.target.value)}

                />

                <div className="sidebar-divider"></div>

            </div>

            <div className="sidebar-section">

                {

                    users.map(user=>(

                        <div

                            key={user.username}

                            className={

                                selectedUser===user.username

                                ?

                                "chat-card active"

                                :

                                "chat-card"

                            }

                            onClick={()=>setSelectedUser(user.username)}

                        >

                            <div className="chat-avatar">

                                <img

                                    src={

                                        user.avatar ||

                                        `https://api.dicebear.com/9.x/initials/svg?seed=${user.username}`

                                    }

                                    alt=""

                                />

                                {

                                    onlineUsers.includes(user.username)

                                    &&

                                    <span className="status"></span>

                                }

                            </div>

                            <div className="chat-info">

                                <h4>

                                    {user.displayName || user.username}

                                </h4>

                                <p>

                                    Tap to chat...

                                </p>

                            </div>

                        </div>

                    ))

                }

            </div>

        </div>

    );

}

export default Sidebar;