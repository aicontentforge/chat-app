// Centralized backend configuration.
//
// Every place in the app that needs the server's address imports from
// here instead of hardcoding a URL. That way the whole app can be
// pointed at a different backend by changing ONE line.
//
// NOTE: The original source had this hardcoded as "http://localhost:3000"
// in many files. That only works when the app and the server run on the
// same machine (e.g. during local development). On a real phone,
// "localhost" means the phone itself, not your server - so images,
// file/voice uploads, avatars, and the donor leaderboard would all fail
// to load in the installed app. This file replaces those with your
// deployed server's real address (the same one already used for the
// chat socket connection).
export const API_ORIGIN = "https://my-chat-app-api-630a.onrender.com";

export const API_BASE_URL = `${API_ORIGIN}/api`;
