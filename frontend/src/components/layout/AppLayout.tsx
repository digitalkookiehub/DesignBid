import { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';

const pageTitles: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/clients': 'Clients',
  '/clients/new': 'New Client',
  '/proposals': 'Proposals',
  '/projects': 'Projects',
  '/projects/new': 'New Project',
  '/rate-card': 'Rate Card',
  '/quotations': 'Quotations',
  '/quotations/new': 'Quotation Builder',
  '/labour': 'Labour Directory',
  '/admin': 'Admin Panel',
  '/settings': 'Settings',
  '/profile': 'Profile',
};

function getPageTitle(pathname: string): string {
  if (pageTitles[pathname]) return pageTitles[pathname];
  if (pathname.includes('/clients/') && pathname.includes('/edit')) return 'Edit Client';
  if (pathname.includes('/clients/')) return 'Client Details';
  if (pathname.includes('/projects/') && pathname.includes('/edit')) return 'Edit Project';
  if (pathname.includes('/projects/')) return 'Project Details';
  if (pathname.includes('/quotations/')) return 'Quotation';
  return 'DesignBid';
}

export function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const title = getPageTitle(location.pathname);

  return (
    <div className="flex h-screen bg-[#f4f6fa]">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header title={title} onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
