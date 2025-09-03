import React from 'react';
import { Target } from 'lucide-react';

const JPT = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-3">
        <Target className="h-8 w-8 text-primary-600" />
        <h1 className="text-3xl font-bold text-gray-900">JPT Analytics</h1>
      </div>
      
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
        <Target className="h-16 w-16 text-gray-400 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">JPT Dashboard</h2>
        <p className="text-gray-600 mb-4">
          Analyze job preparation tool effectiveness and placement conversion improvements
        </p>
        <div className="text-sm text-gray-500">
          Features coming soon: Pre vs Post JPT comparison, AI scores analysis, conversion tracking
        </div>
      </div>
    </div>
  );
};

export default JPT;
