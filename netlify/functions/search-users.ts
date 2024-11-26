import { Handler } from '@netlify/functions';
import fetch from 'node-fetch';

const GITHUB_SEARCH_URL = 'https://api.github.com/search/users';

const handler: Handler = async (event) => {
  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      body: 'Method Not Allowed',
    };
  }

  try {
    const { q } = event.queryStringParameters || {};
    
    if (!q) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Search query is required' }),
      };
    }

    const searchResponse = await fetch(
      `${GITHUB_SEARCH_URL}?q=${encodeURIComponent(q)}&per_page=10`,
      {
        headers: {
          Accept: 'application/vnd.github.v3+json',
          Authorization: `token ${process.env.GITHUB_ACCESS_TOKEN}`,
        },
      }
    );

    const searchData = await searchResponse.json();

    // If we get user results, fetch detailed information for each user
    if (searchData.items && searchData.items.length > 0) {
      const detailedUsers = await Promise.all(
        searchData.items.map(async (user: any) => {
          const userResponse = await fetch(user.url, {
            headers: {
              Accept: 'application/vnd.github.v3+json',
              Authorization: `token ${process.env.GITHUB_ACCESS_TOKEN}`,
            },
          });
          return userResponse.json();
        })
      );

      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          total_count: searchData.total_count,
          items: detailedUsers,
        }),
      };
    }

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(searchData),
    };
  } catch (error) {
    console.error('Search error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal Server Error' }),
    };
  }
};

export { handler };
