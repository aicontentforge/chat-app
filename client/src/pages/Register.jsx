import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../services/api";
import "../styles/auth.css";

function Register() {

    const navigate = useNavigate();

    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");

    const register = async () => {

    if (!username.trim()) {

        alert("Enter username");

        return;

    }

    try {

        const res = await api.post("/users/register", {
    username,
    password
});

        localStorage.setItem(

            "user",

            JSON.stringify(res.data.user)

        );

        // Go to Profile Setup first
        navigate("/profile");

    } catch (err) {
    console.log(err);

    if (err.response) {
        alert(
            `Status: ${err.response.status}\n` +
            JSON.stringify(err.response.data)
        );
    } else {
        alert(err.message);
    }
}

};

    return (

<div className="auth-page">

    <div className="auth-card">

        <h1>Create Account</h1>

        <p>Create your account to start chatting.</p>

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

        

        <button onClick={register}>

            Register

        </button>

        <small>

            Already have an account?

            <span
                className="auth-link"
                onClick={()=>navigate("/login")}
            >

                Login

            </span>

        </small>

    </div>

</div>

);

}

export default Register;