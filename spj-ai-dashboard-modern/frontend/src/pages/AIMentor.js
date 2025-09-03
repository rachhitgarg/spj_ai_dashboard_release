import React from 'react';
import { Users } from 'lucide-react';

const AIMentor = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-3">
        <Users className="h-8 w-8 text-primary-600" />
        <h1 className="text-3xl font-bold text-gray-900">AI Mentor Analytics</h1>
      </div>
      
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
        <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">AI Mentor Dashboard</h2>
        <p className="text-gray-600 mb-4">
          Track capstone project improvements and higher degree success rates
        </p>
        <div className="text-sm text-gray-500">
          Features coming soon: Capstone performance, grade distribution, higher education tracking
        </div>
      </div>
    </div>
  );
};

export default AIMentor;
