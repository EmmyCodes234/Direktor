# Tournament Lobby Redesign - Implementation Guide

## 🚀 Quick Start

### Prerequisites
- React 18+
- Tailwind CSS 3.3+
- Framer Motion 10+
- Lucide React (for icons)
- shadcn/ui components

### Installation Steps

1. **Copy Component Files**
   ```bash
   # Copy the new UI components
   cp src/components/ui/TournamentCard.jsx your-project/src/components/ui/
   cp src/components/ui/StatsGrid.jsx your-project/src/components/ui/
   cp src/components/ui/FilterControls.jsx your-project/src/components/ui/
   cp src/components/ui/EmptyState.jsx your-project/src/components/ui/
   ```

2. **Update Your Tournament Lobby**
   ```bash
   # Replace your existing tournament lobby
   cp src/pages/RedesignedTournamentLobby.jsx your-project/src/pages/TournamentLobby.jsx
   ```

3. **Test the Components**
   ```bash
   # Optional: Add the showcase page for testing
   cp src/pages/ComponentShowcase.jsx your-project/src/pages/
   ```

## 📋 Component Usage

### TournamentCard

The `TournamentCard` component encapsulates all tournament information in a cohesive, interactive card.

```jsx
import TournamentCard from '../components/ui/TournamentCard';

<TournamentCard
  tournament={{
    id: 'tournament-id',
    name: 'Tournament Name',
    slug: 'tournament-slug',
    status: 'active', // setup, active, in_progress, completed, paused, draft
    mode: 'individual', // individual, team, swiss
    description: 'Tournament description',
    player_count: 24,
    current_round: 3,
    total_rounds: 7,
    completed_games: 36,
    created_at: '2024-01-01T00:00:00Z',
    start_date: '2024-01-15T09:00:00Z',
    location: 'Community Center',
    is_public: true,
    director_name: 'John Doe',
    director_avatar: 'https://...'
  }}
  onManage={(tournament) => console.log('Manage', tournament)}
  onView={(tournament) => console.log('View', tournament)}
  onShare={(tournament) => console.log('Share', tournament)}
  onDelete={(tournament) => console.log('Delete', tournament)}
/>
```

**Key Features:**
- Status-based color coding
- Interactive hover effects with glowing borders
- Primary "Manage" action with secondary icon actions
- Responsive design with mobile optimization
- Accessibility support with proper ARIA labels

### StatsGrid

The `StatsGrid` component displays statistics in an interactive, responsive grid layout.

```jsx
import StatsGrid from '../components/ui/StatsGrid';

<StatsGrid
  stats={[
    {
      key: 'total',
      label: 'Total Tournaments',
      value: 42,
      icon: 'Trophy',
      color: 'from-blue-500 to-cyan-500',
      description: 'All tournaments',
      trend: { direction: 'up', value: '+5 this month' }
    },
    // ... more stats
  ]}
  columns={4} // 2, 3, 4, 5, or 6
  onStatClick={(stat) => console.log('Clicked', stat)}
/>
```

**Configuration Options:**
- `columns`: Number of columns (2-6, responsive)
- `onStatClick`: Click handler for filtering
- `trend`: Optional trend indicators
- `color`: Gradient background for icons

### FilterControls

The `FilterControls` component provides a unified interface for filtering and sorting.

```jsx
import FilterControls from '../components/ui/FilterControls';

<FilterControls
  filters={[
    { key: 'all', label: 'All', count: 42 },
    { key: 'active', label: 'Active', count: 12 },
    { key: 'completed', label: 'Completed', count: 25 },
    { key: 'draft', label: 'Drafts', count: 5 }
  ]}
  activeFilter="all"
  onFilterChange={(filter) => setFilter(filter)}
  sortOptions={[
    { value: 'recent', label: 'Most Recent' },
    { value: 'name', label: 'Name A-Z' },
    { value: 'status', label: 'Status' }
  ]}
  activeSortBy="recent"
  onSortChange={(sort) => setSortBy(sort)}
  onSearch={() => console.log('Search clicked')}
  searchPlaceholder="Search tournaments..."
/>
```

**Features:**
- Tab-based filtering with count badges
- Sort dropdown with custom options
- Search functionality (placeholder for future implementation)
- Responsive layout (stacked on mobile, horizontal on desktop)

### EmptyState

The `EmptyState` component provides consistent empty state presentation.

```jsx
import EmptyState from '../components/ui/EmptyState';

<EmptyState
  icon="Trophy"
  title="No tournaments yet"
  description="Create your first tournament to get started."
  action={
    <Button onClick={() => navigate('/create')}>
      <Icon name="Plus" size={16} className="mr-2" />
      Create Tournament
    </Button>
  }
/>
```

**Customization:**
- Any Lucide React icon name
- Custom title and description
- Optional action button
- Animated entrance effects

## 🎨 Styling System

### Status Color Mapping

```jsx
const statusConfigs = {
  setup: { 
    variant: 'secondary', 
    icon: 'Settings', 
    color: 'orange',
    bgColor: 'bg-orange-100 dark:bg-orange-900/20',
    textColor: 'text-orange-700 dark:text-orange-300'
  },
  in_progress: { 
    variant: 'success', 
    icon: 'Play', 
    color: 'green',
    bgColor: 'bg-green-100 dark:bg-green-900/20',
    textColor: 'text-green-700 dark:text-green-300'
  },
  active: { 
    variant: 'success', 
    icon: 'Play', 
    color: 'green',
    bgColor: 'bg-green-100 dark:bg-green-900/20',
    textColor: 'text-green-700 dark:text-green-300'
  },
  completed: { 
    variant: 'outline', 
    icon: 'CheckCircle', 
    color: 'gray',
    bgColor: 'bg-gray-100 dark:bg-gray-900/20',
    textColor: 'text-gray-700 dark:text-gray-300'
  },
  paused: { 
    variant: 'warning', 
    icon: 'Pause', 
    color: 'yellow',
    bgColor: 'bg-yellow-100 dark:bg-yellow-900/20',
    textColor: 'text-yellow-700 dark:text-yellow-300'
  },
  draft: { 
    variant: 'secondary', 
    icon: 'FileText', 
    color: 'blue',
    bgColor: 'bg-blue-100 dark:bg-blue-900/20',
    textColor: 'text-blue-700 dark:text-blue-300'
  }
};
```

### Gradient Configurations

```jsx
const gradientColors = {
  blue: 'from-blue-500 to-cyan-500',
  green: 'from-green-500 to-emerald-500',
  purple: 'from-purple-500 to-pink-500',
  orange: 'from-orange-500 to-red-500',
  yellow: 'from-yellow-500 to-orange-500',
  gray: 'from-gray-500 to-slate-500'
};
```

### Animation Presets

```jsx
// Card entrance animation
const cardAnimation = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.3 }
};

// Hover effects
const hoverAnimation = {
  whileHover: { y: -4, scale: 1.02 },
  transition: { type: "spring", stiffness: 300 }
};

// Staggered animations
const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.1
    }
  }
};
```

## 📱 Responsive Breakpoints

### Grid Configurations

```jsx
const gridResponsive = {
  1: "grid-cols-1",
  2: "grid-cols-1 sm:grid-cols-2",
  3: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
  4: "grid-cols-2 md:grid-cols-4",
  5: "grid-cols-2 md:grid-cols-3 lg:grid-cols-5",
  6: "grid-cols-2 md:grid-cols-3 lg:grid-cols-6"
};
```

### Breakpoint Strategy

- **Mobile (< 640px)**: Single column layouts, stacked controls
- **Tablet (640px - 1024px)**: 2-column grids, some horizontal layouts
- **Desktop (> 1024px)**: Full multi-column layouts, horizontal controls

## ♿ Accessibility Implementation

### Keyboard Navigation

```jsx
// Example keyboard handler
const handleKeyDown = (event, action) => {
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault();
    action();
  }
};

// Usage in component
<div
  role="button"
  tabIndex={0}
  onKeyDown={(e) => handleKeyDown(e, onClick)}
  onClick={onClick}
  aria-label="Tournament card"
>
  {/* Card content */}
</div>
```

### ARIA Labels

```jsx
// Status indicators
<div
  className="status-badge"
  aria-label={`Tournament status: ${status}`}
  role="status"
>
  {statusText}
</div>

// Interactive elements
<button
  aria-label={`Manage ${tournament.name} tournament`}
  onClick={onManage}
>
  Manage
</button>
```

### Focus Management

```jsx
// Focus styles in Tailwind
const focusStyles = "focus:outline-none focus:ring-2 focus:ring-primary/50 focus:ring-offset-2";

// Usage
<button className={`${baseStyles} ${focusStyles}`}>
  Button Text
</button>
```

## 🔧 Customization Guide

### Adding New Tournament Statuses

1. **Update Status Configuration**
   ```jsx
   // In TournamentCard.jsx
   const statusConfigs = {
     // ... existing statuses
     cancelled: {
       variant: 'destructive',
       icon: 'X',
       color: 'red',
       bgColor: 'bg-red-100 dark:bg-red-900/20',
       textColor: 'text-red-700 dark:text-red-300'
     }
   };
   ```

2. **Update Filter Logic**
   ```jsx
   // In your main component
   const getFilteredTournaments = () => {
     // Add new status to filtering logic
     case 'cancelled':
       return tournament.status === 'cancelled';
   };
   ```

### Custom Stat Card Types

```jsx
// Add new stat configurations
const customStats = [
  {
    key: 'revenue',
    label: 'Total Revenue',
    value: '$12,450',
    icon: 'DollarSign',
    color: 'from-emerald-500 to-teal-500',
    description: 'Tournament earnings',
    trend: { direction: 'up', value: '+15%' }
  }
];
```

### Theme Customization

```jsx
// Custom color scheme
const customTheme = {
  primary: 'hsl(262, 83%, 58%)', // Purple
  secondary: 'hsl(210, 40%, 98%)', // Light gray
  accent: 'hsl(210, 40%, 78%)', // Medium gray
  muted: 'hsl(210, 40%, 96%)', // Very light gray
};

// Apply in tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: customTheme
    }
  }
};
```

## 🧪 Testing

### Component Testing

```jsx
// Example test for TournamentCard
import { render, screen, fireEvent } from '@testing-library/react';
import TournamentCard from '../TournamentCard';

const mockTournament = {
  id: '1',
  name: 'Test Tournament',
  status: 'active',
  // ... other required props
};

test('renders tournament card with correct information', () => {
  const onManage = jest.fn();
  
  render(
    <TournamentCard 
      tournament={mockTournament} 
      onManage={onManage}
    />
  );
  
  expect(screen.getByText('Test Tournament')).toBeInTheDocument();
  expect(screen.getByText('Active')).toBeInTheDocument();
  
  fireEvent.click(screen.getByText('Manage'));
  expect(onManage).toHaveBeenCalledWith(mockTournament);
});
```

### Accessibility Testing

```jsx
// Test keyboard navigation
test('supports keyboard navigation', () => {
  render(<TournamentCard tournament={mockTournament} onManage={onManage} />);
  
  const card = screen.getByRole('button');
  card.focus();
  
  fireEvent.keyDown(card, { key: 'Enter' });
  expect(onManage).toHaveBeenCalled();
});

// Test ARIA labels
test('has proper ARIA labels', () => {
  render(<TournamentCard tournament={mockTournament} />);
  
  expect(screen.getByLabelText(/tournament status/i)).toBeInTheDocument();
  expect(screen.getByLabelText(/manage.*tournament/i)).toBeInTheDocument();
});
```

## 🚀 Performance Optimization

### React.memo Usage

```jsx
// Optimize tournament cards
const TournamentCard = React.memo(({ tournament, onManage, onView, onShare, onDelete }) => {
  // Component implementation
}, (prevProps, nextProps) => {
  // Custom comparison for complex objects
  return (
    prevProps.tournament.id === nextProps.tournament.id &&
    prevProps.tournament.status === nextProps.tournament.status &&
    prevProps.tournament.player_count === nextProps.tournament.player_count
  );
});
```

### Callback Optimization

```jsx
// Use useCallback for event handlers
const handleTournamentManage = useCallback((tournament) => {
  // Handle manage action
}, [navigate]);

const handleTournamentDelete = useCallback((tournament) => {
  // Handle delete action
}, [user.id]);
```

### Virtual Scrolling (Future Enhancement)

```jsx
// For large tournament lists
import { FixedSizeGrid as Grid } from 'react-window';

const VirtualizedTournamentGrid = ({ tournaments }) => {
  const Cell = ({ columnIndex, rowIndex, style }) => {
    const tournament = tournaments[rowIndex * 3 + columnIndex];
    if (!tournament) return null;
    
    return (
      <div style={style}>
        <TournamentCard tournament={tournament} />
      </div>
    );
  };

  return (
    <Grid
      columnCount={3}
      columnWidth={300}
      height={600}
      rowCount={Math.ceil(tournaments.length / 3)}
      rowHeight={200}
      width={900}
    >
      {Cell}
    </Grid>
  );
};
```

## 📊 Analytics Integration

### Event Tracking

```jsx
// Track user interactions
const trackEvent = (eventName, properties) => {
  // Your analytics service (e.g., Mixpanel, Google Analytics)
  analytics.track(eventName, properties);
};

// Usage in components
const handleTournamentView = (tournament) => {
  trackEvent('Tournament Viewed', {
    tournamentId: tournament.id,
    tournamentStatus: tournament.status,
    playerCount: tournament.player_count
  });
  
  navigate(`/tournaments/${tournament.slug}/dashboard`);
};
```

### Performance Monitoring

```jsx
// Monitor component render times
const TournamentCard = ({ tournament, ...props }) => {
  const startTime = performance.now();
  
  useEffect(() => {
    const endTime = performance.now();
    const renderTime = endTime - startTime;
    
    if (renderTime > 16) { // More than one frame
      console.warn(`TournamentCard render took ${renderTime}ms`);
    }
  });
  
  // Component implementation
};
```

## 🔄 Migration Path

### Phase 1: Component Replacement
1. Install new components alongside existing ones
2. Create feature flags for gradual rollout
3. A/B test with subset of users

### Phase 2: Full Integration
1. Replace all tournament-related pages
2. Update routing and navigation
3. Migrate user preferences and settings

### Phase 3: Enhancement
1. Add advanced features (search, bulk actions)
2. Implement real-time updates
3. Add analytics and monitoring

## 🐛 Troubleshooting

### Common Issues

1. **Icons not displaying**
   ```jsx
   // Ensure Lucide React is installed
   npm install lucide-react
   
   // Check icon name spelling
   <Icon name="Trophy" /> // Correct
   <Icon name="trophy" /> // Incorrect - should be PascalCase
   ```

2. **Animations not working**
   ```jsx
   // Ensure Framer Motion is installed
   npm install framer-motion
   
   // Check for conflicting CSS
   // Remove any CSS that sets transform or opacity
   ```

3. **Responsive layout issues**
   ```jsx
   // Ensure Tailwind CSS is properly configured
   // Check that responsive prefixes are working
   className="grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
   ```

4. **Dark mode not working**
   ```jsx
   // Ensure dark mode is configured in tailwind.config.js
   module.exports = {
     darkMode: 'class', // or 'media'
     // ... rest of config
   };
   ```

### Debug Mode

```jsx
// Add debug props to components
const DEBUG = process.env.NODE_ENV === 'development';

const TournamentCard = ({ tournament, debug = DEBUG, ...props }) => {
  if (debug) {
    console.log('TournamentCard render:', tournament);
  }
  
  // Component implementation
};
```

## 📚 Additional Resources

- [shadcn/ui Documentation](https://ui.shadcn.com/)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [Framer Motion Documentation](https://www.framer.com/motion/)
- [React Accessibility Guidelines](https://reactjs.org/docs/accessibility.html)
- [Web Content Accessibility Guidelines (WCAG)](https://www.w3.org/WAI/WCAG21/quickref/)

---

This implementation guide provides everything needed to successfully integrate and customize the redesigned Tournament Lobby components. For additional support or questions, refer to the component source code and documentation.