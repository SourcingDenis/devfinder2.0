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

function App() {
  const [searchQuery, setSearchQuery] = useState('');
  const [users, setUsers] = useState<GitHubUser[]>([]);
  const [statsUsers, setStatsUsers] = useState<GitHubUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
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

    try {
      setLoading(true);
      setError(null);
      setActiveLanguage('');
      setActiveSeniorityLevel('');
      setHasSearched(true);
      
      if (pageNum === 1) {
        setUsers([]);
      }
      
      const result = await searchUsers(searchQuery, filters, pageNum, pageNum === 1);
      
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

  const handleGitHubSignIn = () => {
    const clientId = 'YOUR_GITHUB_CLIENT_ID';
    const redirectUri = encodeURIComponent(window.location.origin);
    const scope = encodeURIComponent('read:user user:email');
    const authUrl = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&scope=${scope}`;
    window.location.href = authUrl;
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

  const handleLoadMore = () => {
    handleSearch(page + 1);
  };

  const showHero = !isAuthenticated && !hasSearched && users.length === 0;

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 backdrop-blur-sm bg-background/70 border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center space-x-3">
              <Github className="h-6 w-6" />
              <h1 className="text-lg font-medium">GitHub User Search</h1>
            </div>
            <div className="flex items-center gap-3">
              <ThemeToggle />
              <button
                onClick={handleGitHubSignIn}
                className="geist-button-black"
              >
                <LogIn className="w-4 h-4 mr-2" />
                Sign in with GitHub
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          <div className="flex space-x-4">
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                <Search className="text-secondary-foreground/60 h-4 w-4" />
              </div>
              <input
                type="text"
                placeholder="Search GitHub users..."
                className="geist-input pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleKeyDown}
              />
            </div>
            <button
              onClick={() => handleSearch(1)}
              disabled={loading}
              className="geist-button-black min-w-[100px]"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <Search className="h-4 w-4 mr-2" />
                  Search
                </>
              )}
            </button>
          </div>

          <SearchFilters filters={filters} onFilterChange={(name, value) => {
            setFilters(prev => ({ ...prev, [name]: value }));
          }} />

          {showHero && <HeroSection />}

          {error && (
            <div className="geist-card p-4 text-red-600 text-sm">
              {error}
            </div>
          )}

          {sortedUsers.length > 0 && (
            <div className="flex gap-6">
              <div className="w-80 flex-shrink-0">
                <SearchInsights 
                  users={statsUsers.length > 0 ? statsUsers : sortedUsers}
                  totalCount={totalCount}
                  onLanguageClick={handleLanguageClick}
                  onSeniorityClick={handleSeniorityClick}
                  activeLanguage={activeLanguage}
                  activeSeniorityLevel={activeSeniorityLevel}
                />
              </div>
              
              <div className="flex-1 space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-medium">
                    Search Results
                    {(activeLanguage || activeSeniorityLevel) && (
                      <span className="ml-2 text-sm font-normal text-secondary-foreground">
                        {activeLanguage && `filtered by ${activeLanguage}`}
                        {activeSeniorityLevel && `filtered by ${activeSeniorityLevel} level`}
                      </span>
                    )}
                  </h2>
                  <span className="text-sm text-secondary-foreground">
                    Showing {sortedUsers.length} of {totalCount.toLocaleString()} users
                  </span>
                </div>

                <div className="space-y-4">
                  {sortedUsers.map((user) => (
                    <UserCard key={user.login} user={user} />
                  ))}
                </div>

                {loading && (
                  <div className="flex justify-center py-4">
                    <Loader2 className="h-5 w-5 animate-spin text-secondary-foreground" />
                  </div>
                )}

                {!loading && hasMore && users.length > 0 && !isAuthenticated && (
                  <div className="geist-card p-8 text-center">
                    <h3 className="text-lg font-medium mb-2">
                      Want to see more results?
                    </h3>
                    <p className="text-secondary-foreground mb-6">
                      Sign in with GitHub to increase your API rate limit and access more search results.
                    </p>
                    <button
                      onClick={handleGitHubSignIn}
                      className="geist-button-black"
                    >
                      <LogIn className="w-4 h-4 mr-2" />
                      Sign in with GitHub
                    </button>
                  </div>
                )}

                {!loading && hasMore && users.length > 0 && isAuthenticated && (
                  <div className="flex justify-center py-4">
                    <button
                      onClick={handleLoadMore}
                      className="geist-button-white"
                    >
                      Load More Results
                    </button>
                  </div>
                )}

                {!loading && !hasMore && users.length > 0 && (
                  <p className="text-center text-secondary-foreground py-4">
                    No more results to load
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default App;