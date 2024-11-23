import React, { useState } from 'react';
import { MapPin, Users, GitFork, Star, Building, Mail, Link as LinkIcon, Github, Loader2, AlertCircle, Calendar } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import type { GitHubUser } from '../types/github';
import ReadmeModal from './ReadmeModal';
import { getCommitEmail } from '../services/github';
import { languageColors } from '../utils/languageColors';
import { calculateSeniorityScore } from '../utils/seniorityScore';

interface UserCardProps {
  user: GitHubUser;
}

export default function UserCard({ user }: UserCardProps) {
  const [isReadmeOpen, setIsReadmeOpen] = useState(false);
  const [commitEmail, setCommitEmail] = useState<string | null>(null);
  const [loadingEmail, setLoadingEmail] = useState(false);
  const [emailError, setEmailError] = useState(false);

  const { score, level, color } = calculateSeniorityScore(user);

  const handleFetchEmail = async () => {
    setLoadingEmail(true);
    setEmailError(false);
    try {
      const email = await getCommitEmail(user.login);
      if (email) {
        setCommitEmail(email);
      } else {
        setEmailError(true);
      }
    } catch (error) {
      console.error('Error fetching commit email:', error);
      setEmailError(true);
    } finally {
      setLoadingEmail(false);
    }
  };

  return (
    <>
      <div className="geist-card">
        <div className="flex items-start gap-4 p-4">
          <a 
            href={user.html_url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-shrink-0"
          >
            <img
              src={user.avatar_url}
              alt={`${user.login}'s avatar`}
              className="w-16 h-16 rounded-full border-2 border-border"
            />
          </a>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between mb-2">
              <div>
                <h3 className="font-semibold text-foreground truncate flex items-center gap-2">
                  {user.name || user.login}
                  <span className={`text-sm font-medium ${color}`}>
                    {level} • {score}%
                  </span>
                </h3>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setIsReadmeOpen(true)}
                    className={`text-sm text-primary hover:underline ${user.readme ? 'readme-badge' : ''}`}
                  >
                    @{user.login}
                  </button>
                  <a
                    href={user.html_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-sm text-secondary-foreground hover:text-foreground"
                  >
                    <Github className="w-4 h-4" />
                    View Profile
                  </a>
                </div>
              </div>
              <span className="text-xs text-secondary-foreground whitespace-nowrap ml-2">
                Joined {formatDistanceToNow(new Date(user.created_at))} ago
              </span>
            </div>

            {user.bio && (
              <p className="text-sm text-secondary-foreground mb-2 line-clamp-2">{user.bio}</p>
            )}

            <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm mb-2">
              <div className="flex items-center text-secondary-foreground">
                <Users className="w-4 h-4 mr-1.5 flex-shrink-0" />
                <span className="truncate">
                  <span className="font-medium">{user.followers.toLocaleString()}</span> followers ·{' '}
                  <span className="font-medium">{user.following.toLocaleString()}</span> following
                </span>
              </div>

              <div className="flex items-center text-secondary-foreground">
                <GitFork className="w-4 h-4 mr-1.5 flex-shrink-0" />
                <span className="truncate">
                  <span className="font-medium">{user.public_repos.toLocaleString()}</span> repos ·{' '}
                  <span className="font-medium">{user.public_gists.toLocaleString()}</span> gists
                </span>
              </div>

              {user.location && (
                <div className="flex items-center text-secondary-foreground">
                  <MapPin className="w-4 h-4 mr-1.5 flex-shrink-0" />
                  <span className="truncate">{user.location}</span>
                </div>
              )}

              {user.starred_repos !== undefined && (
                <div className="flex items-center text-secondary-foreground">
                  <Star className="w-4 h-4 mr-1.5 flex-shrink-0" />
                  <span className="truncate">
                    <span className="font-medium">{user.starred_repos.toLocaleString()}</span> starred
                  </span>
                </div>
              )}

              {user.company && (
                <div className="flex items-center text-secondary-foreground col-span-2">
                  <Building className="w-4 h-4 mr-1.5 flex-shrink-0" />
                  <span className="truncate">{user.company}</span>
                </div>
              )}

              <div className="flex items-center gap-3 text-secondary-foreground col-span-2">
                {user.blog && (
                  <a 
                    href={user.blog.startsWith('http') ? user.blog : `https://${user.blog}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center hover:text-primary"
                  >
                    <LinkIcon className="w-4 h-4 mr-1.5 flex-shrink-0" />
                    <span className="truncate">{user.blog.replace(/^https?:\/\//, '')}</span>
                  </a>
                )}
                {(user.email || commitEmail) ? (
                  <a 
                    href={`mailto:${user.email || commitEmail}`}
                    className="flex items-center hover:text-primary"
                  >
                    <Mail className="w-4 h-4 mr-1.5 flex-shrink-0" />
                    <span className="truncate">{user.email || commitEmail}</span>
                  </a>
                ) : emailError ? (
                  <div className="flex items-center text-secondary-foreground">
                    <AlertCircle className="w-4 h-4 mr-1.5 flex-shrink-0" />
                    <span className="truncate">No public email found</span>
                  </div>
                ) : (
                  <button
                    onClick={handleFetchEmail}
                    disabled={loadingEmail}
                    className="flex items-center hover:text-primary disabled:opacity-50"
                  >
                    {loadingEmail ? (
                      <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
                    ) : (
                      <Mail className="w-4 h-4 mr-1.5 flex-shrink-0" />
                    )}
                    <span className="truncate">
                      {loadingEmail ? 'Finding email...' : 'Find email in commits'}
                    </span>
                  </button>
                )}
              </div>
            </div>

            {user.top_languages && user.top_languages.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {user.top_languages.map((lang) => {
                  const colors = languageColors[lang] || { bg: 'bg-gray-100 dark:bg-gray-800', text: 'text-gray-700 dark:text-gray-300' };
                  return (
                    <span
                      key={lang}
                      className={`px-2 py-0.5 text-xs font-medium rounded-full ${colors.bg} ${colors.text} border border-current border-opacity-10`}
                    >
                      {lang}
                    </span>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      <ReadmeModal
        isOpen={isReadmeOpen}
        onClose={() => setIsReadmeOpen(false)}
        readme={user.readme}
        username={user.login}
      />
    </>
  );
}