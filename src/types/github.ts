export interface GitHubUser {
  id: number;
  avatar_url: string;
  login: string;
  name: string | null;
  location: string | null;
  followers: number;
  following: number;
  public_repos: number;
  bio: string | null;
  created_at: string;
  updated_at: string;
  html_url: string;
  company: string | null;
  blog: string | null;
  email: string | null;
  public_gists: number;
  recent_commits?: number;
  recent_prs?: number;
  top_languages?: string[];
  starred_repos?: number;
  readme?: string | null;
}