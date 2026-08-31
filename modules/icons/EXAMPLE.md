// Example: Replacing direct lucide imports with barrel
// BEFORE (direct import - may cause larger bundles if not optimized):
// import { Search, MapPin, Calendar } from 'lucide-react';
//
// AFTER (using barrel for centralized + potential size reduction):
import { Search, MapPin, Calendar } from './modules/icons';

// Usage remains identical:
// <Search className="w-4 h-4" />
// <MapPin className="w-4 h-4" />
// <Calendar className="w-4 h-4" />

// Benefits:
// - Single source for icon list (easy to audit/swap)
// - Enables future icon font or sprite replacement
// - Better tree-shaking when combined with bundler config
