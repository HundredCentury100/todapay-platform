import { Home, Search, Wallet, User } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { usePlatform } from '@/capacitor/hooks';
import { useHaptics } from '@/capacitor/hooks/useHaptics';

interface NavTab {
  icon: typeof Home;
  label: string;
  path: string;
}

/**
 * Mobile bottom navigation bar
 * Only displays on native mobile platforms
 */
export const MobileBottomNav = () => {
  const { isNative } = usePlatform();
  const navigate = useNavigate();
  const location = useLocation();
  const { light } = useHaptics();

  // Don't render on web
  if (!isNative) return null;

  const tabs: NavTab[] = [
    { icon: Home, label: 'Home', path: '/' },
    { icon: Search, label: 'Explore', path: '/explore' },
    { icon: Wallet, label: 'Wallet', path: '/wallet' },
    { icon: User, label: 'Account', path: '/account' },
  ];

  const handleTabClick = (path: string) => {
    light(); // Haptic feedback on tap
    navigate(path);
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 safe-area-inset-bottom z-50">
      <div className="flex justify-around items-center h-16 px-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = location.pathname === tab.path;

          return (
            <button
              key={tab.path}
              onClick={() => handleTabClick(tab.path)}
              className={`flex flex-col items-center justify-center flex-1 py-2 px-1 transition-colors ${
                isActive ? 'text-primary' : 'text-gray-500'
              }`}
              aria-label={tab.label}
            >
              <Icon
                size={24}
                strokeWidth={isActive ? 2.5 : 2}
              />
              <span className={`text-xs mt-1 font-medium ${isActive ? 'font-semibold' : ''}`}>
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
