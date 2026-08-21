import { useEffect, useState } from "react";
import api from "../services/api";
import UserCard from "../components/UserCard";
import "../styles/discover.css";

function Discover() {

    const [users, setUsers] = useState([]);
    const [search, setSearch] = useState("");

    useEffect(() => {
        loadUsers();
    }, []);

    const loadUsers = () => {
        api.get("/users/discover")
            .then(res => setUsers(res.data));
    };

    const filtered = users.filter(user => {

        const categories = user.categories || [];

        return (

            user.username.toLowerCase().includes(search.toLowerCase()) ||

            user.uniqueId.toLowerCase().includes(search.toLowerCase()) ||

            categories.some(c =>
                c.toLowerCase().includes(search.toLowerCase())
            )

        );

    });

    return (

        <div className="discover-page">

            <h1>Discover People</h1>

            <input
                placeholder="Search user, ID or category..."
                value={search}
                onChange={(e)=>setSearch(e.target.value)}
            />

            <div className="discover-grid">

                {filtered.map(user=>(
                    <UserCard
                        key={user.id}
                        user={user}
                    />
                ))}

            </div>

        </div>

    );

}

export default Discover;