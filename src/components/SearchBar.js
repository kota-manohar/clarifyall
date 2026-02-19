import React, { useState, useEffect, useRef } from 'react';
import { debounce } from '../utils/toolFilter';
import '../styles/SearchBar.css';

function SearchBar({ onSearch, realTime = false }) {
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearchRef = useRef(null);

  // Set up debounced search for real-time filtering
  useEffect(() => {
    if (realTime) {
      debouncedSearchRef.current = debounce((term) => {
        onSearch(term);
      }, 300); // 300ms debounce for real-time search
    }

    return () => {
      if (debouncedSearchRef.current) {
        debouncedSearchRef.current.cancel?.();
      }
    };
  }, [realTime, onSearch]);

  const handleInputChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    
    if (realTime) {
      // Real-time search with debounce
      if (debouncedSearchRef.current) {
        debouncedSearchRef.current(value);
      }
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSearch(searchTerm);
  };

  const handleClear = () => {
    setSearchTerm('');
    onSearch('');
  };

  return (
    <form className="search-bar" onSubmit={handleSubmit}>
      <div className="search-input-wrapper">
        <svg className="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        
        <input
          type="text"
          className="search-input"
          placeholder={realTime ? "Search for AI tools... (instant results)" : "Search for AI tools... (e.g., 'chatbot', 'image generator')"}
          value={searchTerm}
          onChange={handleInputChange}
        />
        
        {searchTerm && (
          <button
            type="button"
            className="clear-button"
            onClick={handleClear}
            aria-label="Clear search"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
        
        <button type="submit" className="search-button">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <span>Search</span>
        </button>
      </div>
      
      <div className="search-suggestions">
        <span className="suggestion-label">Popular:</span>
        <button type="button" className="suggestion-tag" onClick={() => { setSearchTerm('chatbot'); onSearch('chatbot'); }}>
          Chatbot
        </button>
        <button type="button" className="suggestion-tag" onClick={() => { setSearchTerm('image'); onSearch('image'); }}>
          Image Generator
        </button>
        <button type="button" className="suggestion-tag" onClick={() => { setSearchTerm('writing'); onSearch('writing'); }}>
          Writing
        </button>
        <button type="button" className="suggestion-tag" onClick={() => { setSearchTerm('coding'); onSearch('coding'); }}>
          Coding
        </button>
      </div>
    </form>
  );
}

export default SearchBar;
