import { env } from "process";
export const spotifyLogin = () => {


    const clientId = process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID;
    const redirectUri = `${window.location.origin}/api/auth/callback`;
    const scopes = "user-read-private user-read-email playlist-read-private";
    console.log(redirectUri);
    const authUrl = `https://accounts.spotify.com/authorize?client_id=${clientId}&response_type=code&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(scopes)}`;

    window.location.href = authUrl;

};
