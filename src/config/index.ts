interface Config {
  API_URL: string;
  GITHUB_CLIENT_ID: string;
  REDIRECT_URI: string;
}

const config: Config = {
  API_URL: import.meta.env.VITE_API_URL || 'https://beautiful-hamster-d585ec.netlify.app',
  GITHUB_CLIENT_ID: import.meta.env.VITE_GITHUB_CLIENT_ID || '',
  REDIRECT_URI: import.meta.env.VITE_REDIRECT_URI || 'https://beautiful-hamster-d585ec.netlify.app/auth/callback'
};

export default config;
