import React, { useState, KeyboardEvent } from 'react';
import { MapPin, Code2, ArrowUpDown } from 'lucide-react';

interface SearchFiltersProps {
  filters: {
    location: string;
    language: string;
    sort: string;
  };
  onFilterChange: (name: string, value: string) => void;
}

export default function SearchFilters({ filters, onFilterChange }: SearchFiltersProps) {
  const [locationInput, setLocationInput] = useState('');
  const locations = filters.location ? filters.location.split(',').filter(Boolean) : [];

  const handleLocationKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && locationInput.trim()) {
      e.preventDefault();
      const newLocations = [...locations, locationInput.trim()];
      onFilterChange('location', newLocations.join(','));
      setLocationInput('');
    }
  };

  const removeLocation = (locationToRemove: string) => {
    const newLocations = locations.filter(loc => loc !== locationToRemove);
    onFilterChange('location', newLocations.join(','));
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
      <div className="space-y-2">
        <div className="relative">
          <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
            <MapPin className="text-[var(--accents-3)] h-4 w-4" />
          </div>
          <input
            type="text"
            placeholder="Add location (press Enter)"
            className="geist-input pl-10"
            value={locationInput}
            onChange={(e) => setLocationInput(e.target.value)}
            onKeyDown={handleLocationKeyDown}
          />
        </div>
        <div className="flex flex-wrap gap-1.5 min-h-0">
          {locations.map((location) => (
            <span
              key={location}
              className="inline-flex items-center px-2 h-6 text-xs rounded-full bg-black/5 text-[var(--accents-6)]"
            >
              {location}
              <button
                onClick={() => removeLocation(location)}
                className="ml-1 hover:text-black"
              >
                ×
              </button>
            </span>
          ))}
        </div>
      </div>
      
      <div className="relative">
        <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
          <Code2 className="text-[var(--accents-3)] h-4 w-4" />
        </div>
        <input
          type="text"
          placeholder="Programming Language"
          className="geist-input pl-10"
          value={filters.language}
          onChange={(e) => onFilterChange('language', e.target.value)}
        />
      </div>

      <div className="relative">
        <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
          <ArrowUpDown className="text-[var(--accents-3)] h-4 w-4" />
        </div>
        <select
          className="geist-select pl-10"
          value={filters.sort}
          onChange={(e) => onFilterChange('sort', e.target.value)}
        >
          <option value="followers">Most Followers</option>
          <option value="repositories">Most Repositories</option>
          <option value="joined">Recently Joined</option>
          <option value="stars">Most Stars Given</option>
          <option value="active">Most Recently Active</option>
          <option value="inactive">Least Recently Active</option>
        </select>
      </div>
    </div>
  );
}