import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import api from "../services/api";
import { API_ORIGIN } from "../config";
import ImageUpload from "../components/ImageUpload";
import "../styles/groupinfo.css";

function GroupInfo() {

    const { groupId } = useParams();

    const user = JSON.parse(localStorage.getItem("user"));

    const [group, setGroup] = useState(null);

    useEffect(() => {

        api
            .get(`/groups/info/${groupId}`)
            .then(res => {

                setGroup(res.data);

            });

    }, []);

    if (!group) {

        return <h2>Loading...</h2>;

    }

    const isAdmin = group.createdBy === user.username;

    const renameGroup = async () => {

    

    const newName = prompt(
        "New group name",
        group.name
    );

    if (!newName) return;

    await api.put("/groups/rename", {

        groupId,

        name: newName

    });

    setGroup({

        ...group,

        name: newName

    });

};

const addMember = async () => {

    const username = prompt("Username");

    if (!username) return;

    await api.post("/groups/add-member", {

        groupId,

        username

    });

    const res = await api.get(`/groups/info/${groupId}`);

    setGroup(res.data);

};

const removeMember = async (username) => {

    if (

        !window.confirm(

            `Remove ${username}?`

        )

    ) return;

    await api.post(

        "/groups/remove-member",

        {

            groupId,

            username

        }

    );

    const res = await api.get(

        `/groups/info/${groupId}`

    );

    setGroup(res.data);

};


const updateAvatar = async (imageUrl) => {

    await api.put("/groups/avatar", {

        groupId,

        avatar: imageUrl

    });

    setGroup({

        ...group,

        avatar: imageUrl

    });

};

const transferAdmin = async (username) => {

    if (

        !window.confirm(

            `Transfer admin to ${username}?`

        )

    ) return;

    await api.post(

        "/groups/transfer-admin",

        {

            groupId,

            oldAdmin: user.username,

            newAdmin: username

        }

    );

    const res = await api.get(

        `/groups/info/${groupId}`

    );

    setGroup(res.data);

};

const leaveGroup = async () => {

    if (!window.confirm("Leave this group?")) return;

    await api.post("/groups/leave", {

        groupId,

        username: user.username

    });

    window.location.href = "/chat";

};

    return (

<div className="group-page">

    <div className="group-card">

        <img

            src={
                group.avatar
                    ? `${API_ORIGIN}${group.avatar}`
                    : "https://cdn-icons-png.flaticon.com/512/1946/1946429.png"
            }

            className="group-avatar"

            alt=""
        />

        <h2>{group.name}</h2>

        <p className="group-count">

            {group.members.length} Members

        </p>

        {isAdmin && (

            <ImageUpload

                onUploaded={updateAvatar}

            />

        )}

        <div className="group-members">

            {group.members.map(member => (

                <div

                    key={member.username}

                    className="member-card"

                >

                    <div>

                        <b>

                            {member.username}

                            {member.role === "admin" && " 👑"}

                        </b>

                    </div>

                    <div className="member-actions">

                        {

                            isAdmin &&

                            member.username !== user.username &&

                            <>

                                <button

                                    onClick={()=>

                                        transferAdmin(

                                            member.username

                                        )

                                    }

                                >

                                    👑

                                </button>

                                <button

                                    onClick={()=>

                                        removeMember(

                                            member.username

                                        )

                                    }

                                >

                                    ❌

                                </button>

                            </>

                        }

                    </div>

                </div>

            ))}

        </div>

        {isAdmin && (

            <div className="group-buttons">

                <button onClick={renameGroup}>

                    Rename Group

                </button>

                <button onClick={addMember}>

                    Add Member

                </button>

            </div>

        )}

        <button

            className="leave-btn"

            onClick={leaveGroup}

        >

            Leave Group

        </button>

    </div>

</div>

);

}

export default GroupInfo;