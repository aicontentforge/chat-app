import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import "../styles/creategroup.css";


function CreateGroup() {

    const navigate = useNavigate();

    const user = JSON.parse(localStorage.getItem("user"));

    const [groupName, setGroupName] = useState("");

    const [users, setUsers] = useState([]);

    const [selected, setSelected] = useState([user.username]);

    useEffect(() => {

        api.get("/users").then(res => {

            setUsers(

                res.data.filter(u => u.username !== user.username)

            );

        });

    }, []);

    const toggle = (username) => {

        if (selected.includes(username)) {

            setSelected(

                selected.filter(u => u !== username)

            );

        } else {

            setSelected([...selected, username]);

        }

    };

    const create = async () => {

        if (!groupName.trim()) {

            alert("Enter group name");

            return;

        }

        await api.post("/groups/create", {

            name: groupName,

            members: selected,

            createdBy: user.username

        });

        alert("Group Created");

        navigate("/chat");

    };

    return (

<div className="create-group-page">

    <div className="create-group-card">

        <h1>Create New Group</h1>

        <p>
            Create a workspace and invite your friends.
        </p>

        <input
    type="text"
    placeholder="Group Name"
    value={groupName}
    onChange={(e) => setGroupName(e.target.value)}
/>

        <h3>Select Members</h3>

        <div className="member-list">

            {users.map(user=>(

                <label
                    key={user.username}
                    className="member-item"
                >

                    <input
                        type="checkbox"
                        checked={selected.includes(user.username)}
                        onChange={() => toggle(user.username)}
                    />

                    <img
                        src={`https://api.dicebear.com/9.x/initials/svg?seed=${user.username}`}
                        alt=""
                    />

                    <span>

                        {user.username}

                    </span>

                </label>

            ))}

        </div>

        <button
            className="create-btn"
            onClick={create}
        >

            Create Group

        </button>

    </div>

</div>

);

}

export default CreateGroup;