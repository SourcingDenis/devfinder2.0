import { GitHubUser } from '../types/github';

const GITHUB_API_URL = 'https://api.github.com';
const STATS_SAMPLE_SIZE = 100;

interface SearchUsersResponse {
  total_count: number;
  incomplete_results: boolean;
  items: any[];
  stats_items?: any[];
}

function getAuthHeaders(token?: string) {
  const headers: Record<string, string> = {
    Accept: 'application/vnd.github.v3+json',
  };
  
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  
  return headers;
}

async function findEmailInCommits(username: string, repoName: string, token: string): Promise<string | null> {
  try {
    const commitsResponse = await fetch(
      `${GITHUB_API_URL}/repos/${username}/${repoName}/commits?author=${username}&per_page=10`,
      {
        headers: getAuthHeaders(token),
      }
    );

    if (!commitsResponse.ok) return null;

    const commits = await commitsResponse.json();
    
    for (const commit of commits) {
      const patchResponse = await fetch(commit.url + '.patch');
      if (!patchResponse.ok) continue;

      const patchText = await patchResponse.text();
      const emailMatch = patchText.match(/From: [^<]*<([^>]+)>/);
      
      if (emailMatch && emailMatch[1] && !emailMatch[1].includes('noreply.github.com')) {
        return emailMatch[1];
      }
    }

    return null;
  } catch (error) {
    console.error('Error fetching commit email:', error);
    return null;
  }
}

export async function getCommitEmail(username: string, token: string): Promise<string | null> {
  try {
    const reposResponse = await fetch(
      `${GITHUB_API_URL}/users/${username}/repos?type=owner&sort=pushed&per_page=10`,
      {
        headers: getAuthHeaders(token),
      }
    );

    if (!reposResponse.ok) {
      throw new Error('Failed to fetch repositories');
    }

    const repos = await reposResponse.json();
    
    const ownRepos = repos
      .filter((repo: any) => !repo.fork)
      .sort((a: any, b: any) => new Date(b.pushed_at).getTime() - new Date(a.pushed_at).getTime());

    for (const repo of ownRepos) {
      const email = await findEmailInCommits(username, repo.name, token);
      if (email) return email;
    }

    const eventsResponse = await fetch(
      `${GITHUB_API_URL}/users/${username}/events/public`,
      {
        headers: getAuthHeaders(token),
      }
    );

    if (!eventsResponse.ok) {
      throw new Error('Failed to fetch events');
    }

    const events = await eventsResponse.json();
    
    for (const event of events) {
      if (event.type === 'PushEvent' && event.payload?.commits) {
        for (const commit of event.payload.commits) {
          if (commit.author?.email && !commit.author.email.includes('noreply.github.com')) {
            return commit.author.email;
          }
        }
      }
    }

    return null;
  } catch (error) {
    console.error('Error in getCommitEmail:', error);
    return null;
  }
}

export async function searchUsers(
  query: string,
  filters: Record<string, string>,
  page: number = 1,
  fetchStats: boolean = false,
  token?: string
): Promise<SearchUsersResponse> {
  let q = query;

  if (filters.location) {
    const locations = filters.location.split(',').filter(Boolean);
    if (locations.length > 0) {
      q += ` ${locations.map(loc => `location:${loc.trim()}`).join(' ')}`;
    }
  }
  if (filters.language) q += ` language:${filters.language}`;

  const displayParams = new URLSearchParams({
    q,
    page: page.toString(),
    per_page: '30',
  });

  const displayResponse = await fetch(`${GITHUB_API_URL}/search/users?${displayParams}`, {
    headers: getAuthHeaders(token),
  });

  if (!displayResponse.ok) {
    throw new Error('Failed to fetch users');
  }

  const displayData = await displayResponse.json();
  
  let statsItems: any[] = [];
  if (fetchStats && page === 1) {
    const statsPromises = [];
    const totalPages = Math.min(Math.ceil(STATS_SAMPLE_SIZE / 30), 4);
    
    for (let i = 1; i <= totalPages; i++) {
      if (i === 1) continue;
      
      const statsParams = new URLSearchParams({
        q,
        page: i.toString(),
        per_page: '30',
      });
      
      statsPromises.push(
        fetch(`${GITHUB_API_URL}/search/users?${statsParams}`, {
          headers: getAuthHeaders(token),
        }).then(res => res.json())
      );
    }
    
    try {
      const statsResults = await Promise.all(statsPromises);
      statsItems = statsResults.flatMap(result => result.items);
    } catch (error) {
      console.error('Error fetching statistics data:', error);
    }
  }

  const detailedUsers = await Promise.all(
    displayData.items.map(async (user: any) => {
      const [userDetails, readme] = await Promise.all([
        getUserDetails(user.login, token),
        getUserReadme(user.login, token),
      ]);
      return {
        ...user,
        ...userDetails,
        readme,
      };
    })
  );

  const detailedStatsUsers = await Promise.all(
    statsItems.map(async (user: any) => {
      const userDetails = await getUserDetails(user.login, token);
      return {
        ...user,
        ...userDetails,
      };
    })
  );

  return {
    ...displayData,
    items: detailedUsers,
    stats_items: [...detailedUsers, ...detailedStatsUsers],
  };
}

async function getUserDetails(username: string, token: string) {
  const response = await fetch(`${GITHUB_API_URL}/users/${username}`, {
    headers: getAuthHeaders(token),
  });

  if (!response.ok) {
    throw new Error('Failed to fetch user details');
  }

  const userData = await response.json();

  const [activityData, starredCount] = await Promise.all([
    getUserActivity(username, token),
    getUserStarredCount(username, token),
  ]);

  return {
    ...userData,
    ...activityData,
    starred_repos: starredCount,
  };
}

async function getUserActivity(username: string, token: string) {
  const reposResponse = await fetch(
    `${GITHUB_API_URL}/users/${username}/repos?per_page=10&sort=updated`,
    {
      headers: getAuthHeaders(token),
    }
  );

  let top_languages: string[] = [];
  
  if (reposResponse.ok) {
    const repos = await reposResponse.json();
    const languages = repos
      .map((repo: any) => repo.language)
      .filter((lang: string | null): lang is string => Boolean(lang));
    
    top_languages = Array.from(new Set(languages)).slice(0, 5);
  }

  return {
    top_languages,
  };
}

async function getUserStarredCount(username: string, token: string) {
  const response = await fetch(
    `${GITHUB_API_URL}/users/${username}/starred?per_page=1`,
    {
      headers: getAuthHeaders(token),
    }
  );

  if (!response.ok) {
    return 0;
  }

  const linkHeader = response.headers.get('Link');
  if (!linkHeader) {
    return 0;
  }

  const matches = linkHeader.match(/page=(\d+)>; rel="last"/);
  return matches ? parseInt(matches[1], 10) : 0;
}

async function getUserReadme(username: string, token: string): Promise<string | null> {
  try {
    const response = await fetch(
      `${GITHUB_API_URL}/repos/${username}/${username}/readme`,
      {
        headers: getAuthHeaders(token),
      }
    );

    if (!response.ok) {
      return null;
    }

    return await response.text();
  } catch (error) {
    console.error('Error fetching user README:', error);
    return null;
  }
}