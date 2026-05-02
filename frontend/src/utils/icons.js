/**
 * Optimized Icon Imports
 * 
 * Instead of importing the entire lucide-react library (~900KB),
 * this file provides a centralized place to import only the icons we actually use.
 * 
 * BEFORE (BAD):
 * import { User, Settings, Home, ... } from 'lucide-react'; // Imports entire library
 * 
 * AFTER (GOOD):
 * import { User, Settings, Home } from '@/utils/icons'; // Imports only what's needed
 */

// ============================================================================
// COMMONLY USED ICONS - Import only what you need
// ============================================================================

// Navigation & UI
export { 
  Home,
  Menu,
  X,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  ArrowLeft,
  ArrowRight,
  Search,
  Filter,
  Settings,
  Bell,
  User,
  Users,
  LogOut,
  LogIn,
} from 'lucide-react';

// Actions
export {
  Plus,
  Minus,
  Edit,
  Trash2,
  Save,
  Download,
  Upload,
  Share2,
  Copy,
  Check,
  CheckCircle,
  XCircle,
  AlertCircle,
  Info,
  HelpCircle,
} from 'lucide-react';

// Communication
export {
  Mail,
  Phone,
  MessageSquare,
  Send,
  Inbox,
} from 'lucide-react';

// Business
export {
  ShoppingCart,
  CreditCard,
  DollarSign,
  TrendingUp,
  TrendingDown,
  BarChart,
  PieChart,
  Calendar,
  Clock,
  FileText,
  Folder,
  Package,
  Truck,
  MapPin,
  Building2,
} from 'lucide-react';

// Media
export {
  Image,
  Camera,
  Video,
  Eye,
  EyeOff,
  Star,
  Heart,
} from 'lucide-react';

// System
export {
  Lock,
  Unlock,
  Shield,
  AlertTriangle,
  Loader,
  RefreshCw,
  Power,
  Wifi,
  WifiOff,
} from 'lucide-react';

/**
 * Dynamic Icon Loader
 * Use this for icons that are rarely used or only needed in specific pages
 * 
 * Usage:
 * const Icon = await loadIcon('Zap');
 * <Icon className="w-4 h-4" />
 */
export async function loadIcon(iconName) {
  try {
    const module = await import('lucide-react');
    const Icon = module[iconName];
    
    if (!Icon) {
      console.warn(`[Icons] Icon "${iconName}" not found in lucide-react`);
      return module.HelpCircle; // Fallback icon
    }
    
    return Icon;
  } catch (error) {
    console.error(`[Icons] Failed to load icon "${iconName}":`, error);
    return null;
  }
}

/**
 * Preload specific icons
 * Useful for icons that will be needed soon but not immediately
 */
export async function preloadIcons(iconNames) {
  try {
    await Promise.all(iconNames.map(name => loadIcon(name)));
    console.log(`[Icons] Preloaded ${iconNames.length} icons`);
  } catch (error) {
    console.error('[Icons] Failed to preload icons:', error);
  }
}

// ============================================================================
// ICON COMPONENTS WITH COMMON PROPS
// ============================================================================

/**
 * Wrapper component for consistent icon sizing
 */
export const IconWrapper = ({ icon: Icon, size = 'md', className = '', ...props }) => {
  const sizeClasses = {
    xs: 'w-3 h-3',
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
    xl: 'w-8 h-8',
  };
  
  return <Icon className={`${sizeClasses[size]} ${className}`} {...props} />;
};

/**
 * Loading spinner icon
 */
export const LoadingIcon = ({ className = '', size = 'md' }) => {
  const sizeClasses = {
    xs: 'w-3 h-3',
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
    xl: 'w-8 h-8',
  };
  
  return (
    <Loader 
      className={`animate-spin ${sizeClasses[size]} ${className}`} 
    />
  );
};

export default {
  loadIcon,
  preloadIcons,
  IconWrapper,
  LoadingIcon,
};
