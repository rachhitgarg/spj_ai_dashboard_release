import React, { useState, useEffect } from 'react';
import { Filter, X } from 'lucide-react';
import { useFilters } from '../contexts/FilterContext';
import { cohortsAPI } from '../services/api';

const GlobalFilters = () => {
  const { filters, updateFilters, resetFilters } = useFilters();
  const [cohorts, setCohorts] = useState([]);
  const [showFilters, setShowFilters] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCohorts = async () => {
      try {
        const response = await cohortsAPI.getAll({ limit: 1000 });
        setCohorts(response.data.cohorts);
      } catch (error) {
        console.error('Error fetching cohorts:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCohorts();
  }, []);

  const handleToolChange = (tool) => {
    const newTools = filters.tools.includes(tool)
      ? filters.tools.filter(t => t !== tool)
      : [...filters.tools, tool];
    updateFilters({ tools: newTools });
  };

  const handleCourseChange = (course) => {
    const newCourses = filters.courses.includes(course)
      ? filters.courses.filter(c => c !== course)
      : [...filters.courses, course];
    updateFilters({ courses: newCourses });
  };

  const handleCohortChange = (cohortId) => {
    const newCohorts = filters.cohorts.includes(cohortId)
      ? filters.cohorts.filter(c => c !== cohortId)
      : [...filters.cohorts, cohortId];
    updateFilters({ cohorts: newCohorts });
  };

  const handlePhaseChange = (phase) => {
    const newPhases = filters.phases.includes(phase)
      ? filters.phases.filter(p => p !== phase)
      : [...filters.phases, phase];
    updateFilters({ phases: newPhases });
  };

  const activeFiltersCount = [
    filters.tools.length !== 3,
    filters.courses.length !== 2,
    filters.cohorts.length > 0,
    filters.phases.length !== 3
  ].filter(Boolean).length;

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
          <div className="h-8 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Filter className="h-5 w-5 text-gray-500" />
            <h3 className="text-lg font-medium text-gray-900">Global Filters</h3>
            {activeFiltersCount > 0 && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800">
                {activeFiltersCount} active
              </span>
            )}
          </div>
          <div className="flex items-center space-x-2">
            {activeFiltersCount > 0 && (
              <button
                onClick={resetFilters}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                Reset
              </button>
            )}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="text-sm text-primary-600 hover:text-primary-700"
            >
              {showFilters ? 'Hide' : 'Show'} Filters
            </button>
          </div>
        </div>

        {showFilters && (
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* AI Tools */}
            <div>
              <label className="label">AI Tools</label>
              <div className="space-y-2">
                {['AI Tutor', 'AI Mentor', 'JPT'].map((tool) => (
                  <label key={tool} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={filters.tools.includes(tool)}
                      onChange={() => handleToolChange(tool)}
                      className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">{tool}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Courses */}
            <div>
              <label className="label">Courses</label>
              <div className="space-y-2">
                {['GMBA', 'MGB'].map((course) => (
                  <label key={course} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={filters.courses.includes(course)}
                      onChange={() => handleCourseChange(course)}
                      className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">{course}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Cohorts */}
            <div>
              <label className="label">Cohorts</label>
              <div className="max-h-32 overflow-y-auto space-y-2">
                {cohorts.map((cohort) => (
                  <label key={cohort.cohort_id} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={filters.cohorts.includes(cohort.cohort_id)}
                      onChange={() => handleCohortChange(cohort.cohort_id)}
                      className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">{cohort.cohort_id}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Phases */}
            <div>
              <label className="label">Phases</label>
              <div className="space-y-2">
                {['Pre-AI', 'Yoodli', 'JPT'].map((phase) => (
                  <label key={phase} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={filters.phases.includes(phase)}
                      onChange={() => handlePhaseChange(phase)}
                      className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">{phase}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Active filters summary */}
        {activeFiltersCount > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="flex flex-wrap gap-2">
              {filters.tools.length !== 3 && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  Tools: {filters.tools.join(', ')}
                </span>
              )}
              {filters.courses.length !== 2 && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  Courses: {filters.courses.join(', ')}
                </span>
              )}
              {filters.cohorts.length > 0 && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                  Cohorts: {filters.cohorts.length} selected
                </span>
              )}
              {filters.phases.length !== 3 && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                  Phases: {filters.phases.join(', ')}
                </span>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default GlobalFilters;
