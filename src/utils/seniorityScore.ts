import type { GitHubUser } from '../types/github';

export interface SeniorityMetrics {
  score: number;
  level: string;
  color: string;
}

export function calculateSeniorityScore(user: GitHubUser): SeniorityMetrics {
  const now = new Date();
  const accountAge = (now.getTime() - new Date(user.created_at).getTime()) / (1000 * 60 * 60 * 24 * 365);
  const lastActivityDays = (now.getTime() - new Date(user.updated_at).getTime()) / (1000 * 60 * 60 * 24);
  
  let score = 0;
  
  // Account age (max 25 points)
  score += Math.min(accountAge * 5, 25);
  
  // Followers impact (max 15 points)
  score += Math.min(Math.log10(user.followers + 1) * 5, 15);
  
  // Repository count (max 15 points)
  score += Math.min(Math.log10(user.public_repos + 1) * 5, 15);
  
  // Recent activity (max 15 points)
  score += Math.max(0, 15 - (lastActivityDays / 30) * 3);
  
  // Stars given (max 10 points)
  score += Math.min(Math.log10((user.starred_repos || 0) + 1) * 3, 10);
  
  // Language diversity (max 10 points)
  score += Math.min(((user.top_languages?.length || 0) / 5) * 10, 10);
  
  // Contribution metrics (max 10 points)
  if (user.commits) {
    score += Math.min(Math.log10(user.commits + 1) * 2, 5);
    score += Math.min(Math.log10((user.added || 0) + (user.deleted || 0) + 1) * 2, 5);
  }

  score = Math.min(Math.round(score), 100);

  let level: string;
  let color: string;
  
  if (score >= 85) {
    level = 'Principal';
    color = 'text-purple-600 dark:text-purple-400';
  } else if (score >= 70) {
    level = 'Staff';
    color = 'text-indigo-600 dark:text-indigo-400';
  } else if (score >= 55) {
    level = 'Senior';
    color = 'text-blue-600 dark:text-blue-400';
  } else if (score >= 40) {
    level = 'Mid-Level';
    color = 'text-green-600 dark:text-green-400';
  } else if (score >= 25) {
    level = 'Junior';
    color = 'text-yellow-600 dark:text-yellow-400';
  } else {
    level = 'Entry';
    color = 'text-gray-600 dark:text-gray-400';
  }

  return { score, level, color };
}