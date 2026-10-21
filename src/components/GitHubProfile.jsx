import GitHubDashboard from '../../GitHubAPI/src/components/GitHub/GitHubDashboard';
import GITHUB_CONFIG from '../../GitHubAPI/src/config/githubConfig';

export default function GitHubProfile({ title }) {
  return (
    <section className="github-profile-theme mb-10" aria-labelledby="github-profile-heading">
      <h2 id="github-profile-heading" className="mb-3 text-[10px] font-bold uppercase tracking-[0.2em] opacity-50">
        {title}
      </h2>
      <GitHubDashboard username={GITHUB_CONFIG.USERNAME} showSearch={false} />
    </section>
  );
}
