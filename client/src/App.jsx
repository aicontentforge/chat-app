import { useEffect, useState } from "react";
import { Routes, Route, Navigate } from "react-router-dom";

import Login from "./pages/Login";
import Register from "./pages/Register";
import Chat from "./pages/Chat";
import Profile from "./pages/Profile";
import CreateGroup from "./pages/CreateGroup";
import GroupInfo from "./pages/GroupInfo";
import Settings from "./pages/Settings";
import ProfileSetup from "./pages/ProfileSetup";
import GlobalChat from "./pages/GlobalChat";
import GlobalPostDetail from "./pages/GlobalPostDetail";
import TopSupporters from "./pages/TopSupporters";
import DonatePage from "./pages/DonatePage";

import { getStoredUser, onAuthChange } from "./utils/authUser";

function App() {

    // Was previously a plain `const` computed once at mount,
    // which is why every guarded route below could get stuck
    // showing stale logged-out state - see utils/authUser.js.
    const [user, setUser] = useState(getStoredUser);

    useEffect(() => {

        const unsubscribe = onAuthChange(() => {
            setUser(getStoredUser());
        });

        return unsubscribe;

    }, []);

    return (

        <Routes>

            <Route
                path="/"
                element={
                    user
                        ? <Navigate to="/chat" />
                        : <Navigate to="/login" />
                }
            />

            <Route
                path="/login"
                element={<Login />}
            />

            <Route
                path="/register"
                element={<Register />}
            />

            <Route
                path="/chat"
                element={
                    user
                        ? <Chat />
                        : <Navigate to="/login" />
                }
            />

            <Route
                path="/profile"
                element={<Profile />}
            />

            <Route
                path="/profile/:username"
                element={<Profile />}
            />

            <Route
                path="/create-group"
                element={<CreateGroup />}
            />

            <Route
    path="/group/:groupId"
    element={<GroupInfo />}
/>
        <Route
    path="/settings"
    element={<Settings />}
/>
    <Route
    path="/profile-setup"
    element={
        user
            ? <ProfileSetup />
            : <Navigate to="/login" />
    }
/>

<Route
    path="/global-chat"
    element={
        user
            ? <GlobalChat />
            : <Navigate to="/login" />
    }
/>

<Route
    path="/global/post/:postId"
    element={
        user
            ? <GlobalPostDetail />
            : <Navigate to="/login" />
    }
/>
<Route
    path="/top-supporters"
    element={
        user
            ? <TopSupporters />
            : <Navigate to="/login" />
    }
/>

<Route
    path="/donate"
    element={
        user
            ? <DonatePage />
            : <Navigate to="/login" />
    }
/>


        </Routes>

    );

}

export default App;