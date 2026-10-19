import { handleTmdb } from "../TMDBAPI/api/_tmdb.js";

export default function handler(req, res) {
  return handleTmdb(req, res, process.env);
}
