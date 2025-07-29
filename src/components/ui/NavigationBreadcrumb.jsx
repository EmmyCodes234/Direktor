import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Icon from '../AppIcon';

const NavigationBreadcrumb = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const routeMap = {
    '/tournament-setup-configuration': {
      label: 'Tournament Setup',
      parent: null
    },
    '/player-management-roster-control': {
      label: 'Player Management',
      parent: null
    },
    '/tournament-command-center-dashboard': {
      label: 'Command Center',
      parent: null
    },
    '/live-results-input-terminal': {
      label: 'Results Terminal',
      parent: null
    },
    '/tournament-settings-administration': {
      label: 'Settings',
      parent: null
    }
  };

  const currentRoute = routeMap[location.pathname];
  
  // Only show breadcrumbs for routes with parents or complex paths
  if (!currentRoute || !currentRoute.parent) {
    return null;
  }

  const breadcrumbs = [];
  let current = currentRoute;
  
  while (current) {
    breadcrumbs.unshift(current);
    current = current.parent ? routeMap[current.parent] : null;
  }

  const handleBreadcrumbClick = (path) => {
    if (path !== location.pathname) {
      navigate(path);
    }
  };

  return (
    <nav className="flex items-center space-x-2 px-6 py-3 text-sm text-muted-foreground">
      <Icon name="Home" size={14} className="text-muted-foreground" />
      {breadcrumbs.map((crumb, index) => (
        <React.Fragment key={crumb.path || index}>
          <Icon name="ChevronRight" size={14} className="text-muted-foreground/50" />
          <button
            onClick={() => handleBreadcrumbClick(crumb.path)}
            className={`
              font-medium transition-colors duration-200
              ${index === breadcrumbs.length - 1
                ? 'text-foreground cursor-default'
                : 'text-muted-foreground hover:text-foreground cursor-pointer'
              }
            `}
            disabled={index === breadcrumbs.length - 1}
          >
            {crumb.label}
          </button>
        </React.Fragment>
      ))}
    </nav>
  );
};

export default NavigationBreadcrumb;