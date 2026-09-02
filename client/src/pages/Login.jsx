import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../services/api";
import { setStoredUser } from "../utils/authUser";
import "../styles/auth.css";

function Login(){

    const navigate=useNavigate();

    const [username,setUsername]=useState("");
    const [password, setPassword] = useState("");

    const login = async () => {
    try {
        const res = await api.post("/users/login", {
            username,
            password
        });

        setStoredUser(res.data.user);

        navigate("/chat");

    } catch (err) {
        alert(err.response?.data?.message || err.message);
    }
};

    return (

<div className="auth-page">

    <div className="auth-card">

        <h1>Welcome Back</h1>

        <p>Sign in to continue chatting.</p>

        <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e)=>setUsername(e.target.value)}
        />

        <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
        />

        
        <button onClick={login}>

            Login

        </button>

        <small>

            Don't have an account?

            <span
                onClick={()=>navigate("/register")}
                className="auth-link"
            >

                Register

            </span>

        </small>

    </div>

</div>

);

}

export default Login;