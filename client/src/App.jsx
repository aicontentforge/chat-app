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

function App() {

    const user = (() => {
    try {
        return JSON.parse(localStorage.getItem("user"));
    } catch {
        return null;
    }
})();

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


        </Routes>

    );

}

export default App;