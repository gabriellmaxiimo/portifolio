import { handleGitHub } from "../GitHubAPI/api/_github.js";
import GITHUB_CONFIG from "../GitHubAPI/src/config/githubConfig.js";

export default function handler(req, res) {
  return handleGitHub(req, res, process.env, { onlyUser: GITHUB_CONFIG.USERNAME });
}
