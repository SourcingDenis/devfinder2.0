import React, { useState, useMemo } from 'react';
import { Plus } from 'lucide-react';
import type { GitHubUser } from '../types/github';
import { languageColors } from '../utils/languageColors';

interface SearchInsightsProps {
  users: GitHubUser[];
  totalCount: number;
  onLanguageClick: (language: string) => void;
  onSeniorityClick: (level: string) => void;
  activeLanguage?: string;
  activeSeniorityLevel?: string;
}

interface SeniorityMetrics {
  score: number;
  level: string;
  color: string;
}

function calculateSeniorityScore(user: GitHubUser): SeniorityMetrics {
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

export default function SearchInsights({ 
  users, 
  totalCount, 
  onLanguageClick, 
  onSeniorityClick,
  activeLanguage,
  activeSeniorityLevel 
}: SearchInsightsProps) {
  const [showAllLanguages, setShowAllLanguages] = useState(false);
  
  const { languageStats, seniorityDistribution } = useMemo(() => {
    const stats: Record<string, number> = {};
    const seniority: Record<string, number> = {};
    let usersWithLanguages = 0;

    users.forEach(user => {
      if (user.top_languages && user.top_languages.length > 0) {
        usersWithLanguages++;
        user.top_languages.forEach(lang => {
          stats[lang] = (stats[lang] || 0) + 1;
        });
      }

      const { level } = calculateSeniorityScore(user);
      seniority[level] = (seniority[level] || 0) + 1;
    });

    const sampleRatio = totalCount / users.length;
    
    return {
      languageStats: Object.entries(stats)
        .map(([language, count]) => ({
          language,
          count: Math.round(count * sampleRatio),
          percentage: (count / usersWithLanguages) * 100
        }))
        .sort((a, b) => b.count - a.count),
      seniorityDistribution: Object.entries(seniority)
        .map(([level, count]) => ({
          level,
          count: Math.round(count * sampleRatio),
          percentage: (count / users.length) * 100
        }))
        .sort((a, b) => {
          const levels = ['Principal', 'Staff', 'Senior', 'Mid-Level', 'Junior', 'Entry'];
          return levels.indexOf(a.level) - levels.indexOf(b.level);
        })
    };
  }, [users, totalCount]);

  const displayLanguages = showAllLanguages 
    ? languageStats
    : languageStats.slice(0, 10);

  if (users.length === 0) {
    return (
      <div className="geist-card p-6">
        <h2 className="text-lg font-medium mb-4">Insights</h2>
        <p className="text-secondary-foreground text-sm">
          No data available for the current search results.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="geist-card p-6">
        <h2 className="text-lg font-medium mb-6">Developer Levels</h2>
        <div className="space-y-4">
          {seniorityDistribution.map(({ level, count, percentage }) => {
            const { color } = calculateSeniorityScore({ ...users[0], level } as GitHubUser);
            return (
              <button
                key={level}
                onClick={() => onSeniorityClick(level === activeSeniorityLevel ? '' : level)}
                className={`group relative w-full text-left transition-colors rounded px-2 py-1.5 -mx-2 ${
                  level === activeSeniorityLevel ? color.replace('text-', 'bg-').replace('dark:', '') + ' bg-opacity-10' : 'hover:bg-black/[0.02] dark:hover:bg-white/[0.02]'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className={`font-medium ${color}`}>{level}</span>
                  <span className="text-secondary-foreground text-sm">
                    {count.toLocaleString()} ({percentage.toFixed(1)}%)
                  </span>
                </div>
                <div className="h-1.5 rounded-full bg-black/[0.03] dark:bg-white/[0.03] overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all ${color.replace('text-', 'bg-').replace('dark:', '')}`}
                    style={{ width: `${percentage}%`, opacity: 0.5 }}
                  />
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="geist-card p-6">
        <h2 className="text-lg font-medium mb-6">Languages</h2>
        <div className="space-y-3">
          {displayLanguages.map(({ language, count, percentage }) => {
            const colors = languageColors[language] || { bg: 'bg-gray-100 dark:bg-gray-800', text: 'text-gray-700 dark:text-gray-300' };
            return (
              <button
                key={language}
                onClick={() => onLanguageClick(language === activeLanguage ? '' : language)}
                className={`group relative w-full text-left transition-colors rounded px-2 py-1.5 -mx-2 ${
                  language === activeLanguage ? colors.bg : 'hover:bg-black/[0.02] dark:hover:bg-white/[0.02]'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className={`font-medium ${colors.text}`}>{language}</span>
                  <span className="text-secondary-foreground text-sm">
                    {count.toLocaleString()}
                  </span>
                </div>
                <div className="h-1.5 rounded-full bg-black/[0.03] dark:bg-white/[0.03] overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all ${colors.bg.replace('bg-', 'bg-opacity-50 bg-')}`}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </button>
            );
          })}
          
          {languageStats.length > 10 && (
            <button
              onClick={() => setShowAllLanguages(!showAllLanguages)}
              className="flex items-center space-x-2 text-sm text-secondary-foreground hover:text-foreground transition-colors mt-4"
            >
              <Plus className="w-4 h-4" />
              <span>{showAllLanguages ? 'Show less' : 'More languages...'}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}