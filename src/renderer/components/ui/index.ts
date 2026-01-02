/**
 * UI Components Barrel
 * Componentes de utilidad/infraestructura
 */
export { ToastProvider, useToast } from './Toast';
export { ErrorBoundary } from './ErrorBoundary';

// Charts
export {
  BarChart,
  DonutChart,
  LineChart,
  Sparkline,
  ProgressRing,
} from './Charts';

// Skeleton Loaders
export {
  Skeleton,
  SkeletonText,
  SkeletonCard,
  SkeletonTable,
  SkeletonButton,
  SkeletonAvatar,
  SkeletonDashboard,
} from './Skeleton';

// Virtual List for large data sets
export { VirtualList, VirtualLogList } from './VirtualList';

// Transition Animations
export {
  AnimatedTab,
  PageTransition,
  SlideTransition,
  FadeTransition,
  StaggeredList,
} from './Transitions';

// Accessibility Utilities
export {
  useFocusTrap,
  useScreenReaderAnnounce,
  useRovingTabIndex,
  SkipToContent,
  VisuallyHidden,
  AccessibleLoading,
  AccessibleProgress,
  AccessibleError,
  AccessibleField,
} from './Accessibility';
