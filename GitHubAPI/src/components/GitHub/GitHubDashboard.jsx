import GITHUB_CONFIG from "../../config/githubConfig";
import GitHubContributions from "./GitHubContributions";
import GitHubLanguages from "./GitHubLanguages";
import GitHubProfileCard from "./GitHubProfileCard";
import GitHubRepos from "./GitHubRepos";
import GitHubStats from "./GitHubStats";
import "./GitHub.css";

/**
 * Painel completo: perfil + indicadores + contribuições + linguagens + repositórios.
 * Cada parte também funciona sozinha, ex.: <GitHubRepos username="seu-usuario" />.
 *
 * <GitHubDashboard />   // usa o USERNAME do githubConfig.js
 */
export default function GitHubDashboard({ username = GITHUB_CONFIG.USERNAME }) {
  return (
    <div className="gh">
      <div className="gh-sections">
        <GitHubProfileCard username={username} />
        <GitHubStats username={username} />
        <GitHubContributions username={username} />
        <GitHubLanguages username={username} />
        <GitHubRepos username={username} />
      </div>
    </div>
  );
}
