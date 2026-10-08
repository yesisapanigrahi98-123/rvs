import React, { useState } from 'react';
import { Outlet, useLocation, NavLink } from 'react-router-dom';
import { Navbar } from '../components/Navbar';
import { Sidebar } from '../components/Sidebar';
import { useAuth } from '../context/AuthContext';
import ErrorBoundary from '../components/ErrorBoundary';

export const DashboardLayout = () => {
  const location = useLocation();
  const { user, logout } = useAuth();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const toggleSidebar = () => setSidebarCollapsed(!sidebarCollapsed);
  const closeMobileSidebar = () => setMobileSidebarOpen(false);

  return (
    <div className="dashboard-layout">
      <Navbar onOpenPolicyModal={() => {}} />
      
      <div className="dashboard-container">
        <Sidebar 
          collapsed={sidebarCollapsed} 
          onToggleCollapse={toggleSidebar}
        />
        
        <main 
          className={`dashboard-main ${sidebarCollapsed ? 'sidebar-collapsed' : ''} ${mobileSidebarOpen ? 'mobile-sidebar-open' : ''}`}
          role="main"
        >
          {mobileSidebarOpen && (
            <div 
              className="sidebar-overlay" 
              onClick={closeMobileSidebar}
              aria-hidden="true"
            />
          )}
          
          <ErrorBoundary>
            <Outlet />
          </ErrorBoundary>
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;