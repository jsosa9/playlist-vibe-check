import { env } from "process";
export const spotifyLogin = () => {

    // Your app's credentials from the Spotify Dashboard
    const clientId = process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID;
    // The page in your app that Spotify should send the user back to
    const redirectUri = "http://127.0.0.1:3000/api/auth/callback";
    // The permissions your app is requesting
    const scopes = "user-read-private user-read-email playlist-read-private";

    // Construct the URL and redirect
    const authUrl = `https://accounts.spotify.com/authorize?client_id=${clientId}&response_type=code&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(scopes)}`;
    window.location.href = authUrl; // This is the crucial redirect

};
