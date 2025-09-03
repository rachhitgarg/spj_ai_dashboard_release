import React from 'react';
import { BookOpen } from 'lucide-react';

const AITutor = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-3">
        <BookOpen className="h-8 w-8 text-primary-600" />
        <h1 className="text-3xl font-bold text-gray-900">AI Tutor Analytics</h1>
      </div>
      
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
        <BookOpen className="h-16 w-16 text-gray-400 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">AI Tutor Dashboard</h2>
        <p className="text-gray-600 mb-4">
          Comprehensive analytics for AI Tutor usage and impact on student performance
        </p>
        <div className="text-sm text-gray-500">
          Features coming soon: Usage patterns, exam performance correlation, unit-wise analysis
        </div>
      </div>
    </div>
  );
};

export default AITutor;
