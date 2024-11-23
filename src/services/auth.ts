const API_URL = 'http://localhost:3000/api';

export async function initiateGitHubAuth() {
  const response = await fetch(`${API_URL}/auth/github`);
  const data = await response.json();
  window.location.href = data.url;
}

export async function handleAuthCallback(code: string) {
  const response = await fetch(`${API_URL}/auth/callback`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ code }),
  });

  if (!response.ok) {
    throw new Error('Authentication failed');
  }

  const data = await response.json();
  return data;
}