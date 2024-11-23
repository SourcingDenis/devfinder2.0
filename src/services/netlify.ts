import { GitHubUser } from '../types/github';

const NETLIFY_FUNCTIONS_URL = import.meta.env.VITE_NETLIFY_FUNCTIONS_URL || '';

interface DeployConfig {
  siteId?: string;
  deployId?: string;
  deployUrl?: string;
}

export async function deployToNetlify(config: DeployConfig) {
  try {
    const response = await fetch(`${NETLIFY_FUNCTIONS_URL}/deploy`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(config),
    });

    if (!response.ok) {
      throw new Error('Deployment failed');
    }

    return await response.json();
  } catch (error) {
    console.error('Deployment error:', error);
    throw error;
  }
}

export async function getDeployStatus(deployId: string) {
  try {
    const response = await fetch(`${NETLIFY_FUNCTIONS_URL}/deploy-status?id=${deployId}`);
    
    if (!response.ok) {
      throw new Error('Failed to get deployment status');
    }

    return await response.json();
  } catch (error) {
    console.error('Status check error:', error);
    throw error;
  }
}