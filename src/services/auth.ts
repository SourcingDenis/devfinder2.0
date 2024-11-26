import config from '../config';

const GITHUB_AUTH_URL = 'https://github.com/login/oauth/authorize';
const GITHUB_TOKEN_URL = 'https://github.com/login/oauth/access_token';

export async function initiateGitHubAuth() {
  const params = new URLSearchParams({
    client_id: config.GITHUB_CLIENT_ID,
    redirect_uri: config.REDIRECT_URI,
    scope: 'read:user user:email',
  });

  window.location.href = `${GITHUB_AUTH_URL}?${params.toString()}`;
}

export async function handleAuthCallback(code: string) {
  try {
    const response = await fetch(`${config.API_URL}/api/auth/callback`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        code,
        client_id: config.GITHUB_CLIENT_ID,
        redirect_uri: config.REDIRECT_URI
      }),
    });

    if (!response.ok) {
      throw new Error('Authentication failed');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Auth callback error:', error);
    throw error;
  }
}