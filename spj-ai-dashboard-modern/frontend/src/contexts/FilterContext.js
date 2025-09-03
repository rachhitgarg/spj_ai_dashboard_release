import React, { createContext, useContext, useState } from 'react';

const FilterContext = createContext();

export const useFilters = () => {
  const context = useContext(FilterContext);
  if (!context) {
    throw new Error('useFilters must be used within a FilterProvider');
  }
  return context;
};

export const FilterProvider = ({ children }) => {
  const [filters, setFilters] = useState({
    tools: ['AI Tutor', 'AI Mentor', 'JPT'],
    courses: ['GMBA', 'MGB'],
    cohorts: [],
    phases: ['Pre-AI', 'Yoodli', 'JPT'],
    year: null,
    program: null
  });

  const updateFilters = (newFilters) => {
    setFilters(prev => ({
      ...prev,
      ...newFilters
    }));
  };

  const resetFilters = () => {
    setFilters({
      tools: ['AI Tutor', 'AI Mentor', 'JPT'],
      courses: ['GMBA', 'MGB'],
      cohorts: [],
      phases: ['Pre-AI', 'Yoodli', 'JPT'],
      year: null,
      program: null
    });
  };

  const getFilterParams = () => {
    const params = new URLSearchParams();
    
    if (filters.tools.length > 0) {
      params.append('tools', filters.tools.join(','));
    }
    
    if (filters.courses.length > 0) {
      params.append('courses', filters.courses.join(','));
    }
    
    if (filters.cohorts.length > 0) {
      params.append('cohorts', filters.cohorts.join(','));
    }
    
    if (filters.phases.length > 0) {
      params.append('phases', filters.phases.join(','));
    }
    
    if (filters.year) {
      params.append('year', filters.year);
    }
    
    if (filters.program) {
      params.append('program', filters.program);
    }
    
    return params.toString();
  };

  const value = {
    filters,
    updateFilters,
    resetFilters,
    getFilterParams
  };

  return (
    <FilterContext.Provider value={value}>
      {children}
    </FilterContext.Provider>
  );
};
