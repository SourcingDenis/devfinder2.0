import React from 'react';
import { Search, Users, Code2, Mail } from 'lucide-react';

export default function HeroSection() {
  return (
    <div className="relative overflow-hidden py-16 sm:py-24">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h1 className="animate-fade-up text-4xl font-bold tracking-tight sm:text-6xl bg-gradient-to-r from-primary via-purple-500 to-pink-500 text-transparent bg-clip-text">
            Find GitHub Developers
          </h1>
          <p className="mt-6 text-lg leading-8 text-secondary-foreground animate-fade-up animation-delay-100">
            Search millions of GitHub profiles, discover talented developers, and connect with potential collaborators.
          </p>
        </div>

        <div className="mt-16 flow-root sm:mt-24">
          <div className="relative rounded-xl bg-card p-8 ring-1 ring-border/10 animate-fade-up animation-delay-200">
            <div className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2">
              <div className="flex space-x-6">
                {[Search, Users, Code2, Mail].map((Icon, i) => (
                  <div
                    key={i}
                    className="flex h-12 w-12 items-center justify-center rounded-full bg-card shadow-lg ring-1 ring-border/10"
                  >
                    <Icon className="h-6 w-6 animate-bounce" style={{ animationDelay: `${i * 200}ms` }} />
                  </div>
                ))}
              </div>
            </div>

            <div className="relative mx-auto max-w-2xl">
              <div className="grid grid-cols-1 gap-8 sm:grid-cols-2">
                <div className="pt-4">
                  <div className="flow-root rounded-lg bg-card px-6 pb-8">
                    <div className="-mt-6">
                      <h3 className="mt-8 text-lg font-semibold leading-8">Search by Location</h3>
                      <p className="mt-2 text-base text-secondary-foreground">
                        Find developers in specific cities or countries to build your local team.
                      </p>
                    </div>
                  </div>
                </div>
                <div className="pt-4">
                  <div className="flow-root rounded-lg bg-card px-6 pb-8">
                    <div className="-mt-6">
                      <h3 className="mt-8 text-lg font-semibold leading-8">Filter by Language</h3>
                      <p className="mt-2 text-base text-secondary-foreground">
                        Discover developers skilled in specific programming languages.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-10 flex items-center justify-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary animate-ping-slow">
                  <Search className="h-6 w-6 text-primary-foreground" />
                </div>
                <p className="text-base text-secondary-foreground">
                  Start by typing a username, location, or programming language above
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}