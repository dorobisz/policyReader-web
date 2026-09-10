import React from 'react';
import { NavLink } from 'react-router-dom';
import type { AppLayoutUser } from './AppLayout';

export interface NavItem {
  label: string;
  to: string;
  icon: string;
  end?: boolean;
}

export interface SideNavBarProps {
  /**
   * Opcjonalna lista elementów nawigacyjnych.
   * Domyślnie: Dashboard ('/') i Upload ('/upload').
   */
  items?: NavItem[];
  /**
   * Callback wywoływany przy kliknięciu w element nawigacji (np. by zamknąć drawer na mobile).
   */
  onItemClick?: () => void;
  /**
   * Opcjonalny callback zamknięcia (dla przycisku zamknięcia na ekranach mobilnych).
   */
  onClose?: () => void;
  /**
   * Profil użytkownika wyświetlany na dole paska bocznego.
   */
  user?: AppLayoutUser;
  /**
   * Opcjonalna nazwa aplikacji (domyślnie 'BrokerEngine').
   */
  appName?: string;
  /**
   * Opcjonalny podtytuł aplikacji (domyślnie 'Policy Intelligence').
   */
  appSubtitle?: string;
}

const DEFAULT_NAV_ITEMS: NavItem[] = [
  {
    label: 'Dashboard',
    to: '/',
    icon: 'dashboard',
    end: true,
  },
  {
    label: 'Upload',
    to: '/upload',
    icon: 'upload_file',
  },
];

const DEFAULT_USER: AppLayoutUser = {
  name: 'John Doe',
  email: 'john.doe@broker.com',
  role: 'Admin',
  avatarUrl:
    'https://lh3.googleusercontent.com/aida-public/AB6AXuBh1rn5V81Uy6jOfeikPvKa5zWPzdg4biwcz-XkjCwJUJJ7Ma8rBg6Ih7di7vffpMadU--jSWMvi0WVk-tJHuZQyfJ-U-n4OWxOiUyGyJkmaao-4G3qfVBcidY9Ux40fh-UljfScuqtT4z59mzp4hLY41iKRbhpvRzkVnmlALjALukJpt8eWk75dTx0ZsBltqxNl9dOs4I8y1nPiC5cd9Ez3je46j6tMHVAlh8RCv7RCTHesXJmlbkpzw',
};

/**
 * SideNavBar — Komponent bocznego paska nawigacyjnego
 * 
 * Makiety źródłowe: dashboard/code.html, Upload/code.html, Batch_Processing/code.html.
 * Wykorzystuje NavLink z react-router-dom do automatycznego podświetlania aktywnego elementu
 * (klasa bg-surface-container-high, text-on-surface, ikona w wariancie wypełnionym).
 */
export const SideNavBar: React.FC<SideNavBarProps> = ({
  items = DEFAULT_NAV_ITEMS,
  onItemClick,
  onClose,
  user = DEFAULT_USER,
  appName = 'BrokerEngine',
  appSubtitle = 'Policy Intelligence',
}) => {
  return (
    <div className="flex flex-col h-full select-none">
      {/* Brand Header */}
      <div className="px-md mb-xl flex items-center justify-between">
        <div className="flex items-center gap-sm">
          <div className="w-10 h-10 rounded-full overflow-hidden bg-surface-container flex items-center justify-center text-primary font-bold shrink-0">
            BE
          </div>
          <div>
            <h1 className="font-headline-md text-headline-md font-bold text-on-surface leading-tight">
              {appName}
            </h1>
            <p className="font-label-md text-label-md text-on-surface-variant">
              {appSubtitle}
            </p>
          </div>
        </div>

        {/* Mobile Close Button */}
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="md:hidden p-xs rounded-lg text-on-surface-variant hover:bg-surface-container-low transition-colors"
            aria-label="Zamknij menu nawigacji"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        )}
      </div>

      {/* Navigation Links list */}
      <nav className="flex-1 px-sm space-y-xs overflow-y-auto">
        <ul className="space-y-xs list-none p-0 m-0">
          {items.map((item) => (
            <li key={item.to}>
              <NavLink
                to={item.to}
                end={item.end}
                onClick={onItemClick}
                className={({ isActive }) =>
                  `flex items-center gap-md px-md py-sm rounded-lg font-body-md text-body-md transition-all active:scale-[0.98] ${
                    isActive
                      ? 'bg-surface-container-high text-on-surface font-semibold'
                      : 'text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface transition-colors duration-200'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <span
                      className={`material-symbols-outlined transition-colors ${
                        isActive ? 'text-on-surface filled' : 'text-on-surface-variant'
                      }`}
                      data-weight={isActive ? 'fill' : undefined}
                    >
                      {item.icon}
                    </span>
                    <span>{item.label}</span>
                  </>
                )}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      {/* Bottom User Info */}
      <div className="mt-auto px-md pt-md border-t border-outline-variant/50">
        <div className="flex items-center gap-sm">
          {user.avatarUrl ? (
            <img
              alt={user.name}
              src={user.avatarUrl}
              className="w-8 h-8 rounded-full object-cover border border-outline-variant"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-secondary-container text-on-secondary-container flex items-center justify-center font-bold text-xs">
              {user.name.slice(0, 2).toUpperCase()}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="font-label-bold text-label-bold text-on-surface truncate">
              {user.name}
            </p>
            <p className="font-label-md text-label-md text-on-surface-variant truncate">
              {user.email ?? user.role ?? ''}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SideNavBar;
