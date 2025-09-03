import React from 'react';
import { Upload } from 'lucide-react';

const DataUploader = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-3">
        <Upload className="h-8 w-8 text-primary-600" />
        <h1 className="text-3xl font-bold text-gray-900">Data Uploader</h1>
      </div>
      
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
        <Upload className="h-16 w-16 text-gray-400 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Data Upload & Management</h2>
        <p className="text-gray-600 mb-4">
          Upload Excel/CSV files with schema validation and data processing
        </p>
        <div className="text-sm text-gray-500">
          Features coming soon: File upload, template downloads, data validation, import history
        </div>
      </div>
    </div>
  );
};

export default DataUploader;
