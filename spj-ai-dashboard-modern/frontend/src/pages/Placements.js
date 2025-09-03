import React from 'react';
import { Building2 } from 'lucide-react';

const Placements = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-3">
        <Building2 className="h-8 w-8 text-primary-600" />
        <h1 className="text-3xl font-bold text-gray-900">Placements & Company Visits</h1>
      </div>
      
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
        <Building2 className="h-16 w-16 text-gray-400 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Placements Dashboard</h2>
        <p className="text-gray-600 mb-4">
          Monitor placement outcomes, company visits, and recruitment trends
        </p>
        <div className="text-sm text-gray-500">
          Features coming soon: Placement funnel, company analysis, role distribution
        </div>
      </div>
    </div>
  );
};

export default Placements;
