import React from 'react';
import { User } from 'lucide-react';

const Profile = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-3">
        <User className="h-8 w-8 text-primary-600" />
        <h1 className="text-3xl font-bold text-gray-900">Profile</h1>
      </div>
      
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
        <User className="h-16 w-16 text-gray-400 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">User Profile</h2>
        <p className="text-gray-600 mb-4">
          Manage your account settings and preferences
        </p>
        <div className="text-sm text-gray-500">
          Features coming soon: Profile editing, password change, account settings
        </div>
      </div>
    </div>
  );
};

export default Profile;
