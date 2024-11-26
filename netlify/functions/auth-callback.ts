import { Handler } from '@netlify/functions';
import fetch from 'node-fetch';

const GITHUB_TOKEN_URL = 'https://github.com/login/oauth/access_token';
const GITHUB_USER_URL = 'https://api.github.com/user';

const handler: Handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: 'Method Not Allowed',
    };
  }

  try {
    const { code } = JSON.parse(event.body || '{}');

    if (!code) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Code is required' }),
      };
    }

    // Verify environment variables
    if (!process.env.GITHUB_CLIENT_ID || !process.env.GITHUB_CLIENT_SECRET) {
      console.error('Missing required environment variables');
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Server configuration error' }),
      };
    }

    // Exchange code for access token
    const tokenResponse = await fetch(GITHUB_TOKEN_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        client_id: process.env.GITHUB_CLIENT_ID,
        client_secret: process.env.GITHUB_CLIENT_SECRET,
        code,
      }),
    });

    const tokenData = await tokenResponse.json();

    if (tokenData.error) {
      console.error('GitHub token error:', tokenData.error);
      return {
        statusCode: 400,
        body: JSON.stringify({ error: tokenData.error_description || 'Failed to get access token' }),
      };
    }

    const accessToken = tokenData.access_token;

    // Get user data
    const userResponse = await fetch(GITHUB_USER_URL, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'User-Agent': 'DevFinder-App',
      },
    });

    const userData = await userResponse.json();

    if (userData.error) {
      console.error('GitHub user data error:', userData.error);
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Failed to get user data' }),
      };
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        token: accessToken,
        user: {
          id: userData.id,
          login: userData.login,
          avatar_url: userData.avatar_url,
          name: userData.name,
          email: userData.email,
        },
      }),
    };
  } catch (error) {
    console.error('Auth callback error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal server error' }),
    };
  }
};

export { handler };
