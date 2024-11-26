import React, { useState, useMemo } from 'react';
import { Search, Github, Loader2, LogIn } from 'lucide-react';
import SearchFilters from './components/SearchFilters';
import SearchInsights from './components/SearchInsights';
import UserCard from './components/UserCard';
import ThemeToggle from './components/ThemeToggle';
import HeroSection from './components/HeroSection';
import { searchUsers } from './services/github';
import { calculateSeniorityScore } from './utils/seniorityScore';
import type { GitHubUser } from './types/github';
import { useAuth } from './context/AuthContext';
import { initiateGitHubAuth } from './services/auth';

function App() {
  const { isAuthenticated, token, isLoading: authLoading } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [users, setUsers] = useState<GitHubUser[]>([]);
  const [statsUsers, setStatsUsers] = useState<GitHubUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [activeLanguage, setActiveLanguage] = useState('');
  const [activeSeniorityLevel, setActiveSeniorityLevel] = useState('');
  const [hasSearched, setHasSearched] = useState(false);
  const [filters, setFilters] = useState({
    location: '',
    language: '',
    sort: 'followers'
  });

  const filteredUsers = useMemo(() => {
    let filtered = users;
    
    if (activeLanguage) {
      filtered = filtered.filter(user => 
        user.top_languages?.includes(activeLanguage)
      );
    }
    
    if (activeSeniorityLevel) {
      filtered = filtered.filter(user => {
        const { level } = calculateSeniorityScore(user);
        return level === activeSeniorityLevel;
      });
    }
    
    return filtered;
  }, [users, activeLanguage, activeSeniorityLevel]);

  const sortedUsers = useMemo(() => {
    return [...filteredUsers].sort((a, b) => {
      switch (filters.sort) {
        case 'followers':
          return b.followers - a.followers;
        case 'repositories':
          return b.public_repos - a.public_repos;
        case 'joined':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case 'stars':
          return (b.starred_repos || 0) - (a.starred_repos || 0);
        case 'active':
          return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
        case 'inactive':
          return new Date(a.updated_at).getTime() - new Date(b.updated_at).getTime();
        default:
          return 0;
      }
    });
  }, [filteredUsers, filters.sort]);

  const handleSearch = async (pageNum = 1) => {
    if (!searchQuery.trim()) {
      setError('Please enter a search query');
      return;
    }

    if (!isAuthenticated) {
      initiateGitHubAuth();
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setActiveLanguage('');
      setActiveSeniorityLevel('');
      setHasSearched(true);
      
      if (pageNum === 1) {
        setUsers([]);
      }
      
      const result = await searchUsers(searchQuery, filters, pageNum, pageNum === 1, token);
      
      if (pageNum === 1) {
        setUsers(result.items);
        setStatsUsers(result.stats_items || []);
      } else {
        setUsers(prev => [...prev, ...result.items]);
      }
      
      setTotalCount(result.total_count);
      setHasMore(result.items.length === 30);
      setPage(pageNum);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleLoadMore = () => {
    if (!loading && hasMore) {
      handleSearch(page + 1);
    }
  };

  const handleLanguageClick = (language: string) => {
    setActiveLanguage(language);
    setActiveSeniorityLevel(''); // Reset seniority filter when language changes
  };

  const handleSeniorityClick = (level: string) => {
    setActiveSeniorityLevel(level);
    setActiveLanguage(''); // Reset language filter when seniority changes
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch(1);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Github className="h-6 w-6" />
            <span className="font-semibold text-lg">DevFinder</span>
          </div>
          <div className="flex items-center space-x-4">
            <ThemeToggle />
            {!isAuthenticated && !authLoading && (
              <button
                onClick={() => initiateGitHubAuth()}
                className="flex items-center space-x-2 px-4 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90"
              >
                <LogIn className="h-4 w-4" />
                <span>Login with GitHub</span>
              </button>
            )}
          </div>
        </div>
      </nav>

      <main className="container mx-auto px-4 py-8">
        {!hasSearched && <HeroSection />}

        <div className="max-w-3xl mx-auto space-y-6">
          <div className="flex space-x-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="Search GitHub users..."
                className="w-full pl-10 pr-4 py-2 rounded-md border bg-background"
              />
            </div>
            <button
              onClick={() => handleSearch()}
              disabled={loading || (!isAuthenticated && !authLoading)}
              className="px-4 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                'Search'
              )}
            </button>
          </div>

          {error && (
            <div className="p-4 rounded-md bg-destructive/10 text-destructive">
              {error}
            </div>
          )}

          {hasSearched && (
            <>
              <div className="grid gap-6 md:grid-cols-[240px_1fr]">
                <SearchFilters
                  filters={filters}
                  setFilters={setFilters}
                  onSearch={() => handleSearch()}
                />
                <div className="space-y-6">
                  {users.length > 0 && (
                    <SearchInsights
                      users={statsUsers}
                      activeLanguage={activeLanguage}
                      setActiveLanguage={setActiveLanguage}
                      activeSeniorityLevel={activeSeniorityLevel}
                      setActiveSeniorityLevel={setActiveSeniorityLevel}
                    />
                  )}
                  <div className="space-y-4">
                    {sortedUsers.map((user) => (
                      <UserCard key={user.id} user={user} />
                    ))}
                  </div>
                  {hasMore && (
                    <button
                      onClick={handleLoadMore}
                      disabled={loading}
                      className="w-full py-2 rounded-md bg-secondary text-secondary-foreground hover:bg-secondary/90 disabled:opacity-50"
                    >
                      {loading ? (
                        <Loader2 className="h-4 w-4 animate-spin mx-auto" />
                      ) : (
                        'Load More'
                      )}
                    </button>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}

export default App;