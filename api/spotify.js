import { handleSpotify } from "../SpotifyAPI/api/_spotify.js";

export default function handler(req, res) {
  return handleSpotify(req, res, process.env);
}
