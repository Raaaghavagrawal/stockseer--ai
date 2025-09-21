import React, { useState } from 'react';
import { User, Coins } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useDummyAccount } from '../contexts/DummyAccountContext';
import UserProfile from './UserProfile';

const UserProfileButton: React.FC = () => {
  const { currentUser } = useAuth();
  const { isDummyAccount, zolosBalance } = useDummyAccount();
  const [showProfile, setShowProfile] = useState(false);

  if (!currentUser) return null;

  return (
    <>
      <button
        onClick={() => setShowProfile(true)}
        className="flex items-center space-x-2 p-2 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-all duration-300 ease-in-out transform hover:scale-105"
        title="User Profile"
      >
        <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
          <User className="w-4 h-4 text-white" />
        </div>
        {isDummyAccount && (
          <div className="hidden sm:flex items-center space-x-1">
            <Coins className="w-4 h-4 text-yellow-600" />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {zolosBalance.toLocaleString()}Z
            </span>
          </div>
        )}
      </button>

      <UserProfile
        isOpen={showProfile}
        onClose={() => setShowProfile(false)}
      />
    </>
  );
};

export default UserProfileButton;