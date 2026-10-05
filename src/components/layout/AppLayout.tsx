import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { SideNavBar } from './SideNavBar';

export interface AppLayoutUser {
  name: string;
  email?: string;
  role?: string;
  avatarUrl?: string;
}

export interface AppLayoutProps {
  /**
   * Opcjonalny komponent paska bocznego. Gdy nie przekazano, renderowany jest domyślny kontener SideBar.
   */
  sidebar?: React.ReactNode;
  /**
   * Opcjonalny niestandardowy pasek nagłówka. Gdy nie przekazano, renderowany jest domyślny TopAppBar.
   */
  header?: React.ReactNode;
  /**
   * Zawartość przekazywana bezpośrednio lub przez mechanizm Outlet z react-router-dom.
   */
  children?: React.ReactNode;
  /**
   * Opcjonalna nazwa tenanta wyświetlana w nagłówku. Domyślnie: 'TX-9921'.
   */
  tenantName?: string;
  /**
   * Informacje o profilu użytkownika wyświetlane w stopce sidebaru i nagłówku.
   */
  user?: AppLayoutUser;
}

const DEFAULT_USER: AppLayoutUser = {
  name: 'John Doe',
  email: 'john.doe@broker.com',
  role: 'Admin',
  avatarUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBh1rn5V81Uy6jOfeikPvKa5zWPzdg4biwcz-XkjCwJUJJ7Ma8rBg6Ih7di7vffpMadU--jSWMvi0WVk-tJHuZQyfJ-U-n4OWxOiUyGyJkmaao-4G3qfVBcidY9Ux40fh-UljfScuqtT4z59mzp4hLY41iKRbhpvRzkVnmlALjALukJpt8eWk75dTx0ZsBltqxNl9dOs4I8y1nPiC5cd9Ez3je46j6tMHVAlh8RCv7RCTHesXJmlbkpzw',
};

/**
 * AppLayout — Główny szablon aplikacji (Shell)
 * 
 * Zapewnia:
 * - Fixowany pasek boczny o szerokości 256px (w-64) po lewej stronie (z responsywnym drawerem na mobile).
 * - Górną belkę nawigacyjną (sticky TopAppBar) z indykatorem tenanta i profilem.
 * - Scrollowany obszar zawartości (main) po prawej stronie obsługujący Outlet z react-router-dom.
 */
export const AppLayout: React.FC<AppLayoutProps> = ({
  sidebar,
  header,
  children,
  tenantName = 'TX-9921',
  user = DEFAULT_USER,
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const closeMobileMenu = () => setIsMobileMenuOpen(false);
  const toggleMobileMenu = () => setIsMobileMenuOpen((prev) => !prev);

  return (
    <div className="bg-surface-bright text-on-surface font-body-md h-screen overflow-hidden flex">
      {/* Mobile Drawer Backdrop */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-inverse-surface/40 backdrop-blur-sm z-30 md:hidden transition-opacity"
          onClick={closeMobileMenu}
          aria-hidden="true"
        />
      )}

      {/* SideNavBar Container (Fixed on desktop, slide-over drawer on mobile) */}
      <aside
        className={`fixed top-0 bottom-0 left-0 w-64 h-screen bg-surface border-r border-outline-variant z-40 flex flex-col py-lg transition-transform duration-300 ease-in-out md:translate-x-0 ${
          isMobileMenuOpen ? 'translate-x-0 shadow-xl' : '-translate-x-full md:translate-x-0'
        }`}
        aria-label="Główna nawigacja"
      >
        {sidebar ?? (
          <SideNavBar
            onItemClick={closeMobileMenu}
            onClose={closeMobileMenu}
            user={user}
          />
        )}
      </aside>

      {/* Main Content Area (offset by sidebar width on desktop) */}
      <div className="flex-1 ml-0 md:ml-64 flex flex-col h-screen overflow-hidden min-w-0">
        {/* Sticky TopAppBar */}
        {header ? (
          header
        ) : (
          <header className="sticky top-0 z-10 h-16 bg-surface-bright border-b border-outline-variant flex items-center justify-between px-md md:px-xl shrink-0">
            <div className="flex items-center gap-md">
              {/* Mobile Hamburger Menu Toggle */}
              <button
                type="button"
                onClick={toggleMobileMenu}
                className="md:hidden p-sm -ml-sm rounded-lg text-on-surface-variant hover:bg-surface-container-low transition-colors flex items-center justify-center"
                aria-label="Otwórz menu nawigacji"
              >
                <span className="material-symbols-outlined">menu</span>
              </button>
            </div>

            <div className="flex items-center gap-md">
              {tenantName && (
                <span className="text-on-surface-variant font-body-sm hidden sm:inline-block">
                  Tenant: <span className="font-medium text-on-surface">{tenantName}</span>
                </span>
              )}
              {user.avatarUrl && (
                <img
                  alt={user.name}
                  src={user.avatarUrl}
                  className="w-8 h-8 rounded-full border border-outline-variant cursor-pointer object-cover"
                />
              )}
            </div>
          </header>
        )}

        {/* Scrollable Canvas for Page Content */}
        <main className="flex-1 overflow-y-auto bg-background p-margin-mobile md:p-margin-desktop">
          {children ?? <Outlet />}
        </main>
      </div>
    </div>
  );
};

export default AppLayout;
