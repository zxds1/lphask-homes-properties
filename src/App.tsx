/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { motion, AnimatePresence } from "motion/react";
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';
import { 
  Home, 
  Building2, 
  Camera, 
  Video, 
  HardHat, 
  MapPin, 
  Phone, 
  Mail, 
  Clock, 
  CheckCircle2, 
  ArrowRight,
  Menu,
  X,
  Facebook,
  Instagram,
  Twitter,
  Train,
  Search,
  Filter,
  Bed,
  Bath,
  Maximize,
  Calendar,
  Layers,
  Navigation,
  Scale,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ExternalLink,
  Eye,
  Info,
  Plus,
  Minus,
  Tag,
  Check,
  Layout,
  MessageSquare,
  Download
} from "lucide-react";
import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { AIChatBot } from "./components/AIChatBot";

// --- Types ---
interface Property {
  id: string;
  title: string;
  price: number;
  location: string;
  img: string;
  images: string[];
  type: 'rent' | 'sale';
  category: string;
  bedrooms?: number;
  bathrooms?: number;
  sqft?: number;
  amenities?: string[];
  leaseDuration?: string;
  plotSize?: string;
  zoning?: string;
  lat?: number;
  lng?: number;
  description: string;
  virtualTourUrl?: string;
  videoTourUrl?: string;
  tags?: string[];
  status: 'Available' | 'Under Offer' | 'Sold' | 'Rented' | 'Unavailable';
}

type RentUnitFilter = 'all' | 'single-room' | 'bedsitter' | '1-bedroom' | '2-bedroom' | 'hostel';

type HeroQuickPick = {
  label: string;
  location: string;
  displayPrice: string;
  priceRange: string;
  unitType: RentUnitFilter;
  tone: string;
};

interface RentalPriceBand {
  id: string;
  label: string;
  location: string;
  unitType: Exclude<RentUnitFilter, 'all'>;
  displayPrice: string;
  priceRange: string;
  tone: string;
}

interface Testimonial {
  id: string;
  name: string;
  role: string;
  content: string;
  photo: string;
  rating: number;
  date: string;
}

interface SiteConfig {
  siteName: string;
  siteNameSecondary: string;
  siteLogo: string;
  appIcon: string;
  bodyFontFamily: string;
  headingFontFamily: string;
  bodyTextColor: string;
  headingTextColor: string;
  footerTextColor: string;
  heroTitle: string;
  heroSubtitle: string;
  heroBadge: string;
  contactPhone: string;
  contactEmail: string;
  contactAddress: string;
  socialLinks: {
    facebook: string;
    instagram: string;
    twitter: string;
  };
  siteDescription: string;
  heroBgImage: string;
  servicesBgImage?: string;
  officeBgImage?: string;
  testimonialsBgImage?: string;
  rentalsBgImage?: string;
  salesBgImage?: string;
  contactBgImage?: string;
  footerBgImage?: string;
  viewingFee: string;
  adminEmail: string;
  singleRoomPriceRange: string;
  bedsitterPriceRange: string;
  oneBedroomPriceRange: string;
  twoBedroomPriceRange: string;
  hostelPriceRange: string;
  rentalPriceBands: RentalPriceBand[];
  propertiesManaged: string;
  happyClients: string;
  yearsExperience: string;
  secureTransactions: string;
  services: {
    id: string;
    title: string;
    desc: string;
    icon: string;
    color: string;
  }[];
  testimonials: Testimonial[];
  officeWorkingHours: string;
}

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform?: string }>;
}

// --- Data ---
const INITIAL_CONFIG: SiteConfig = {
  siteName: "LPHASK Homes",
  siteNameSecondary: "& Properties",
  siteLogo: "",
  appIcon: "/icon.svg",
  bodyFontFamily: "Inter, ui-sans-serif, system-ui, sans-serif",
  headingFontFamily: "Inter, ui-sans-serif, system-ui, sans-serif",
  bodyTextColor: "#0f172a",
  headingTextColor: "#020617",
  footerTextColor: "#bfdbfe",
  heroTitle: "",
  heroSubtitle: "",
  heroBadge: "",
  contactPhone: "",
  contactEmail: "",
  contactAddress: "",
  officeWorkingHours: "",
  adminEmail: "",
  propertiesManaged: "500+",
  happyClients: "1.2k",
  yearsExperience: "15+",
  secureTransactions: "100%",
  socialLinks: {
    facebook: "",
    instagram: "",
    twitter: ""
  },
  siteDescription: "",
  heroBgImage: "",
  servicesBgImage: "",
  officeBgImage: "",
  testimonialsBgImage: "",
  rentalsBgImage: "",
  salesBgImage: "",
  contactBgImage: "",
  footerBgImage: "",
  viewingFee: "",
  singleRoomPriceRange: "Ksh 3k - 8k",
  bedsitterPriceRange: "Ksh 6k - 12k",
  oneBedroomPriceRange: "Ksh 10k - 20k",
  twoBedroomPriceRange: "Ksh 18k - 35k",
  hostelPriceRange: "Ksh 2k - 6k",
  rentalPriceBands: [],
  services: [],
  testimonials: []
};

const PROPERTIES: Property[] = []; // Property inventory is loaded from the secure backend store.

const FONT_PRESETS = [
  { label: 'Modern Sans', value: 'Inter, ui-sans-serif, system-ui, sans-serif' },
  { label: 'Elegant Serif', value: 'Georgia, ui-serif, serif' },
  { label: 'Clean Sans', value: 'Verdana, Geneva, sans-serif' },
  { label: 'Readable Sans', value: 'Trebuchet MS, Arial, sans-serif' },
  { label: 'Mono Accent', value: 'Monaco, Consolas, monospace' },
] as const;

const buildInstallManifest = (config: SiteConfig) => {
  const appIcon = config.appIcon || config.siteLogo || '/icon.svg';
  return {
    name: `${config.siteName} ${config.siteNameSecondary}`.trim(),
    short_name: config.siteName,
    description: `${config.siteName} ${config.siteNameSecondary}`.trim(),
    start_url: '/',
    scope: '/',
    display: 'standalone',
    background_color: '#020617',
    theme_color: '#047857',
    icons: [
      {
        src: appIcon,
        sizes: 'any',
        type: 'image/svg+xml',
        purpose: 'any maskable',
      },
    ],
  };
};

const applyInstallManifest = (config: SiteConfig) => {
  if (typeof document === 'undefined') return () => {};
  const iconHref = config.appIcon || config.siteLogo || '/icon.svg';
  const manifest = buildInstallManifest(config);
  const blob = new Blob([JSON.stringify(manifest)], { type: 'application/manifest+json' });
  const href = URL.createObjectURL(blob);
  let link = document.querySelector<HTMLLinkElement>('link[rel="manifest"]');
  if (!link) {
    link = document.createElement('link');
    link.rel = 'manifest';
    document.head.appendChild(link);
  }
  link.href = href;
  let iconLink = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
  if (!iconLink) {
    iconLink = document.createElement('link');
    iconLink.rel = 'icon';
    document.head.appendChild(iconLink);
  }
  iconLink.href = iconHref;
  let appleIconLink = document.querySelector<HTMLLinkElement>('link[rel="apple-touch-icon"]');
  if (!appleIconLink) {
    appleIconLink = document.createElement('link');
    appleIconLink.rel = 'apple-touch-icon';
    document.head.appendChild(appleIconLink);
  }
  appleIconLink.href = iconHref;
  document.title = `${config.siteName} ${config.siteNameSecondary}`.trim();
  return () => URL.revokeObjectURL(href);
};

const INSTALL_DISMISSED_KEY = 'lphask-install-prompt-dismissed';
const OPEN_INSTALL_PROMPT_EVENT = 'open-install-prompt';

const InstallAndStartupOverlay = ({ config }: { config: SiteConfig }) => {
  const [showInstall, setShowInstall] = useState(false);
  const [showStartup, setShowStartup] = useState(true);
  const [showFloatingInstall, setShowFloatingInstall] = useState(true);
  const [installPromptEvent, setInstallPromptEvent] = useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    const showInstallLater = window.setTimeout(() => {
      if (!localStorage.getItem(INSTALL_DISMISSED_KEY)) {
        setShowInstall(true);
      }
    }, 2200);

    const hideStartup = window.setTimeout(() => {
      setShowStartup(false);
    }, 1500);

    const hideFloatingInstall = window.setTimeout(() => {
      setShowFloatingInstall(false);
    }, 10000);

    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setInstallPromptEvent(event as BeforeInstallPromptEvent);
      if (!localStorage.getItem(INSTALL_DISMISSED_KEY)) {
        setShowInstall(true);
      }
    };

    const handleAppInstalled = () => {
      setShowInstall(false);
      localStorage.setItem(INSTALL_DISMISSED_KEY, 'true');
    };

    const handleOpenInstallPrompt = () => {
      setShowInstall(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);
    window.addEventListener(OPEN_INSTALL_PROMPT_EVENT, handleOpenInstallPrompt as EventListener);

    return () => {
      window.clearTimeout(showInstallLater);
      window.clearTimeout(hideStartup);
      window.clearTimeout(hideFloatingInstall);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
      window.removeEventListener(OPEN_INSTALL_PROMPT_EVENT, handleOpenInstallPrompt as EventListener);
    };
  }, []);

  const handleInstall = async () => {
    if (!installPromptEvent) {
      setShowInstall(false);
      localStorage.setItem(INSTALL_DISMISSED_KEY, 'true');
      return;
    }

    await installPromptEvent.prompt();
    const choice = await installPromptEvent.userChoice;
    if (choice.outcome === 'accepted') {
      localStorage.setItem(INSTALL_DISMISSED_KEY, 'true');
    }
    setShowInstall(false);
    setInstallPromptEvent(null);
  };

  const handleDismiss = () => {
    setShowInstall(false);
    localStorage.setItem(INSTALL_DISMISSED_KEY, 'true');
  };

  const handleQuickInstall = async () => {
    if (installPromptEvent) {
      await handleInstall();
      return;
    }

    setShowInstall(true);
  };

  return (
    <>
      <AnimatePresence>
        {showStartup && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[260] flex items-center justify-center overflow-hidden bg-slate-950 text-white"
          >
            <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,rgba(16,185,129,0.18),transparent_42%),linear-gradient(180deg,#020617_0%,#0f172a_55%,#020617_100%)]" />
            <motion.div
              className="absolute -top-24 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-emerald-500/15 blur-3xl"
              animate={{ scale: [1, 1.08, 1] }}
              transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut' }}
            />
            <div className="relative flex w-[min(92vw,760px)] flex-col items-center gap-8 px-6 text-center">
              <div className="flex items-center gap-4">
                {config.siteLogo ? (
                  <img
                    src={config.siteLogo}
                    alt={config.siteName}
                    className="h-16 w-16 rounded-[1.4rem] object-contain bg-white/10 border border-white/10 shadow-2xl"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="h-16 w-16 rounded-[1.4rem] bg-emerald-600/20 border border-white/10 flex items-center justify-center shadow-2xl">
                    <Home className="h-8 w-8 text-emerald-300" />
                  </div>
                )}
                <div className="text-left">
                  <p className="text-[0.7rem] font-black uppercase tracking-[0.55em] text-emerald-300/70">Launching</p>
                  <h2 className="text-3xl md:text-4xl font-black tracking-tight">{config.siteName}</h2>
                </div>
              </div>

              <p className="max-w-2xl text-base md:text-lg text-white/72">
                Loading your property experience, rental bands, and saved preferences.
              </p>

              <div className="flex items-center gap-4 rounded-[2rem] border border-white/10 bg-white/5 px-5 py-4 backdrop-blur-xl">
                <div className="relative flex h-14 w-14 items-center justify-center rounded-full border border-emerald-400/25 bg-emerald-400/10">
                  <motion.div
                    className="absolute inset-0 rounded-full border-2 border-emerald-300/30 border-t-emerald-300"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1.6, repeat: Infinity, ease: 'linear' }}
                  />
                  <div className="h-2.5 w-2.5 rounded-full bg-emerald-300 shadow-[0_0_18px_rgba(110,231,183,0.9)]" />
                </div>
                <div className="text-left">
                  <p className="text-[0.65rem] font-black uppercase tracking-[0.45em] text-white/45">Preparing your dashboard</p>
                  <p className="mt-1 text-sm text-white/72">Syncing listings, filters, and install state.</p>
                </div>
              </div>

              <div className="grid w-full gap-3 sm:grid-cols-3">
                {[
                  'Verified rentals',
                  'Live price bands',
                  'Fast install ready',
                ].map((label, index) => (
                  <motion.div
                    key={label}
                    initial={{ opacity: 0, y: 14 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.25 + index * 0.12, duration: 0.45 }}
                    className="rounded-[1.35rem] border border-white/10 bg-white/[0.04] px-4 py-3 text-left"
                  >
                    <div className="mb-3 h-1.5 w-14 rounded-full bg-gradient-to-r from-emerald-400 to-emerald-200" />
                    <p className="text-sm font-semibold text-white/82">{label}</p>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showInstall && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[255] flex items-end justify-center bg-slate-950/50 px-4 pb-4 pt-12 backdrop-blur-sm"
            onClick={handleDismiss}
          >
            <motion.div
              initial={{ y: 40, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 40, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 260, damping: 28 }}
              onClick={(event) => event.stopPropagation()}
              className="w-full max-w-[34rem] rounded-[2rem] border border-white/10 bg-slate-950/96 p-4 text-white shadow-2xl backdrop-blur-xl"
            >
              <div className="mx-auto mb-4 h-1.5 w-14 rounded-full bg-white/15" />
              <div className="flex items-start gap-4">
                <div className="rounded-2xl bg-emerald-500/20 p-3 text-emerald-300">
                  <Download className="h-6 w-6" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold">Install the app</h3>
                  <p className="mt-1 text-sm text-white/70">
                    Save {config.siteName} on your device for faster access and offline browsing.
                  </p>
                </div>
              </div>
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={handleInstall}
                  className="rounded-2xl bg-emerald-500 px-4 py-3 text-sm font-bold text-slate-950 transition hover:bg-emerald-400"
                >
                  Install now
                </button>
                <button
                  type="button"
                  onClick={handleDismiss}
                  className="rounded-2xl border border-white/10 px-4 py-3 text-sm font-semibold text-white/80 transition hover:bg-white/5"
                >
                  Not now
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showFloatingInstall && (
          <motion.button
            type="button"
            onClick={handleQuickInstall}
            aria-label="Download app"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 12 }}
            className="fixed bottom-5 right-5 z-[254] inline-flex items-center gap-3 rounded-full border border-emerald-400/30 bg-slate-950/90 px-4 py-3 text-sm font-bold text-white shadow-2xl backdrop-blur-xl transition hover:border-emerald-300 hover:bg-slate-900"
          >
            <Download className="h-4 w-4 text-emerald-300" />
            <span className="hidden sm:inline">Download app</span>
          </motion.button>
        )}
      </AnimatePresence>
    </>
  );
};

const normalizeSearchValue = (value: unknown) => String(value ?? '').trim().toLowerCase();

const matchesPropertySearch = (property: Property, query: string) => {
  const normalizedQuery = normalizeSearchValue(query);
  if (!normalizedQuery) return true;

  const searchableFields = [
    property.id,
    property.title,
    property.location,
    property.category,
    property.status,
    property.description,
    property.type,
    property.leaseDuration,
    property.plotSize,
    property.zoning,
    ...(property.amenities ?? []),
    ...(property.tags ?? []),
  ];

  return searchableFields.some((field) => normalizeSearchValue(field).includes(normalizedQuery));
};

const getRentUnitType = (property: Property): RentUnitFilter => {
  const fields = normalizeSearchValue([
    property.title,
    property.category,
    property.description,
    ...(property.tags ?? []),
  ].join(' '));

  if (fields.includes('hostel')) return 'hostel';
  if (fields.includes('single room') || fields.includes('singleroom') || fields.includes('studio')) return 'single-room';
  if (fields.includes('bedsitter')) return 'bedsitter';
  if (fields.includes('1-bedroom') || fields.includes('1 bedroom') || fields.includes('one bedroom') || fields.includes('1b') || property.bedrooms === 1) {
    return '1-bedroom';
  }
  if (fields.includes('2-bedroom') || fields.includes('2 bedroom') || fields.includes('two bedroom') || fields.includes('2b') || property.bedrooms === 2) {
    return '2-bedroom';
  }
  if (property.bedrooms === 0) return 'single-room';
  return 'all';
};

const matchesRentUnitFilter = (property: Property, unitType: RentUnitFilter) => {
  if (unitType === 'all') return true;
  return getRentUnitType(property) === unitType;
};

const matchesPriceBand = (price: number, priceRange: string) => {
  if (priceRange === 'all') return true;
  const [min, max] = priceRange.split('-').map(Number);
  if (Number.isFinite(min) && Number.isFinite(max)) {
    return price >= min && price <= max;
  }
  if (Number.isFinite(min)) {
    return price >= min;
  }
  return true;
};

const RENTAL_UNIT_LABELS: Record<Exclude<RentUnitFilter, 'all'>, string> = {
  'single-room': 'Single Room',
  bedsitter: 'Bedsitter',
  '1-bedroom': '1 Bedroom',
  '2-bedroom': '2 Bedroom',
  hostel: 'Hostel',
};

const RENTAL_UNIT_TONES: Record<Exclude<RentUnitFilter, 'all'>, string> = {
  'single-room': 'from-emerald-500/20 to-emerald-700/30',
  bedsitter: 'from-cyan-500/20 to-cyan-700/30',
  '1-bedroom': 'from-sky-500/20 to-sky-700/30',
  '2-bedroom': 'from-amber-500/20 to-amber-700/30',
  hostel: 'from-rose-500/20 to-rose-700/30',
};

const createRentalPriceBand = (overrides: Partial<RentalPriceBand> = {}): RentalPriceBand => {
  const unitType = overrides.unitType ?? 'single-room';
  return {
    id: overrides.id ?? `band-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    label: overrides.label ?? RENTAL_UNIT_LABELS[unitType] ?? 'Rental Band',
    location: overrides.location ?? 'all',
    unitType,
    displayPrice: overrides.displayPrice ?? '',
    priceRange: overrides.priceRange ?? '',
    tone: overrides.tone ?? RENTAL_UNIT_TONES[unitType] ?? 'from-slate-500/20 to-slate-700/30',
  };
};

const getDefaultRentalBands = (config: SiteConfig): RentalPriceBand[] => [
  createRentalPriceBand({
    id: 'legacy-single-room',
    label: 'Single Rooms',
    location: 'all',
    unitType: 'single-room',
    displayPrice: config.singleRoomPriceRange || 'Ksh 3k - 8k',
    priceRange: '0-8000',
  }),
  createRentalPriceBand({
    id: 'legacy-bedsitter',
    label: 'Bedsitters',
    location: 'all',
    unitType: 'bedsitter',
    displayPrice: config.bedsitterPriceRange || 'Ksh 6k - 12k',
    priceRange: '6000-12000',
  }),
  createRentalPriceBand({
    id: 'legacy-1-bedroom',
    label: '1 Bedrooms',
    location: 'all',
    unitType: '1-bedroom',
    displayPrice: config.oneBedroomPriceRange || 'Ksh 10k - 20k',
    priceRange: '10000-20000',
  }),
  createRentalPriceBand({
    id: 'legacy-2-bedroom',
    label: '2 Bedrooms',
    location: 'all',
    unitType: '2-bedroom',
    displayPrice: config.twoBedroomPriceRange || 'Ksh 18k - 35k',
    priceRange: '18000-35000',
  }),
  createRentalPriceBand({
    id: 'legacy-hostel',
    label: 'Hostels',
    location: 'all',
    unitType: 'hostel',
    displayPrice: config.hostelPriceRange || 'Ksh 2k - 6k',
    priceRange: '0-6000',
  }),
];

const getEffectiveRentalBands = (config: SiteConfig) => {
  const configuredBands = (config.rentalPriceBands ?? [])
    .map((band) => createRentalPriceBand({
      ...band,
      location: band.location || 'all',
      label: band.label || RENTAL_UNIT_LABELS[band.unitType] || 'Rental Band',
      tone: band.tone || RENTAL_UNIT_TONES[band.unitType] || 'from-slate-500/20 to-slate-700/30',
    }))
    .filter((band) => band.priceRange || band.displayPrice);

  return configuredBands.length > 0 ? configuredBands : getDefaultRentalBands(config);
};

const matchesLocationFilter = (propertyLocation: string, location: string) => {
  if (location === 'all') return true;
  return normalizeSearchValue(propertyLocation).includes(normalizeSearchValue(location));
};

const UNIT_FILTER_OPTIONS: Array<{
  label: string;
  value: RentUnitFilter;
  priceRange: string;
}> = [
  { label: 'All Units', value: 'all', priceRange: 'all' },
  { label: 'Single Room', value: 'single-room', priceRange: '0-8000' },
  { label: 'Bedsitter', value: 'bedsitter', priceRange: '6000-12000' },
  { label: '1 Bedroom', value: '1-bedroom', priceRange: '10000-20000' },
  { label: '2 Bedroom', value: '2-bedroom', priceRange: '18000-35000' },
  { label: 'Hostel', value: 'hostel', priceRange: '0-6000' },
];

// --- SEO & Structured Data ---
const SEOData = ({ config }: { config: SiteConfig }) => {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "RealEstateAgent",
    "name": `${config.siteName} ${config.siteNameSecondary}`,
    "description": config.heroSubtitle,
    "url": window.location.href,
    "telephone": config.contactPhone,
    "address": {
      "@type": "PostalAddress",
      "addressLocality": "Nairobi", // Based on common Kenyan real estate context
      "addressCountry": "KE"
    },
    "openingHours": "Mo-Sa 08:00-18:00",
    "priceRange": "$$",
    "image": "https://picsum.photos/seed/lphask/800/600",
    "service": config.services.map(s => s.title)
  };

  return (
    <script type="application/ld+json">
      {JSON.stringify(structuredData)}
    </script>
  );
};

// --- Components ---

const IconRenderer = ({ name, className, size = 24 }: { name: string, className?: string, size?: number }) => {
  const icons: Record<string, any> = {
    Building2, HardHat, Camera, Train, Home, Phone, Mail, Clock, MapPin, Facebook, Instagram, Twitter, Video, Eye, Info, CheckCircle2
  };
  const Icon = icons[name] || Home;
  return <Icon className={className} size={size} />;
};

const Navbar = ({ onSearch, searchValue, onBookViewing, config }: { onSearch: (val: string) => void, searchValue: string, onBookViewing: () => void, config: SiteConfig }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks: Array<{ name: string; href: string; onClick?: (e: React.MouseEvent<HTMLAnchorElement>) => void }> = [
    { name: "Home", href: "#home" },
    { name: "Services", href: "#services" },
    { name: "Rentals", href: "#rentals" },
    { name: "Sales", href: "#sales" },
    { name: "Contact", href: "#contact" },
  ];

  return (
    <nav className={`fixed w-full z-50 transition-all duration-300 ${scrolled ? "bg-white shadow-md py-2" : "bg-transparent py-4"}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <div className="flex items-center gap-3">
              {config.siteLogo ? (
                <img
                  src={config.siteLogo}
                  alt={config.siteName}
                  className="h-10 w-10 rounded-xl object-contain bg-white/80 shadow-sm border border-white/50"
                  referrerPolicy="no-referrer"
                />
              ) : null}
              <span className="text-2xl font-extrabold tracking-tighter">
                <span className="text-emerald-700">{config.siteName}</span>
                <span className="text-red-700 ml-1">{config.siteNameSecondary}</span>
              </span>
            </div>
          </div>
          
          {/* Desktop Nav */}
          <div className="hidden md:flex items-center space-x-8">
            {scrolled && (
              <div className="relative flex items-center bg-slate-100 rounded-full px-4 py-1.5 border border-slate-200">
                <Search size={16} className="text-slate-400 mr-2" />
                <input 
                  type="text" 
                  placeholder="Quick search..." 
                  className="bg-transparent text-sm text-slate-900 focus:outline-none w-32 focus:w-48 transition-all"
                  value={searchValue}
                  onChange={(e) => onSearch(e.target.value)}
                />
              </div>
            )}
            {navLinks.map((link) => (
              <a 
                key={link.name} 
                href={link.href} 
                onClick={link.onClick}
                className={`text-sm font-semibold hover:text-emerald-700 transition-colors ${scrolled ? "text-slate-700" : "text-white"}`}
              >
                {link.name}
              </a>
            ))}
            <button
              type="button"
              onClick={() => window.dispatchEvent(new CustomEvent(OPEN_INSTALL_PROMPT_EVENT))}
              className={`text-sm font-semibold rounded-full px-4 py-2 border transition-colors ${scrolled ? 'text-emerald-700 border-emerald-200 bg-emerald-50 hover:bg-emerald-100' : 'text-white border-white/20 bg-white/10 hover:bg-white/20'}`}
            >
              Download App
            </button>
            <button onClick={onBookViewing} className="bg-emerald-700 text-white px-5 py-2 rounded-full text-sm font-bold hover:bg-emerald-800 transition-all shadow-lg shadow-emerald-700/20">
              Book Viewing
            </button>
          </div>

          {/* Mobile Toggle */}
          <div className="md:hidden flex items-center">
            <button onClick={() => setIsOpen(!isOpen)} className={scrolled ? "text-slate-900" : "text-white"}>
              {isOpen ? <X size={28} /> : <Menu size={28} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-white border-t border-slate-100 shadow-xl overflow-hidden"
          >
            <div className="px-4 pt-4 pb-6 space-y-4">
              <div className="relative flex items-center bg-slate-100 rounded-xl px-4 py-3 border border-slate-200">
                <Search size={20} className="text-slate-400 mr-2" />
                <input 
                  type="text" 
                  placeholder="Search properties..." 
                  className="bg-transparent text-base text-slate-900 focus:outline-none w-full"
                  value={searchValue}
                  onChange={(e) => onSearch(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                {navLinks.map((link) => (
                  <a 
                    key={link.name} 
                    href={link.href} 
                    onClick={(e) => {
                      setIsOpen(false);
                      if (link.onClick) link.onClick(e);
                    }}
                    className="block px-3 py-4 text-base font-medium text-slate-700 hover:text-emerald-700 hover:bg-slate-50 rounded-lg"
                  >
                    {link.name}
                  </a>
                ))}
                <button
                  type="button"
                  onClick={() => {
                    setIsOpen(false);
                    window.dispatchEvent(new CustomEvent(OPEN_INSTALL_PROMPT_EVENT));
                  }}
                  className="block w-full px-3 py-4 text-base font-medium text-emerald-700 hover:bg-emerald-50 rounded-lg text-left"
                >
                  Download App
                </button>
              </div>
              <button onClick={onBookViewing} className="w-full mt-4 bg-emerald-700 text-white px-5 py-3 rounded-xl text-base font-bold">
                Book Viewing
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

const buildHeroQuickPicks = (config: SiteConfig): HeroQuickPick[] => getEffectiveRentalBands(config).map((band) => ({
  label: band.label,
  location: band.location,
  displayPrice: band.displayPrice || 'Price on request',
  priceRange: band.priceRange || 'all',
  unitType: band.unitType,
  tone: band.tone,
}));

const Hero = ({ onSearch, onQuickPick, properties, config }: { onSearch: (val: string) => void, onQuickPick: (pick: HeroQuickPick) => void, properties: Property[], config: SiteConfig }) => {
  const headingStyle = { fontFamily: config.headingFontFamily, color: '#ffffff' };
  const bodyStyle = { fontFamily: config.bodyFontFamily, color: '#dbeafe' };
  const [searchValue, setSearchValue] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);

  const livePickRows = useMemo(() => {
    const counts = buildHeroQuickPicks(config).map((pick) => ({
      ...pick,
      count: properties.filter((property) =>
        property.type === 'rent' &&
        matchesRentUnitFilter(property, pick.unitType) &&
        matchesPriceBand(property.price, pick.priceRange) &&
        matchesLocationFilter(property.location, pick.location)
      ).length,
    }));

    return [...counts, ...counts];
  }, [config, properties]);

  const suggestions = useMemo(() => {
    const q = normalizeSearchValue(searchValue);
    if (!q) return [];
    const matches = new Set<string>();
    
    properties.forEach(p => {
      if (matchesPropertySearch(p, q)) {
        matches.add(p.title);
        matches.add(p.location);
      }
    });
    
    return Array.from(matches).slice(0, 5);
  }, [searchValue, properties]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(searchValue);
    setShowSuggestions(false);
    const listingsSection = document.getElementById('listings-container');
    if (listingsSection) {
      listingsSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setSearchValue(suggestion);
    onSearch(suggestion);
    setShowSuggestions(false);
    const listingsSection = document.getElementById('listings-container');
    if (listingsSection) {
      listingsSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section id="home" className="relative min-h-[115vh] overflow-hidden pb-24 lg:pb-28">
      {/* Background Image with Overlay */}
      <div className="absolute inset-0 z-0">
        <img
          src={config.heroBgImage}
          alt="Hero Background"
          className="w-full h-full object-cover"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950/92 via-slate-900/75 to-slate-900/45"></div>
        <div className="animated-bg-overlay"></div>
      </div>

      <div className="relative z-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 lg:pt-32 pb-8 w-full">
        <div className="grid gap-10 items-center min-h-[78vh]">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className="max-w-2xl"
          >
            <motion.span
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="inline-flex items-center gap-2 px-4 py-1.5 mb-6 text-xs font-bold tracking-widest text-white uppercase bg-red-700/95 rounded-full shadow-lg shadow-red-950/20"
            >
              <span className="h-2 w-2 rounded-full bg-white animate-pulse" />
              {config.heroBadge}
            </motion.span>

            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.9, ease: 'easeOut', delay: 0.25 }}
              className="text-5xl md:text-7xl font-extrabold text-white leading-[1.02] mb-6 max-w-xl"
              style={headingStyle}
            >
              {config.heroTitle.split(' ').map((word, i) => (
                word.toLowerCase() === 'premium'
                  ? <span key={i} className="text-emerald-500"> {word} </span>
                  : ` ${word} `
              ))}
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.9, delay: 0.35 }}
              className="text-lg md:text-xl text-slate-300 mb-10 leading-relaxed max-w-xl"
              style={bodyStyle}
            >
              {config.heroSubtitle}
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.42 }}
              className="flex flex-wrap items-center gap-3 mb-8"
            >
              <a href="#rentals" className="inline-flex items-center gap-2 rounded-full bg-emerald-600 px-6 py-3 text-sm font-bold text-white shadow-xl shadow-emerald-900/20 transition-transform hover:-translate-y-0.5">
                Explore Rentals
                <ArrowRight size={18} />
              </a>
              <a href="#contact" className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-6 py-3 text-sm font-bold text-white backdrop-blur-md transition-all hover:bg-white/20">
                Contact Us
              </a>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.45 }}
              className="space-y-4"
            >
              <div className="flex items-center gap-3 text-xs font-bold uppercase tracking-[0.35em] text-white/50">
                <span className="h-px w-10 bg-white/25" />
                Live Rental Band
              </div>

              <div className="overflow-hidden rounded-[2rem] border border-white/10 bg-white/5 backdrop-blur-xl shadow-2xl shadow-black/10">
                <motion.div
                  className="flex w-max gap-3 px-3 py-3"
                  animate={{ x: ['-50%', '0%'] }}
                  transition={{ duration: 26, ease: 'linear', repeat: Infinity }}
                >
                  {livePickRows.map((pick, index) => (
                    <motion.button
                      key={`${pick.label}-${index}`}
                      type="button"
                      whileHover={{ y: -2, scale: 1.01 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => onQuickPick(pick)}
                      className={`min-w-[220px] rounded-[1.5rem] border border-white/10 bg-gradient-to-br ${pick.tone} px-5 py-4 text-left text-white transition-all`}
                    >
                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <div className="text-[10px] font-black uppercase tracking-[0.3em] text-white/55 mb-2">
                            {pick.label}
                          </div>
                          <div className="text-lg font-extrabold leading-tight">{pick.displayPrice}</div>
                          <div className="mt-1 text-[11px] font-semibold text-white/65">
                            {pick.location === 'all' ? 'All locations' : pick.location}
                          </div>
                        </div>
                        <div className="rounded-2xl bg-white/15 px-3 py-2 text-right">
                          <div className="text-lg font-black leading-none">{pick.count}</div>
                          <div className="text-[9px] font-bold uppercase tracking-[0.25em] text-white/60">Live</div>
                        </div>
                      </div>
                      <div className="mt-4 flex items-center justify-between text-[11px] font-semibold text-white/70">
                        <span>Available now</span>
                        <span>Tap to filter</span>
                      </div>
                    </motion.button>
                  ))}
                </motion.div>
              </div>
            </motion.div>

            <details className="group mt-6 rounded-[2rem] border border-white/10 bg-white/5 backdrop-blur-xl shadow-2xl shadow-black/10 overflow-hidden">
              <summary className="ml-auto flex cursor-pointer list-none items-center justify-center p-4 text-white w-fit">
                <span className="sr-only">Toggle search and filters</span>
                <span className="flex h-12 w-12 items-center justify-center rounded-full border border-white/15 bg-white/10 backdrop-blur-md transition group-open:bg-emerald-500/20">
                  <ChevronDown className="h-5 w-5 transition-transform duration-300 group-open:rotate-180" />
                </span>
              </summary>

              <div className="border-t border-white/10 p-5 lg:p-6 space-y-5">
                <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-2">
                  <div className="flex-1 flex items-center px-4 py-3 bg-white/95 backdrop-blur-sm rounded-2xl">
                    <Search className="text-slate-400 mr-2" size={20} />
                    <input
                      type="text"
                      placeholder="Search by location, type, or ID (e.g. R1)..."
                      className="w-full bg-transparent text-slate-900 focus:outline-none placeholder:text-slate-500 font-medium"
                      value={searchValue}
                      onChange={(e) => {
                        setSearchValue(e.target.value);
                        setShowSuggestions(true);
                      }}
                      onFocus={() => setShowSuggestions(true)}
                    />
                  </div>
                  <button type="submit" className="bg-emerald-600 text-white px-6 py-3 rounded-2xl font-bold hover:bg-emerald-700 transition-all flex items-center justify-center gap-2 shadow-lg">
                    <Search size={18} />
                    Search
                  </button>
                </form>

                <AnimatePresence>
                  {showSuggestions && suggestions.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-100"
                    >
                      {suggestions.map((suggestion, idx) => (
                        <button
                          key={idx}
                          onClick={() => handleSuggestionClick(suggestion)}
                          className="w-full px-6 py-4 text-left hover:bg-slate-50 flex items-center gap-3 text-slate-700 font-medium transition-colors border-b border-slate-50 last:border-0"
                        >
                          <MapPin size={16} className="text-emerald-600" />
                          {suggestion}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                  <div className="rounded-[1.5rem] bg-white/10 border border-white/10 p-4 text-white">
                    <div className="text-xs uppercase tracking-[0.3em] text-white/45 mb-2">Properties</div>
                    <div className="text-2xl font-black">{config.propertiesManaged || '500+'}</div>
                    <div className="text-[11px] text-white/55 mt-1">Managed</div>
                  </div>
                  <div className="rounded-[1.5rem] bg-white/10 border border-white/10 p-4 text-white">
                    <div className="text-xs uppercase tracking-[0.3em] text-white/45 mb-2">Clients</div>
                    <div className="text-2xl font-black">{config.happyClients || '1.2k'}</div>
                    <div className="text-[11px] text-white/55 mt-1">Satisfied</div>
                  </div>
                  <div className="rounded-[1.5rem] bg-white/10 border border-white/10 p-4 text-white">
                    <div className="text-xs uppercase tracking-[0.3em] text-white/45 mb-2">Experience</div>
                    <div className="text-2xl font-black">{config.yearsExperience || '15+'}</div>
                    <div className="text-[11px] text-white/55 mt-1">Years</div>
                  </div>
                  <div className="rounded-[1.5rem] bg-white/10 border border-white/10 p-4 text-white">
                    <div className="text-xs uppercase tracking-[0.3em] text-white/45 mb-2">Security</div>
                    <div className="text-2xl font-black">{config.secureTransactions || '100%'}</div>
                    <div className="text-[11px] text-white/55 mt-1">Trusted</div>
                  </div>
                </div>
              </div>
            </details>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

const Services = ({ onSelectService, config }: { onSelectService: (service: string) => void, config: SiteConfig }) => {
  const headingStyle = { fontFamily: config.headingFontFamily, color: config.headingTextColor };
  const bodyStyle = { fontFamily: config.bodyFontFamily, color: config.bodyTextColor };
  return (
    <section id="services" className="py-24 bg-slate-50 relative overflow-hidden">
      {/* Background Image with Overlay */}
      <div className="absolute inset-0 z-0">
        <img 
          src={config.servicesBgImage || "https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=1920&q=80"} 
          alt="Services Background" 
          className="w-full h-full object-cover"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-white/10"></div>
        <div className="animated-bg-overlay"></div>
      </div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center mb-16">
          <h2 className="text-emerald-700 font-bold tracking-widest uppercase text-sm mb-4">Our Expertise</h2>
          <h3 className="text-4xl font-extrabold text-slate-900" style={headingStyle}>Comprehensive Home Solutions</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {config.services.map((service, idx) => (
            <motion.div 
              key={idx}
              whileHover={{ y: -10 }}
              className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 hover:shadow-xl transition-all flex flex-col"
            >
              <div className={`w-16 h-16 ${service.color} rounded-2xl flex items-center justify-center mb-6`}>
                <IconRenderer name={service.icon} className={service.color.replace('bg-', 'text-').replace('-50', '-600')} size={32} />
              </div>
              <h4 className="text-xl font-bold text-slate-900 mb-4" style={headingStyle}>{service.title}</h4>
              <p className="text-slate-600 leading-relaxed mb-6 flex-1" style={bodyStyle}>{service.desc}</p>
              <button 
                onClick={() => onSelectService(service.id)}
                className="flex items-center text-emerald-700 font-bold hover:gap-2 transition-all"
              >
                Book Service <ArrowRight size={18} className="ml-1" />
              </button>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

// --- Helper Functions ---
const getDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const R = 6371; // Radius of the earth in km
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c; // Distance in km
  return d;
};

const deg2rad = (deg: number) => deg * (Math.PI / 180);

// --- Components ---

const RequestInfoModal = ({ property, onClose }: { property: Property, onClose: () => void }) => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    message: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    containerRef.current?.focus();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/info-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          message: formData.message,
          propertyId: property.id,
          propertyTitle: property.title
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Unable to submit your request.');
      }
      setIsSuccess(true);
      setTimeout(onClose, 2000);
    } catch (err) {
      console.error(err);
      setError('Unable to submit your inquiry at this time. Please try again later.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[200] bg-slate-900/90 backdrop-blur-md flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="info-modal-title"
      tabIndex={-1}
      ref={containerRef}
    >
      <motion.div 
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        className="bg-white w-full max-w-lg rounded-[3rem] overflow-hidden shadow-2xl relative p-8 md:p-12"
      >
        <button onClick={onClose} aria-label="Close inquiry form" className="absolute top-8 right-8 p-2 hover:bg-slate-100 rounded-full transition-colors">
          <X size={24} />
        </button>

        {isSuccess ? (
          <div className="text-center py-12">
            <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 size={40} />
            </div>
            <h3 id="info-modal-title" className="text-3xl font-extrabold text-slate-900 mb-2">Inquiry Sent!</h3>
            <p className="text-slate-500">We'll get back to you with more information about <span className="font-bold">{property.title}</span> shortly.</p>
          </div>
        ) : (
          <>
            <div className="mb-8">
              <h3 id="info-modal-title" className="text-3xl font-extrabold text-slate-900 mb-2">Request Info</h3>
              <p className="text-slate-500">Inquire about <span className="font-bold text-emerald-600">{property.title}</span></p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1">
                <label htmlFor="info-name" className="text-xs font-bold text-slate-500 uppercase tracking-wider">Full Name</label>
                <input 
                  id="info-name"
                  type="text" 
                  required
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label htmlFor="info-email" className="text-xs font-bold text-slate-500 uppercase tracking-wider">Email Address</label>
                  <input 
                    id="info-email"
                    type="email" 
                    required
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
                <div className="space-y-1">
                  <label htmlFor="info-phone" className="text-xs font-bold text-slate-500 uppercase tracking-wider">Phone Number</label>
                  <input 
                    id="info-phone"
                    type="tel" 
                    required
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label htmlFor="info-message" className="text-xs font-bold text-slate-500 uppercase tracking-wider">Your Question</label>
                <textarea 
                  id="info-message"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none transition-all h-32 resize-none"
                  placeholder="What would you like to know?"
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  required
                />
              </div>
              {error && <p className="text-sm text-red-600">{error}</p>}
              <button 
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-emerald-600 text-white py-4 rounded-2xl font-bold text-lg hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-600/20 disabled:opacity-50 flex items-center justify-center"
              >
                {isSubmitting ? (
                  <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : "Send Inquiry"}
              </button>
            </form>
          </>
        )}
      </motion.div>
    </motion.div>
  );
};

const ViewingRequestModal = ({ property, onClose }: { property: Property, onClose: () => void }) => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    date: "",
    time: "",
    message: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    containerRef.current?.focus();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/viewing-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          date: formData.date,
          time: formData.time,
          message: formData.message,
          propertyId: property.id,
          propertyTitle: property.title
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Unable to submit your request.');
      }
      setIsSuccess(true);
      setTimeout(onClose, 2000);
    } catch (err) {
      console.error(err);
      setError('Unable to submit your viewing request at this time. Please try again later.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[200] bg-slate-900/90 backdrop-blur-md flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="viewing-modal-title"
      tabIndex={-1}
      ref={containerRef}
    >
      <motion.div 
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        className="bg-white w-full max-w-lg rounded-[3rem] overflow-hidden shadow-2xl relative p-8 md:p-12"
      >
        <button onClick={onClose} aria-label="Close viewing request form" className="absolute top-8 right-8 p-2 hover:bg-slate-100 rounded-full transition-colors">
          <X size={24} />
        </button>

        {isSuccess ? (
          <div className="text-center py-12">
            <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 size={40} />
            </div>
            <h3 id="viewing-modal-title" className="text-3xl font-extrabold text-slate-900 mb-2">Request Sent!</h3>
            <p className="text-slate-500">We'll contact you shortly to confirm your viewing.</p>
          </div>
        ) : (
          <>
            <div className="mb-8">
              <h3 id="viewing-modal-title" className="text-3xl font-extrabold text-slate-900 mb-2">Request Viewing</h3>
              <p className="text-slate-500">Schedule a visit for <span className="font-bold text-emerald-600">{property.title}</span></p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label htmlFor="viewing-name" className="text-xs font-bold text-slate-500 uppercase tracking-wider">Full Name</label>
                  <input 
                    id="viewing-name"
                    type="text" 
                    required
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
                <div className="space-y-1">
                  <label htmlFor="viewing-phone" className="text-xs font-bold text-slate-500 uppercase tracking-wider">Phone Number</label>
                  <input 
                    id="viewing-phone"
                    type="tel" 
                    required
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label htmlFor="viewing-email" className="text-xs font-bold text-slate-500 uppercase tracking-wider">Email Address</label>
                <input 
                  id="viewing-email"
                    type="email" 
                    required
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label htmlFor="viewing-date" className="text-xs font-bold text-slate-500 uppercase tracking-wider">Preferred Date</label>
                  <input 
                    id="viewing-date"
                    type="date" 
                    required
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  />
                </div>
                <div className="space-y-1">
                  <label htmlFor="viewing-time" className="text-xs font-bold text-slate-500 uppercase tracking-wider">Preferred Time</label>
                  <input 
                    id="viewing-time"
                    type="time" 
                    required
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                    value={formData.time}
                    onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label htmlFor="viewing-message" className="text-xs font-bold text-slate-500 uppercase tracking-wider">Additional Message</label>
                <textarea 
                  id="viewing-message"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none transition-all h-24 resize-none"
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                />
              </div>
              {error && <p className="text-sm text-red-600">{error}</p>}
              <button 
                type="submit" 
                disabled={isSubmitting}
                className="w-full bg-emerald-600 text-white py-4 rounded-2xl font-bold text-lg hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-600/20 disabled:opacity-50"
              >
                {isSubmitting ? 'Sending Request...' : 'Confirm Request'}
              </button>
            </form>
          </>
        )}
      </motion.div>
    </motion.div>
  );
};

const isVideoFileUrl = (url: string) => {
  return /\.(mp4|webm|ogg)(\?.*)?$/i.test(url) || url.startsWith('data:video/');
};

const isSafeHttpUrl = (url: string) => {
  try {
    const parsed = new URL(url, window.location.origin);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
};

const getEmbedUrl = (url: string) => {
  if (!url) return null;
  if (url.startsWith('data:video/')) return null; // Base64 video
  if (isVideoFileUrl(url)) return null;
  if (!isSafeHttpUrl(url)) return null;
  if (url.includes('youtube.com/watch?v=')) {
    return url.replace('watch?v=', 'embed/');
  }
  if (url.includes('youtu.be/')) {
    return url.replace('youtu.be/', 'youtube.com/embed/');
  }
  if (url.includes('vimeo.com/')) {
    return url.replace('vimeo.com/', 'player.vimeo.com/video/');
  }
  return null;
};

const getGoogleMapsSearchUrl = (location: string) => {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location)}`;
};

const PropertyDetail = ({ property, onClose, onRequestViewing, onRequestInfo }: { 
  property: Property, 
  onClose: () => void, 
  onRequestViewing: (p: Property) => void,
  onRequestInfo: (p: Property) => void
}) => {
  const [activeImg, setActiveImg] = useState(0);
  const allImages = [property.img, ...(property.images || [])];

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] bg-slate-950/95 backdrop-blur-xl overflow-y-auto"
    >
      <div className="max-w-6xl mx-auto px-4 py-12">
        <button 
          onClick={onClose}
          className="mb-8 flex items-center text-white/70 hover:text-white transition-colors group"
        >
          <ChevronLeft className="mr-2 group-hover:-translate-x-1 transition-transform" />
          Back to Listings
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Image Gallery */}
          <div className="space-y-4">
            <div className="relative aspect-[4/3] rounded-3xl overflow-hidden shadow-2xl">
              <img 
                src={allImages[activeImg]} 
                alt={property.title} 
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent pointer-events-none"></div>
            </div>
            <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
              {allImages.map((img, idx) => (
                <button 
                  key={idx}
                  onClick={() => setActiveImg(idx)}
                  className={`relative flex-shrink-0 w-24 h-24 rounded-2xl overflow-hidden border-2 transition-all ${activeImg === idx ? 'border-emerald-500 scale-105' : 'border-transparent opacity-60 hover:opacity-100'}`}
                >
                  <img src={img} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                </button>
              ))}
            </div>
          </div>

          {/* Details */}
          <div className="text-white">
            <div className="flex flex-wrap gap-3 mb-6">
              <span className="px-4 py-1.5 bg-emerald-600 rounded-full text-xs font-bold uppercase tracking-wider">
                {property.type === 'rent' ? 'For Rent' : 'For Sale'}
              </span>
              <span className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider ${
                property.status === 'Available' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                property.status === 'Under Offer' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                'bg-red-500/20 text-red-400 border border-red-500/30'
              }`}>
                {property.status}
              </span>
              <span className="px-4 py-1.5 bg-white/10 rounded-full text-xs font-bold uppercase tracking-wider">
                ID: {property.id}
              </span>
            </div>

            <h1 className="text-4xl md:text-5xl font-extrabold mb-4">{property.title}</h1>
            <div className="flex items-center text-white/60 mb-8 text-lg">
              <MapPin className="mr-2 text-emerald-500" size={20} />
              {property.location}
            </div>

            <div className="text-4xl font-black text-emerald-400 mb-10">
              Ksh {property.price.toLocaleString()}
              {property.type === 'rent' && <span className="text-xl font-normal text-white/40 ml-2">/ month</span>}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-6 mb-12">
              {property.bedrooms !== undefined && (
                <div className="bg-white/5 p-4 rounded-2xl border border-white/10">
                  <Bed className="text-emerald-500 mb-2" size={24} />
                  <div className="text-white/40 text-xs uppercase font-bold">Bedrooms</div>
                  <div className="text-xl font-bold">{property.bedrooms === 0 ? 'Studio' : property.bedrooms}</div>
                </div>
              )}
              {property.bathrooms && (
                <div className="bg-white/5 p-4 rounded-2xl border border-white/10">
                  <Bath className="text-emerald-500 mb-2" size={24} />
                  <div className="text-white/40 text-xs uppercase font-bold">Bathrooms</div>
                  <div className="text-xl font-bold">{property.bathrooms}</div>
                </div>
              )}
              {property.sqft && (
                <div className="bg-white/5 p-4 rounded-2xl border border-white/10">
                  <Maximize className="text-emerald-500 mb-2" size={24} />
                  <div className="text-white/40 text-xs uppercase font-bold">Area</div>
                  <div className="text-xl font-bold">{property.sqft} sqft</div>
                </div>
              )}
              {property.plotSize && (
                <div className="bg-white/5 p-4 rounded-2xl border border-white/10">
                  <Maximize className="text-red-500 mb-2" size={24} />
                  <div className="text-white/40 text-xs uppercase font-bold">Plot Size</div>
                  <div className="text-xl font-bold">{property.plotSize}</div>
                </div>
              )}
              {property.zoning && (
                <div className="bg-white/5 p-4 rounded-2xl border border-white/10">
                  <Layers className="text-amber-500 mb-2" size={24} />
                  <div className="text-white/40 text-xs uppercase font-bold">Zoning</div>
                  <div className="text-xl font-bold">{property.zoning}</div>
                </div>
              )}
              {property.leaseDuration && (
                <div className="bg-white/5 p-4 rounded-2xl border border-white/10">
                  <Clock className="text-blue-500 mb-2" size={24} />
                  <div className="text-white/40 text-xs uppercase font-bold">Lease</div>
                  <div className="text-xl font-bold">{property.leaseDuration}</div>
                </div>
              )}
            </div>

            {property.tags && property.tags.length > 0 && (
              <div className="mb-8 flex flex-wrap gap-2">
                {property.tags.map(tag => (
                  <span key={tag} className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-400 bg-emerald-400/10 px-2 py-1 rounded-lg border border-emerald-400/20 uppercase tracking-widest">
                    <Tag size={10} />
                    {tag}
                  </span>
                ))}
              </div>
            )}

            {property.videoTourUrl && (
              <div className="mb-12">
                <h3 className="text-xl font-bold mb-4 flex items-center">
                  <Video className="mr-2 text-emerald-500" size={20} />
                  Video Tour
                </h3>
                <div className="relative aspect-video rounded-3xl overflow-hidden shadow-2xl border border-white/10 bg-black">
                  {property.videoTourUrl.startsWith('data:video/') ? (
                    <video 
                      src={property.videoTourUrl} 
                      controls 
                      className="absolute inset-0 w-full h-full object-contain"
                    />
                  ) : getEmbedUrl(property.videoTourUrl) ? (
                    <iframe 
                      src={getEmbedUrl(property.videoTourUrl) || ""} 
                      className="absolute inset-0 w-full h-full"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                      allowFullScreen
                      title="Video Tour"
                    ></iframe>
                  ) : isSafeHttpUrl(property.videoTourUrl) ? (
                    <div className="absolute inset-0 flex items-center justify-center p-6 text-center">
                      <a
                        href={property.videoTourUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 rounded-2xl bg-white px-5 py-3 font-bold text-slate-900 hover:bg-emerald-500 hover:text-white transition-all"
                      >
                        <ExternalLink size={18} />
                        Open video tour
                      </a>
                    </div>
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center p-6 text-center text-white/70">
                      Video preview unavailable.
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="mb-12">
              <h3 className="text-xl font-bold mb-4 flex items-center">
                <Info className="mr-2 text-emerald-500" size={20} />
                Description
              </h3>
              <p className="text-white/70 leading-relaxed text-lg">
                {property.description}
              </p>
            </div>

            {property.amenities && (
              <div className="mb-12">
                <h3 className="text-xl font-bold mb-4">Amenities</h3>
                <div className="flex flex-wrap gap-3">
                  {property.amenities.map(amenity => (
                    <span key={amenity} className="px-4 py-2 bg-white/5 rounded-xl border border-white/10 text-sm">
                      {amenity}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-4">
              <button 
                onClick={() => onRequestViewing(property)}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white py-4 rounded-2xl font-bold text-lg transition-all shadow-xl shadow-emerald-600/20"
              >
                Request Viewing
              </button>
              <button 
                onClick={() => onRequestInfo(property)}
                className="flex-1 bg-slate-900 hover:bg-slate-800 text-white py-4 rounded-2xl font-bold text-lg transition-all shadow-xl shadow-slate-900/20"
              >
                Request Info
              </button>
              {property.virtualTourUrl && isSafeHttpUrl(property.virtualTourUrl) && (
                <a 
                  href={property.virtualTourUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex-1 flex items-center justify-center bg-white/10 hover:bg-white/20 text-white py-4 rounded-2xl font-bold text-lg transition-all border border-white/20"
                >
                  <Eye className="mr-2" size={20} />
                  Virtual Tour
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Map View */}
        <div className="mt-20">
          <h3 className="text-2xl font-bold mb-6 flex items-center text-white">
            <MapPin className="mr-2 text-emerald-500" size={24} />
            Location Map & Directions
          </h3>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <a 
              href={getGoogleMapsSearchUrl(property.location)}
              target="_blank" 
              rel="noopener noreferrer"
              className="lg:col-span-2 h-96 bg-white/5 rounded-[3rem] border border-white/10 relative overflow-hidden group block"
            >
              <div className="absolute inset-0 bg-slate-950/80 flex flex-col items-center justify-center gap-4 p-6 text-center">
                <div className="rounded-full bg-white/10 p-4 text-emerald-300">
                  <MapPin size={32} aria-hidden="true" />
                </div>
                <div>
                  <p className="text-white text-lg font-bold">View Property Location</p>
                  <p className="text-slate-300 text-sm mt-2">Open directions in Google Maps for the most reliable route.</p>
                </div>
              </div>
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(255,255,255,0.15),_transparent_45%)] pointer-events-none" />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900/40 via-transparent to-transparent" />
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <div className="bg-white text-slate-900 px-6 py-3 rounded-2xl font-bold flex items-center gap-2 shadow-2xl">
                  <Navigation size={20} />
                  Get Directions
                </div>
              </div>
            </a>
            <div className="bg-white/5 p-8 rounded-[3rem] border border-white/10 flex flex-col justify-center">
              <h4 className="text-xl font-bold mb-4">How to get there?</h4>
              <p className="text-white/60 mb-8">
                This property is located in {property.location}. Use the button below to get real-time directions from your current location.
              </p>
              <a 
                href={getGoogleMapsSearchUrl(property.location)}
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 bg-white text-slate-900 py-4 rounded-2xl font-bold hover:bg-emerald-500 hover:text-white transition-all"
              >
                <Navigation size={20} />
                Get Directions
              </a>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

const ComparisonBar = ({ count, onExpand, onClear }: { count: number, onExpand: () => void, onClear: () => void }) => {
  if (count < 2) return null;
  return (
    <motion.div 
      initial={{ y: 100 }}
      animate={{ y: 0 }}
      className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[105] bg-slate-900 text-white px-8 py-4 rounded-3xl shadow-2xl flex items-center gap-6 border border-white/10 backdrop-blur-xl"
    >
      <div className="flex items-center gap-3">
        <div className="bg-emerald-600 w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm">
          {count}
        </div>
        <span className="font-bold">Properties Selected</span>
      </div>
      <div className="h-8 w-px bg-white/10"></div>
      <div className="flex gap-3">
        <button 
          onClick={onExpand}
          className="bg-white text-slate-900 px-6 py-2 rounded-xl font-bold hover:bg-emerald-500 hover:text-white transition-all"
        >
          Compare Now
        </button>
        <button 
          onClick={onClear}
          className="p-2 hover:bg-white/10 rounded-xl transition-all text-white/60 hover:text-white"
          title="Clear Selection"
        >
          <X size={20} />
        </button>
      </div>
    </motion.div>
  );
};

const ComparisonTool = ({ properties, onClose, onRemove }: { properties: Property[], onClose: () => void, onRemove: (id: string) => void }) => {
  if (properties.length === 0) return null;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      className="fixed inset-x-0 bottom-0 z-[110] p-4 md:p-8"
    >
      <div className="max-w-6xl mx-auto bg-white rounded-[3rem] shadow-2xl border border-slate-200 overflow-hidden">
        <div className="p-6 md:p-8 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
          <div>
            <h3 className="text-2xl font-bold text-slate-900">Property Comparison</h3>
            <p className="text-slate-500">Compare up to 4 properties side-by-side</p>
          </div>
          <button onClick={onClose} className="p-3 hover:bg-slate-200 rounded-full transition-colors">
            <X size={24} />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr>
                <th className="p-6 bg-slate-50 border-r border-slate-100 min-w-[200px]">Features</th>
                {properties.map(p => (
                  <th key={p.id} className="p-6 min-w-[280px] relative group">
                    <button 
                      onClick={() => onRemove(p.id)}
                      className="absolute top-4 right-4 p-1.5 bg-red-100 text-red-600 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X size={14} />
                    </button>
                    <img src={p.img} alt="" className="w-full h-40 object-cover rounded-2xl mb-4" referrerPolicy="no-referrer" />
                    <div className="font-bold text-slate-900">{p.title}</div>
                    <div className="text-emerald-600 font-black">Ksh {p.price.toLocaleString()}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="text-slate-600">
              <tr className="border-t border-slate-100">
                <td className="p-6 bg-slate-50 border-r border-slate-100 font-bold">Location</td>
                {properties.map(p => <td key={p.id} className="p-6">{p.location}</td>)}
              </tr>
              <tr className="border-t border-slate-100">
                <td className="p-6 bg-slate-50 border-r border-slate-100 font-bold">Type</td>
                {properties.map(p => <td key={p.id} className="p-6 capitalize">{p.category.replace('-', ' ')}</td>)}
              </tr>
              <tr className="border-t border-slate-100">
                <td className="p-6 bg-slate-50 border-r border-slate-100 font-bold">Bedrooms</td>
                {properties.map(p => <td key={p.id} className="p-6">{p.bedrooms !== undefined ? (p.bedrooms === 0 ? 'Studio' : p.bedrooms) : '-'}</td>)}
              </tr>
              <tr className="border-t border-slate-100">
                <td className="p-6 bg-slate-50 border-r border-slate-100 font-bold">Bathrooms</td>
                {properties.map(p => <td key={p.id} className="p-6">{p.bathrooms || '-'}</td>)}
              </tr>
              <tr className="border-t border-slate-100">
                <td className="p-6 bg-slate-50 border-r border-slate-100 font-bold">Size</td>
                {properties.map(p => <td key={p.id} className="p-6">{p.sqft ? `${p.sqft} sqft` : (p.plotSize || '-')}</td>)}
              </tr>
              <tr className="border-t border-slate-100">
                <td className="p-6 bg-slate-50 border-r border-slate-100 font-bold">Amenities</td>
                {properties.map(p => (
                  <td key={p.id} className="p-6">
                    <div className="flex flex-wrap gap-1">
                      {p.amenities?.slice(0, 3).map(a => (
                        <span key={a} className="text-[10px] px-2 py-0.5 bg-slate-100 rounded-full">{a}</span>
                      ))}
                      {(p.amenities?.length || 0) > 3 && <span className="text-[10px] text-slate-400">+{p.amenities!.length - 3} more</span>}
                    </div>
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </motion.div>
  );
};

const Listings = ({ 
  type, 
  properties,
  onSelect,
  onCompare,
  comparisonList,
  userLocation,
  onRequestViewing,
  onRequestInfo,
  config,
  quickFilter,
}: { 
  type: 'rent' | 'sale', 
  properties: Property[],
  onSelect: (p: Property) => void,
  onCompare: (p: Property) => void,
  comparisonList: string[],
  userLocation: { lat: number, lng: number } | null,
  onRequestViewing: (p: Property) => void,
  onRequestInfo: (p: Property) => void,
  config: SiteConfig,
  quickFilter?: { priceRange: string; unitType: RentUnitFilter; location?: string } | null,
}) => {
  const [filters, setFilters] = useState({
    priceRange: 'all',
    unitType: 'all' as RentUnitFilter,
    bedrooms: 'all',
    location: 'all',
    propertyType: 'all',
    sortBy: 'default',
    amenities: [] as string[],
    status: 'all'
  });
  const [showUnitTypes, setShowUnitTypes] = useState(true);

  const allAmenities = useMemo(() => {
    const amenities = new Set<string>();
    properties.filter(p => p.type === type).forEach(p => {
      p.amenities?.forEach(a => amenities.add(a));
    });
    return Array.from(amenities);
  }, [properties, type]);

  useEffect(() => {
    if (type !== 'rent' || !quickFilter) return;
    setFilters((prev) => ({
      ...prev,
      priceRange: quickFilter.priceRange,
      unitType: quickFilter.unitType,
      location: quickFilter.location ?? prev.location,
    }));
  }, [quickFilter, type]);

  const unitTypeStats = useMemo(() => {
    if (type !== 'rent') return [];
    return UNIT_FILTER_OPTIONS.map((option) => ({
      ...option,
      count: option.value === 'all'
        ? properties.filter((property) => property.type === type).length
        : properties.filter((property) =>
            property.type === type &&
            matchesRentUnitFilter(property, option.value)
          ).length,
    }));
  }, [properties, type]);

  const handleUnitTypeSelect = (option: typeof UNIT_FILTER_OPTIONS[number]) => {
    if (type !== 'rent') return;
    setFilters((prev) => ({
      ...prev,
      unitType: option.value,
      priceRange: 'all',
    }));
    if (option.value !== 'all') {
      setTimeout(() => {
        const listingsSection = document.getElementById('listings-container');
        listingsSection?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 0);
    }
  };

  const filteredProperties = useMemo(() => {
    let result = properties.filter(p => {
      if (p.type !== type) return false;
      
      // Price Filter
      if (filters.priceRange !== 'all') {
        const [min, max] = filters.priceRange.split('-').map(Number);
        if (max) {
          if (p.price < min || p.price > max) return false;
        } else {
          if (p.price < min) return false;
        }
      }

      if (type === 'rent' && filters.unitType !== 'all') {
        if (!matchesRentUnitFilter(p, filters.unitType)) return false;
      }

      // Bedrooms Filter (Rentals only)
      if (type === 'rent' && filters.bedrooms !== 'all') {
        if (filters.bedrooms === '3+') {
          if ((p.bedrooms || 0) < 3) return false;
        } else {
          if (p.bedrooms !== Number(filters.bedrooms)) return false;
        }
      }

      // Property Type Filter
      if (filters.propertyType !== 'all') {
        if (p.category !== filters.propertyType) return false;
      }

      // Location Filter
      if (filters.location !== 'all') {
        if (!matchesLocationFilter(p.location, filters.location)) return false;
      }

      // Amenities Filter
      if (filters.amenities.length > 0) {
        if (!filters.amenities.every(a => p.amenities?.includes(a))) return false;
      }

      // Status Filter
      if (filters.status !== 'all') {
        if (p.status !== filters.status) return false;
      }

      return true;
    });

    // Sorting
    if (filters.sortBy === 'near-me' && userLocation) {
      result = [...result].sort((a, b) => {
        const distA = getDistance(userLocation.lat, userLocation.lng, a.lat, a.lng);
        const distB = getDistance(userLocation.lat, userLocation.lng, b.lat, b.lng);
        return distA - distB;
      });
    } else if (filters.sortBy === 'price-low') {
      result = [...result].sort((a, b) => a.price - b.price);
    } else if (filters.sortBy === 'price-high') {
      result = [...result].sort((a, b) => b.price - a.price);
    }

    return result;
  }, [properties, type, filters, userLocation]);

  const locations = useMemo(() => {
    const locs = new Set(properties.filter(p => p.type === type).map(p => p.location));
    return Array.from(locs);
  }, [properties, type]);

  return (
    <section id={type === 'rent' ? "rentals" : "sales"} className={`py-24 ${type === 'sale' ? 'bg-slate-50' : 'bg-white'} relative overflow-hidden`}>
      {/* Background Image with Overlay */}
      <div className="absolute inset-0 z-0">
        <img 
          src={type === 'rent' ? config.rentalsBgImage || "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=1920&q=80" : config.salesBgImage || "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=1920&q=80"} 
          alt={`${type === 'rent' ? 'Rentals' : 'Sales'} Background`} 
          className="w-full h-full object-cover"
          referrerPolicy="no-referrer"
        />
        <div className={`absolute inset-0 ${type === 'sale' ? 'bg-slate-50/10' : 'bg-white/10'}`}></div>
        <div className="animated-bg-overlay"></div>
      </div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="mb-12 rounded-[2rem] border border-white/20 bg-white/85 backdrop-blur-xl shadow-2xl shadow-slate-200/20 px-5 py-5">
          <div className="flex flex-col xl:flex-row justify-between items-start xl:items-end gap-8">
            <div>
              <h2 className={`font-bold tracking-widest uppercase text-sm mb-4 ${type === 'rent' ? 'text-emerald-700' : 'text-red-700'}`}>
                {type === 'rent' ? 'Available for Let' : 'Properties for Sale'}
              </h2>
              <h3 className="text-4xl font-extrabold text-slate-900">
                {type === 'rent' ? 'Featured Rentals' : 'Investment Opportunities'}
              </h3>
            </div>
          
            {/* Filters */}
            <div className="flex flex-wrap gap-3">
              <div className="flex items-center bg-slate-100 rounded-xl px-3 py-2">
                <Navigation size={16} className="text-slate-500 mr-2" />
                <select 
                  className="bg-transparent text-sm font-semibold focus:outline-none"
                  value={filters.sortBy}
                  onChange={(e) => setFilters(prev => ({ ...prev, sortBy: e.target.value }))}
                >
                  <option value="default">Sort By</option>
                  <option value="near-me" disabled={!userLocation}>Near Me</option>
                  <option value="price-low">Price: Low to High</option>
                  <option value="price-high">Price: High to Low</option>
                </select>
              </div>

            <div className="flex items-center bg-slate-100 rounded-xl px-3 py-2">
              <Filter size={16} className="text-slate-500 mr-2" />
              <select 
                className="bg-transparent text-sm font-semibold focus:outline-none"
                value={filters.priceRange}
                onChange={(e) => setFilters(prev => ({ ...prev, priceRange: e.target.value }))}
              >
                <option value="all">All Prices</option>
                {type === 'rent' ? (
                  <>
                    <option value="0-10000">Below 10k</option>
                    <option value="10000-20000">10k - 20k</option>
                    <option value="20000-100000">Above 20k</option>
                  </>
                ) : (
                  <>
                    <option value="0-500000">Below 500k</option>
                    <option value="500000-2000000">500k - 2M</option>
                    <option value="2000000-10000000">Above 2M</option>
                  </>
                )}
              </select>
            </div>

            {type === 'rent' && (
              <div className="flex items-center bg-slate-100 rounded-xl px-3 py-2">
                <Layers size={16} className="text-slate-500 mr-2" />
                <select 
                  className="bg-transparent text-sm font-semibold focus:outline-none"
                  value={filters.propertyType}
                  onChange={(e) => setFilters(prev => ({ ...prev, propertyType: e.target.value }))}
                >
                  <option value="all">Property Type</option>
                  <option value="apartment">Apartment</option>
                  <option value="bedsitter">Bedsitter</option>
                  <option value="shop">Shop</option>
                  <option value="commercial">Commercial</option>
                </select>
              </div>
            )}

            {type === 'rent' && (
              <div className="flex items-center bg-slate-100 rounded-xl px-3 py-2">
                <Bed size={16} className="text-slate-500 mr-2" />
                <select 
                  className="bg-transparent text-sm font-semibold focus:outline-none"
                  value={filters.unitType}
                  onChange={(e) => setFilters(prev => ({ ...prev, unitType: e.target.value as RentUnitFilter }))}
                >
                  <option value="all">All Unit Types</option>
                  <option value="single-room">Single Room</option>
                  <option value="bedsitter">Bedsitter</option>
                  <option value="1-bedroom">1 Bedroom</option>
                  <option value="2-bedroom">2 Bedrooms</option>
                  <option value="hostel">Hostel</option>
                </select>
              </div>
            )}

            {type === 'sale' && (
              <div className="flex items-center bg-slate-100 rounded-xl px-3 py-2">
                <Layers size={16} className="text-slate-500 mr-2" />
                <select 
                  className="bg-transparent text-sm font-semibold focus:outline-none"
                  value={filters.propertyType}
                  onChange={(e) => setFilters(prev => ({ ...prev, propertyType: e.target.value }))}
                >
                  <option value="all">Property Type</option>
                  <option value="plot">Plots</option>
                  <option value="house">Houses</option>
                  <option value="commercial">Commercial</option>
                </select>
              </div>
            )}

            <div className="flex items-center bg-slate-100 rounded-xl px-3 py-2">
              <MapPin size={16} className="text-slate-500 mr-2" />
              <select 
                className="bg-transparent text-sm font-semibold focus:outline-none"
                value={filters.location}
                onChange={(e) => setFilters(prev => ({ ...prev, location: e.target.value }))}
              >
                <option value="all">All Locations</option>
                {locations.map(loc => <option key={loc} value={loc}>{loc}</option>)}
              </select>
            </div>

            <div className="flex items-center bg-slate-100 rounded-xl px-3 py-2">
              <CheckCircle2 size={16} className="text-slate-500 mr-2" />
              <select 
                className="bg-transparent text-sm font-semibold focus:outline-none"
                value={filters.status}
                onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
              >
                <option value="all">All Status</option>
                <option value="Available">Available</option>
                <option value="Under Offer">Under Offer</option>
                <option value="Sold">Sold</option>
                <option value="Rented">Rented</option>
                <option value="Unavailable">Unavailable</option>
              </select>
            </div>

            <div className="relative group">
              <div className="flex items-center bg-slate-100 rounded-xl px-3 py-2 cursor-pointer">
                <CheckCircle2 size={16} className="text-slate-500 mr-2" />
                <span className="text-sm font-semibold">Amenities {filters.amenities.length > 0 && `(${filters.amenities.length})`}</span>
              </div>
              <div className="absolute top-full right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-slate-100 p-4 z-50 min-w-[200px] opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
                <div className="space-y-2 max-h-60 overflow-y-auto pr-2 scrollbar-hide">
                  {allAmenities.map(amenity => (
                    <label key={amenity} className="flex items-center gap-3 cursor-pointer hover:bg-slate-50 p-1 rounded-lg transition-colors">
                      <input 
                        type="checkbox" 
                        className="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                        checked={filters.amenities.includes(amenity)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setFilters(prev => ({ ...prev, amenities: [...prev.amenities, amenity] }));
                          } else {
                            setFilters(prev => ({ ...prev, amenities: prev.amenities.filter(a => a !== amenity) }));
                          }
                        }}
                      />
                      <span className="text-sm text-slate-700">{amenity}</span>
                    </label>
                  ))}
                </div>
                {filters.amenities.length > 0 && (
                  <button 
                    onClick={() => setFilters(prev => ({ ...prev, amenities: [] }))}
                    className="mt-4 w-full text-xs font-bold text-red-600 hover:text-red-700 text-center"
                  >
                    Clear All
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {type === 'rent' && (
          <div className="mt-6 rounded-[2rem] border border-emerald-100 bg-white/85 backdrop-blur-xl p-4 shadow-xl shadow-emerald-950/5">
            <button
              type="button"
              onClick={() => setShowUnitTypes((prev) => !prev)}
              className="flex w-full items-center justify-between gap-4 text-left"
              aria-expanded={showUnitTypes}
              aria-controls="unit-types-panel"
            >
              <div>
                <p className="text-xs font-black uppercase tracking-[0.35em] text-emerald-700">Unit Types</p>
                <p className="text-sm text-slate-500">Jump straight to the most searched rental formats.</p>
              </div>
              <div className="flex items-center gap-3 text-sm font-bold text-slate-600">
                <span>{showUnitTypes ? 'Hide' : 'Show'}</span>
                <motion.span
                  animate={{ rotate: showUnitTypes ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-700"
                >
                  <ChevronDown size={18} />
                </motion.span>
              </div>
            </button>
            <AnimatePresence initial={false}>
              {showUnitTypes && (
                <motion.div
                  id="unit-types-panel"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.25, ease: 'easeInOut' }}
                  className="overflow-hidden"
                >
                  <div className="pt-4">
                    <div className="flex items-center justify-end gap-4 mb-4">
                      <button
                        type="button"
                        onClick={() => setFilters(prev => ({ ...prev, unitType: 'all', priceRange: 'all' }))}
                        className="text-sm font-bold text-slate-500 hover:text-emerald-700 transition-colors"
                      >
                        Reset focus
                      </button>
                    </div>

                    <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-hide">
                      {unitTypeStats.map((option, index) => {
                        const isActive = filters.unitType === option.value;
                        return (
                          <motion.button
                            key={option.value}
                            type="button"
                            initial={{ opacity: 0, y: 14 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.35, delay: index * 0.04 }}
                            whileHover={{ y: -3 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => handleUnitTypeSelect(option)}
                            className={`min-w-[160px] rounded-[1.4rem] px-5 py-4 text-left border transition-all ${
                              isActive
                                ? 'bg-emerald-700 text-white border-emerald-700 shadow-xl shadow-emerald-700/20'
                                : 'bg-slate-50 text-slate-800 border-slate-100 hover:border-emerald-200 hover:bg-emerald-50/70'
                            }`}
                          >
                            <div className="text-[10px] font-black uppercase tracking-[0.3em] opacity-70 mb-2">
                              {option.value === 'all' ? 'Browse all' : 'Rental unit'}
                            </div>
                            <div className="text-lg font-extrabold leading-tight">{option.label}</div>
                            <div className={`mt-3 flex items-center justify-between text-xs font-bold ${isActive ? 'text-white/80' : 'text-slate-500'}`}>
                              <span>{option.value === 'all' ? 'All price bands' : 'Flexible pricing'}</span>
                              <span className={`rounded-full px-2.5 py-1 ${isActive ? 'bg-white/15' : 'bg-white'}`}>
                                {option.count}
                              </span>
                            </div>
                          </motion.button>
                        );
                      })}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
        </div>
        {filteredProperties.length > 0 ? (
          <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {filteredProperties.map((item) => (
              <motion.div 
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="group cursor-pointer bg-white rounded-[2rem] overflow-hidden shadow-sm hover:shadow-xl transition-all border border-slate-100 flex flex-col"
              >
                <div className="relative overflow-hidden aspect-[4/3]" onClick={() => onSelect(item)}>
                  <img 
                    src={item.img} 
                    alt={item.title} 
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute top-4 left-4 flex flex-col gap-2">
                    <div className="bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-bold text-slate-900">
                      {item.id}
                    </div>
                    <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider shadow-sm ${
                      item.status === 'Available' ? 'bg-emerald-500 text-white' :
                      item.status === 'Under Offer' ? 'bg-amber-500 text-white' :
                      item.status === 'Sold' || item.status === 'Rented' ? 'bg-red-600 text-white' :
                      'bg-slate-500 text-white'
                    }`}>
                      {item.status}
                    </div>
                    {item.videoTourUrl && (
                      <div className="bg-emerald-600 text-white px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider shadow-sm flex items-center gap-1">
                        <Video size={10} />
                        Video Tour
                      </div>
                    )}
                  </div>
                  {userLocation && (
                    <div className="absolute top-4 right-4 bg-emerald-600/90 backdrop-blur-sm px-3 py-1 rounded-full text-[10px] font-bold text-white flex items-center">
                      <Navigation size={10} className="mr-1" />
                      {getDistance(userLocation.lat, userLocation.lng, item.lat, item.lng).toFixed(1)} km
                    </div>
                  )}
                </div>
                
                <div className="p-6 flex-1 flex flex-col">
                  <div className="flex justify-between items-start mb-1">
                    <h4 className="text-lg font-bold text-slate-900 flex-1" onClick={() => onSelect(item)}>{item.title}</h4>
                    <button 
                      onClick={(e) => { e.stopPropagation(); onCompare(item); }}
                      className={`p-2 px-3 rounded-xl transition-all flex items-center gap-2 ${comparisonList.includes(item.id) ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'}`}
                      title="Compare Property"
                    >
                      <Scale size={18} />
                      <span className="text-xs font-bold">{comparisonList.includes(item.id) ? 'Selected' : 'Compare'}</span>
                    </button>
                  </div>
                  <div className="flex items-center text-slate-500 text-sm mb-4" onClick={() => onSelect(item)}>
                    <MapPin size={14} className="mr-1" /> {item.location}
                  </div>

                  <div className="grid grid-cols-2 gap-y-2 mb-4 border-t border-slate-50 pt-4" onClick={() => onSelect(item)}>
                    {item.type === 'rent' ? (
                      <>
                        {item.bedrooms !== undefined && (
                          <div className="flex items-center text-xs text-slate-600">
                            <Bed size={14} className="mr-1 text-emerald-600" /> {item.bedrooms === 0 ? 'Studio' : `${item.bedrooms} Bed`}
                          </div>
                        )}
                        {item.bathrooms && (
                          <div className="flex items-center text-xs text-slate-600">
                            <Bath size={14} className="mr-1 text-emerald-600" /> {item.bathrooms} Bath
                          </div>
                        )}
                      </>
                    ) : (
                      <>
                        {item.plotSize && (
                          <div className="flex items-center text-xs text-slate-600">
                            <Maximize size={14} className="mr-1 text-red-600" /> {item.plotSize}
                          </div>
                        )}
                        {item.zoning && (
                          <div className="flex items-center text-xs text-slate-600">
                            <Layers size={14} className="mr-1 text-red-600" /> {item.zoning}
                          </div>
                        )}
                      </>
                    )}
                  </div>

                  <div className="flex justify-between items-center mt-auto gap-2">
                    <span className={`text-xl font-extrabold ${item.type === 'rent' ? 'text-emerald-700' : 'text-red-700'}`} onClick={() => onSelect(item)}>
                      Ksh {item.price.toLocaleString()}
                    </span>
                    <div className="flex gap-2">
                      <button 
                        onClick={(e) => { e.stopPropagation(); onRequestViewing(item); }}
                        className="px-4 py-2 rounded-xl bg-slate-900 text-white text-[10px] font-bold hover:bg-emerald-700 transition-all"
                      >
                        Viewing
                      </button>
                      <button 
                        onClick={(e) => { e.stopPropagation(); onRequestInfo(item); }}
                        className="px-4 py-2 rounded-xl bg-white border border-slate-200 text-slate-900 text-[10px] font-bold hover:bg-slate-50 transition-all"
                      >
                        Info
                      </button>
                      <button 
                        onClick={() => onSelect(item)}
                        className="p-2 rounded-full bg-slate-100 text-slate-600 hover:bg-emerald-700 hover:text-white transition-colors"
                      >
                        <ArrowRight size={18} />
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200">
            <p className="text-slate-500 font-medium">No properties match your filters.</p>
            <button 
            onClick={() => setFilters({ priceRange: 'all', unitType: 'all', bedrooms: 'all', location: 'all', propertyType: 'all', sortBy: 'default', amenities: [], status: 'all' })}
            className="mt-4 text-emerald-700 font-bold hover:underline"
          >
            Clear all filters
            </button>
          </div>
        )}
      </div>
    </section>
  );
};

const Office = ({ config }: { config: SiteConfig }) => {
  const headingStyle = { fontFamily: config.headingFontFamily, color: config.headingTextColor };
  const bodyStyle = { fontFamily: config.bodyFontFamily, color: config.bodyTextColor };
  return (
    <section id="office" className="py-24 bg-white overflow-hidden relative">
      {/* Background Image with Overlay */}
      <div className="absolute inset-0 z-0">
        <img 
          src={config.officeBgImage || "https://images.unsplash.com/photo-1497366216548-37526070297c?w=1920&q=80"} 
          alt="Office Background" 
          className="w-full h-full object-cover"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-white/10"></div>
        <div className="animated-bg-overlay"></div>
      </div>
      
      <div className="max-w-7xl mx-auto px-4 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="space-y-8"
          >
            <div className="inline-flex items-center px-4 py-2 bg-emerald-50 text-emerald-700 rounded-full text-sm font-bold uppercase tracking-wider">
              <MapPin size={16} className="mr-2" />
              Visit Our Office
            </div>
            <h2 className="text-4xl md:text-5xl font-extrabold text-slate-900 leading-tight" style={headingStyle}>
              {config.siteName} Plaza, <span className="text-emerald-600">{config.contactAddress}</span>
            </h2>
            <p className="text-black text-lg leading-relaxed" style={bodyStyle}>
              Our headquarters is located at {config.contactAddress}. We welcome you to visit us for a one-on-one consultation regarding property management, construction, or real estate investment.
            </p>
            
            <div className="space-y-4">
              <div className="flex items-start gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <div className="bg-emerald-600 p-3 rounded-xl text-white">
                  <MapPin size={24} />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900" style={headingStyle}>Address</h4>
                  <p className="text-black" style={bodyStyle}>{config.contactAddress}</p>
                </div>
              </div>
              
              <div className="flex items-start gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <div className="bg-emerald-600 p-3 rounded-xl text-white">
                  <Clock size={24} />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900" style={headingStyle}>Business Hours</h4>
                  <p className="text-black" style={bodyStyle}>{config.officeWorkingHours}</p>
                </div>
              </div>
            </div>

            <a 
              href={getGoogleMapsSearchUrl(config.contactAddress)} 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-slate-900 text-white px-8 py-4 rounded-2xl font-bold hover:bg-emerald-700 transition-all shadow-xl shadow-slate-900/20"
            >
              Get Directions
              <ExternalLink size={20} />
            </a>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="relative h-[500px] rounded-[3rem] overflow-hidden shadow-2xl border-8 border-slate-50"
          >
            <iframe 
              src={`https://www.google.com/maps?q=${encodeURIComponent(config.contactAddress)}&output=embed`} 
              width="100%" 
              height="100%" 
              style={{ border: 0 }} 
              allowFullScreen={true} 
              loading="lazy" 
              referrerPolicy="no-referrer-when-downgrade"
              title="Office Location"
            ></iframe>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

const Contact = ({ initialService, config }: { initialService?: string, config: SiteConfig }) => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    service: initialService || "",
    message: ""
  });

  useEffect(() => {
    if (initialService) {
      setFormData(prev => ({ ...prev, service: initialService }));
    }
  }, [initialService]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) newErrors.name = "Name is required";
    
    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Invalid email format";
    }
    
    if (!formData.message.trim()) newErrors.message = "Message is required";
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    if (!validate()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          service: formData.service,
          message: formData.message,
        }),
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || 'Unable to send your message.');
      }

      setIsSuccess(true);
      setFormData({ name: '', email: '', service: '', message: '' });
      setTimeout(() => setIsSuccess(false), 5000);
    } catch (err) {
      console.error(err);
      setSubmitError('Unable to send your message. Please try again later.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section id="contact" className="py-24 bg-emerald-900 text-white overflow-hidden relative">
      {/* Background Image with Overlay */}
      <div className="absolute inset-0 z-0">
        <img 
          src={config.contactBgImage || "https://images.unsplash.com/photo-1423666639041-f56000c27a9a?w=1920&q=80"} 
          alt="Contact Background" 
          className="w-full h-full object-cover"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-emerald-900/10"></div>
        <div className="animated-bg-overlay"></div>
      </div>
      
      {/* Decorative background elements */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-800 rounded-full blur-3xl -mr-48 -mt-48 opacity-30 z-[1]"></div>
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-emerald-800 rounded-full blur-3xl -ml-48 -mb-48 opacity-30 z-[1]"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div>
            <h2 className="text-red-500 font-bold tracking-widest uppercase text-sm mb-4">Get In Touch</h2>
            <h3 className="text-4xl md:text-5xl font-extrabold mb-8 leading-tight">
              Ready to find your <br />
              <span className="text-emerald-400">perfect property?</span>
            </h3>
            
            <div className="space-y-6 mb-12">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center mr-4">
                  <Phone className="text-emerald-400" size={24} />
                </div>
                <div>
                  <div className="text-slate-400 text-sm">Call Us</div>
                  <div className="text-lg font-bold">{config.contactPhone}</div>
                </div>
              </div>
              <div className="flex items-center">
                <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center mr-4">
                  <Mail className="text-emerald-400" size={24} />
                </div>
                <div>
                  <div className="text-slate-400 text-sm">Email Us</div>
                  <div className="text-lg font-bold">{config.contactEmail}</div>
                </div>
              </div>
              <div className="flex items-center">
                <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center mr-4">
                  <Clock className="text-emerald-400" size={24} />
                </div>
                <div>
                  <div className="text-slate-400 text-sm">Working Hours</div>
                  <div className="text-lg font-bold">{config.officeWorkingHours}</div>
                </div>
              </div>
            </div>

            <div className="bg-white/5 border border-white/10 p-6 rounded-2xl">
              <div className="flex items-center text-emerald-400 font-bold mb-2">
                <CheckCircle2 size={20} className="mr-2" /> Viewing Fee: {config.viewingFee}
              </div>
              <p className="text-slate-400 text-sm">
                A small viewing fee applies to ensure serious inquiries and maintain high-quality service for all clients.
              </p>
            </div>
          </div>

          <div className="bg-white rounded-3xl p-8 md:p-10 shadow-2xl">
            <h4 className="text-2xl font-bold text-slate-900 mb-6">Send a Message</h4>
            {isSuccess ? (
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-emerald-50 border border-emerald-100 p-8 rounded-2xl text-center"
              >
                <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 size={32} />
                </div>
                <h5 className="text-xl font-bold text-slate-900 mb-2">Message Sent!</h5>
                <p className="text-slate-600">Thank you for reaching out. We will get back to you shortly.</p>
              </motion.div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <input 
                      type="text" 
                      placeholder="Your Name" 
                      className={`w-full px-5 py-4 rounded-xl bg-slate-50 border ${errors.name ? 'border-red-500' : 'border-slate-200'} text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600 transition-all`}
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    />
                    {errors.name && <p className="text-red-500 text-xs mt-1 ml-1">{errors.name}</p>}
                  </div>
                  <div>
                    <input 
                      type="text" 
                      placeholder="Your Email" 
                      className={`w-full px-5 py-4 rounded-xl bg-slate-50 border ${errors.email ? 'border-red-500' : 'border-slate-200'} text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600 transition-all`}
                      value={formData.email}
                      onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    />
                    {errors.email && <p className="text-red-500 text-xs mt-1 ml-1">{errors.email}</p>}
                  </div>
                </div>
                <select 
                  className="w-full px-5 py-4 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600 transition-all appearance-none"
                  value={formData.service}
                  onChange={(e) => setFormData(prev => ({ ...prev, service: e.target.value }))}
                >
                  <option value="">Select Service</option>
                  {config.services.map(s => (
                    <option key={s.id} value={s.title}>{s.title}</option>
                  ))}
                </select>
                <div>
                  <textarea 
                    placeholder="How can we help you?" 
                    rows={4}
                    className={`w-full px-5 py-4 rounded-xl bg-slate-50 border ${errors.message ? 'border-red-500' : 'border-slate-200'} text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600 transition-all`}
                    value={formData.message}
                    onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
                  ></textarea>
                  {errors.message && <p className="text-red-500 text-xs mt-1 ml-1">{errors.message}</p>}
                </div>
                {submitError && <p className="text-red-500 text-sm">{submitError}</p>}
                <button 
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-emerald-700 text-white py-4 rounded-xl font-bold text-lg hover:bg-emerald-800 transition-all shadow-lg shadow-emerald-700/20 disabled:opacity-70 flex items-center justify-center"
                >
                  {isSubmitting ? (
                    <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : "Send Message"}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

const Footer = ({ config }: { config: SiteConfig }) => {
  return (
    <footer className="bg-slate-950 text-white pt-20 pb-10 relative overflow-hidden" style={{ color: config.footerTextColor }}>
      {/* Background Image with Overlay */}
      <div className="absolute inset-0 z-0">
        <img 
          src={config.footerBgImage || "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1920&q=80"} 
          alt="Footer Background" 
          className="w-full h-full object-cover"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-slate-950/10"></div>
        <div className="animated-bg-overlay"></div>
      </div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
          <div>
            <div className="text-3xl font-extrabold tracking-tighter mb-6">
              <span className="text-emerald-500">{config.siteName}</span>
              <span className="text-red-500 ml-1">{config.siteNameSecondary}</span>
            </div>
            <p className="text-inherit leading-relaxed mb-8">
              {config.siteDescription}
            </p>
            <div className="flex space-x-4">
              <a href={config.socialLinks.facebook} className="w-10 h-10 bg-white/5 rounded-full flex items-center justify-center hover:bg-emerald-600 transition-all">
                <Facebook size={20} />
              </a>
              <a href={config.socialLinks.instagram} className="w-10 h-10 bg-white/5 rounded-full flex items-center justify-center hover:bg-emerald-600 transition-all">
                <Instagram size={20} />
              </a>
              <a href={config.socialLinks.twitter} className="w-10 h-10 bg-white/5 rounded-full flex items-center justify-center hover:bg-emerald-600 transition-all">
                <Twitter size={20} />
              </a>
            </div>
          </div>

          <div>
            <h5 className="text-lg font-bold mb-6">Quick Links</h5>
            <ul className="space-y-4 text-inherit">
              <li><a href="#home" className="hover:text-emerald-600 transition-colors">Home</a></li>
              <li><a href="#services" className="hover:text-emerald-600 transition-colors">Our Services</a></li>
              <li><a href="#rentals" className="hover:text-emerald-600 transition-colors">Rental Listings</a></li>
              <li><a href="#sales" className="hover:text-emerald-600 transition-colors">Plots for Sale</a></li>
              <li><a href="#contact" className="hover:text-emerald-600 transition-colors">Contact Us</a></li>
            </ul>
          </div>

          <div>
            <h5 className="text-lg font-bold mb-6">Services</h5>
            <ul className="space-y-4 text-inherit">
              {config.services.map(s => (
                <li key={s.id}>{s.title}</li>
              ))}
            </ul>
          </div>

          <div>
            <h5 className="text-lg font-bold mb-6">Newsletter</h5>
            <p className="text-inherit mb-6">Subscribe to get the latest property listings and investment tips.</p>
            <div className="flex">
              <input 
                type="email" 
                placeholder="Email address" 
                className="bg-white border border-slate-200 px-4 py-3 rounded-l-xl focus:outline-none focus:ring-1 focus:ring-emerald-500 w-full text-blue-950 placeholder:text-blue-900/60"
              />
              <button className="bg-emerald-600 px-4 py-3 rounded-r-xl hover:bg-emerald-700 transition-all">
                Join
              </button>
            </div>
          </div>
        </div>

        <div className="pt-8 border-t border-slate-200 flex flex-col md:flex-row items-center justify-between gap-6 text-inherit text-sm">
          <div className="flex flex-col sm:flex-row sm:items-center sm:gap-4">
            <p>&copy; {new Date().getFullYear()} {config.siteName} {config.siteNameSecondary}. All rights reserved.</p>
            <button
              type="button"
              className="text-emerald-700 hover:text-emerald-900 text-sm underline underline-offset-4"
              onClick={() => window.dispatchEvent(new CustomEvent('open-admin-login'))}
            >
              Admin
            </button>
          </div>
          <div className="flex items-center gap-3 group">
            <span className="text-inherit">Developed by</span>
            <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-full hover:bg-slate-50 transition-all border border-slate-200">
              <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center p-1">
                <svg viewBox="0 0 100 100" className="w-full h-full">
                  <circle cx="50" cy="50" r="45" fill="none" stroke="#000" strokeWidth="2" />
                  <circle cx="50" cy="30" r="8" fill="#000" />
                  <circle cx="30" cy="65" r="8" fill="#000" />
                  <circle cx="70" cy="65" r="8" fill="#000" />
                  <path d="M50 30 L30 65 M50 30 L70 65 M30 65 L70 65" stroke="#000" strokeWidth="2" fill="none" />
                </svg>
              </div>
              <div className="flex flex-col leading-none">
                <span className="text-inherit font-black tracking-tighter text-xs">TRACE</span>
                <span className="text-[6px] text-inherit uppercase tracking-[0.2em]">Technologies</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

const AdminLoginModal = ({ onClose, onLogin, onGoogleLogin, onForgot, error }: { 
  onClose: () => void, 
  onLogin: (password: string) => void,
  onGoogleLogin: (credential: string) => void,
  onForgot: () => void, 
  error?: string 
}) => {
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    await onLogin(password);
    setIsSubmitting(false);
  };

  const handleGoogleSuccess = async (credentialResponse: any) => {
    if (credentialResponse.credential) {
      await onGoogleLogin(credentialResponse.credential);
    }
  };

  const handleGoogleError = () => {
    console.error('Google Sign-In failed');
  };

  return (
    <motion.div className="fixed inset-0 z-[210] bg-slate-900/90 backdrop-blur-md flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <motion.div className="bg-white w-full max-w-md rounded-[2rem] p-8 shadow-2xl">
        <div className="mb-6">
          <h3 className="text-2xl font-bold text-slate-900">Admin Login</h3>
          <p className="text-slate-500 mt-2">Sign in with Google or use your admin password</p>
        </div>

        {/* Google Sign-In */}
        {googleClientId && (
          <div className="mb-6">
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={handleGoogleError}
              useOneTap
              theme="outline"
              size="large"
              text="signin_with"
              shape="rectangular"
              width="100%"
            />
          </div>
        )}

        {/* Divider */}
        {googleClientId && (
          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white text-slate-500">Or continue with password</span>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="admin-password" className="block text-sm font-semibold text-slate-600 mb-2">Password</label>
            <input
              id="admin-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none"
              required
            />
          </div>
          {error && <p className="text-red-600 text-sm">{error}</p>}
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between gap-4">
              <button type="button" onClick={onClose} className="text-slate-700 hover:text-slate-900 transition-all">
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="bg-emerald-600 text-white px-6 py-3 rounded-2xl font-semibold hover:bg-emerald-700 transition-all disabled:opacity-60"
              >
                {isSubmitting ? 'Signing in...' : 'Sign In'}
              </button>
            </div>
            <button type="button" onClick={onForgot} className="text-sm text-emerald-600 hover:text-emerald-700 transition-all underline underline-offset-2">
              Forgot password?
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
};

const AdminResetModal = ({
  onClose,
  email,
  token,
  newPassword,
  onChangeEmail,
  onChangeToken,
  onChangeNewPassword,
  onRequestReset,
  onCompleteReset,
  message,
}: {
  onClose: () => void;
  email: string;
  token: string;
  newPassword: string;
  onChangeEmail: (value: string) => void;
  onChangeToken: (value: string) => void;
  onChangeNewPassword: (value: string) => void;
  onRequestReset: () => void;
  onCompleteReset: () => void;
  message: string | null;
}) => {
  return (
    <motion.div className="fixed inset-0 z-[210] bg-slate-900/90 backdrop-blur-md flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <motion.div className="bg-white w-full max-w-md rounded-[2rem] p-8 shadow-2xl">
        <div className="mb-6">
          <h3 className="text-2xl font-bold text-slate-900">Reset Admin Password</h3>
          <p className="text-slate-500 mt-2">Use your configured admin email to receive a reset code, then set a new password.</p>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-slate-600 mb-2">Admin Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => onChangeEmail(e.target.value)}
              className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none"
            />
          </div>
          <div>
            <button
              type="button"
              onClick={onRequestReset}
              className="w-full bg-emerald-600 text-white px-6 py-3 rounded-2xl font-semibold hover:bg-emerald-700 transition-all"
            >
              Send Reset Code
            </button>
          </div>
          <div className="border-t border-slate-200 pt-4">
            <div>
              <label className="block text-sm font-semibold text-slate-600 mb-2">Reset Code</label>
              <input
                type="text"
                value={token}
                onChange={(e) => onChangeToken(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-600 mb-2">New Password</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => onChangeNewPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none"
              />
            </div>
            <button
              type="button"
              onClick={onCompleteReset}
              className="mt-4 w-full bg-slate-900 text-white px-6 py-3 rounded-2xl font-semibold hover:bg-slate-800 transition-all"
            >
              Complete Reset
            </button>
          </div>
          {message && <p className="text-slate-700 text-sm mt-2">{message}</p>}
          <button type="button" onClick={onClose} className="text-slate-700 hover:text-slate-900 transition-all">
            Close
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

const AdminPanel = ({
  config,
  properties,
  selectedPropertyId,
  onSelectProperty,
  propertyDraft,
  onPropertyDraftChange,
  onSaveSettings,
  onSaveProperty,
  onUploadVideo,
  onUploadPropertyImage,
  onUploadBackgroundImage,
  onChangePassword,
  onLogout,
  onClose,
  adminError,
  onSettingsChange,
  settingsDraft,
  adminPropertySearch,
  setAdminPropertySearch,
  adminPropertyStatusFilter,
  setAdminPropertyStatusFilter,
  filteredAdminProperties,
  selectedVideoFile,
  setSelectedVideoFile,
  uploadError,
  isUploadingVideo,
  onAddProperty,
  onDeleteProperty,
}: {
  config: SiteConfig;
  properties: Property[];
  selectedPropertyId: string | null;
  onSelectProperty: (id: string) => void;
  propertyDraft: Property | null;
  onPropertyDraftChange: (updates: Partial<Property>) => void;
  onSaveSettings: () => Promise<void>;
  onSaveProperty: (property: Property) => Promise<void>;
  onUploadVideo: (propertyId: string, file: File | null) => Promise<void>;
  onUploadPropertyImage: (propertyId: string, file: File | null, slot: 'main' | 'gallery') => Promise<void>;
  onUploadBackgroundImage: (key: string, file: File | null) => Promise<void>;
  onChangePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  onLogout: () => void;
  onClose: () => void;
  adminError: string | null;
  onSettingsChange: (updates: Partial<SiteConfig>) => void;
  settingsDraft: SiteConfig;
  adminPropertySearch: string;
  setAdminPropertySearch: (value: string) => void;
  adminPropertyStatusFilter: string;
  setAdminPropertyStatusFilter: (value: string) => void;
  filteredAdminProperties: Property[];
  selectedVideoFile: File | null;
  setSelectedVideoFile: (file: File | null) => void;
  uploadError: string | null;
  isUploadingVideo: boolean;
  onAddProperty: () => void;
  onDeleteProperty: (id: string) => Promise<void>;
}) => {
  const [localSettings, setLocalSettings] = useState<SiteConfig>(settingsDraft);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showAddProperty, setShowAddProperty] = useState(false);
  const [mapLocation, setMapLocation] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [bgUploadTarget, setBgUploadTarget] = useState<'heroBgImage' | 'servicesBgImage' | 'siteLogo' | 'appIcon' | 'officeBgImage' | 'testimonialsBgImage' | 'rentalsBgImage' | 'salesBgImage' | 'contactBgImage' | 'footerBgImage'>('heroBgImage');
  const [bgUploadFile, setBgUploadFile] = useState<File | null>(null);
  const [isUploadingBgImage, setIsUploadingBgImage] = useState(false);
  const [bgUploadError, setBgUploadError] = useState<string | null>(null);
  const [bgUploadSuccess, setBgUploadSuccess] = useState<string | null>(null);
  const [mainPropertyImageFile, setMainPropertyImageFile] = useState<File | null>(null);
  const [galleryPropertyImages, setGalleryPropertyImages] = useState<File[]>([]);
  const [isUploadingPropertyImage, setIsUploadingPropertyImage] = useState(false);
  const [propertyImageUploadError, setPropertyImageUploadError] = useState<string | null>(null);

  useEffect(() => {
    setLocalSettings(settingsDraft);
  }, [settingsDraft]);

  const rentalPriceBands = localSettings.rentalPriceBands ?? [];

  const updateRentalPriceBands = (nextBands: RentalPriceBand[]) => {
    setLocalSettings({ ...localSettings, rentalPriceBands: nextBands });
    onSettingsChange({ rentalPriceBands: nextBands });
  };

  const updateRentalPriceBand = (bandId: string, updates: Partial<RentalPriceBand>) => {
    const nextBands = rentalPriceBands.map((band) => band.id === bandId ? { ...band, ...updates } : band);
    updateRentalPriceBands(nextBands);
  };

  const addRentalPriceBand = () => {
    updateRentalPriceBands([
      ...rentalPriceBands,
      createRentalPriceBand({
        unitType: 'single-room',
        location: 'all',
        label: 'New band',
        displayPrice: '',
        priceRange: '',
      }),
    ]);
  };

  const addRentalPriceBandPreset = (unitType: Exclude<RentUnitFilter, 'all'>) => {
    const existingCount = rentalPriceBands.filter((band) => band.unitType === unitType).length + 1;
    updateRentalPriceBands([
      ...rentalPriceBands,
      createRentalPriceBand({
        unitType,
        label: `${RENTAL_UNIT_LABELS[unitType]} ${existingCount}`,
        location: 'all',
        displayPrice: '',
        priceRange: '',
      }),
    ]);
  };

  const removeRentalPriceBand = (bandId: string) => {
    updateRentalPriceBands(rentalPriceBands.filter((band) => band.id !== bandId));
  };

  const uploadSelectedBackgroundImage = async () => {
    setBgUploadError(null);
    setBgUploadSuccess(null);

    if (!bgUploadFile) {
      setBgUploadError('Please select an image file before uploading.');
      return;
    }

    setIsUploadingBgImage(true);
    try {
      await onUploadBackgroundImage(bgUploadTarget, bgUploadFile);
      setBgUploadSuccess('Background image uploaded successfully.');
      setBgUploadFile(null);
    } catch (error) {
      console.error(error);
      setBgUploadError(error instanceof Error ? error.message : 'Unable to upload background image.');
    } finally {
      setIsUploadingBgImage(false);
    }
  };

  const uploadSelectedPropertyImage = async (slot: 'main' | 'gallery') => {
    if (!propertyDraft) {
      setPropertyImageUploadError('Select a property first.');
      return;
    }

    setPropertyImageUploadError(null);
    setIsUploadingPropertyImage(true);
    try {
      if (slot === 'main') {
        if (!mainPropertyImageFile) {
          setPropertyImageUploadError('Please select a main image file before uploading.');
          return;
        }
        await onUploadPropertyImage(propertyDraft.id, mainPropertyImageFile, 'main');
        setMainPropertyImageFile(null);
      } else {
        if (galleryPropertyImages.length === 0) {
          setPropertyImageUploadError('Please select one or more gallery files before uploading.');
          return;
        }
        for (const file of galleryPropertyImages) {
          await onUploadPropertyImage(propertyDraft.id, file, 'gallery');
        }
        setGalleryPropertyImages([]);
      }
    } catch (error) {
      console.error(error);
      setPropertyImageUploadError(error instanceof Error ? error.message : 'Unable to upload property image.');
    } finally {
      setIsUploadingPropertyImage(false);
    }
  };

  return (
    <motion.div className="fixed inset-0 z-[205] bg-slate-950/95 backdrop-blur-xl overflow-y-auto p-4" role="dialog" aria-modal="true">
      <motion.div className="mx-auto w-full max-w-7xl bg-gradient-to-br from-slate-50 to-slate-100 rounded-[2rem] shadow-2xl overflow-hidden">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-gradient-to-r from-emerald-700 to-emerald-900 px-8 py-6 border-b-4 border-emerald-500">
          <div>
            <h2 className="text-3xl font-bold text-white flex items-center gap-3">
              <Layout size={32} />
              Admin Panel
            </h2>
            <p className="text-emerald-100 mt-2">Manage site configuration, properties, and statistics</p>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={onLogout} className="bg-white/20 text-white px-5 py-3 rounded-xl hover:bg-white/30 transition-all font-semibold">
              Logout
            </button>
            <button onClick={onClose} className="bg-white text-emerald-700 px-5 py-3 rounded-xl hover:bg-emerald-50 transition-all font-semibold">
              Close
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-[1.2fr_0.8fr] gap-6 p-8">
          <section className="space-y-6">
            <div className="rounded-[2rem] border-2 border-emerald-200 bg-white p-8 shadow-lg">
              <h3 className="text-2xl font-bold mb-6 text-slate-900 flex items-center gap-2">
                <CheckCircle2 className="text-emerald-600" size={28} />
                Site Settings
              </h3>
                <div className="grid grid-cols-1 gap-4">
                <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5 space-y-4">
                  <div>
                    <h4 className="text-lg font-bold text-slate-900">Branding</h4>
                    <p className="text-sm text-slate-500">Upload or paste the logo and app icon used across the site and install prompt.</p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-slate-600 mb-2">Site Logo URL</label>
                      <input
                        value={localSettings.siteLogo || ''}
                        onChange={(e) => {
                          setLocalSettings({ ...localSettings, siteLogo: e.target.value });
                          onSettingsChange({ siteLogo: e.target.value });
                        }}
                        placeholder="https://example.com/logo.png"
                        className="w-full rounded-2xl border border-slate-200 px-4 py-3"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-600 mb-2">App Icon URL</label>
                      <input
                        value={localSettings.appIcon || ''}
                        onChange={(e) => {
                          setLocalSettings({ ...localSettings, appIcon: e.target.value });
                          onSettingsChange({ appIcon: e.target.value });
                        }}
                        placeholder="https://example.com/icon.svg"
                        className="w-full rounded-2xl border border-slate-200 px-4 py-3"
                      />
                    </div>
                    <div className="md:col-span-2 grid grid-cols-2 gap-4">
                      <div className="rounded-2xl border border-slate-200 bg-white p-3">
                        <p className="text-xs font-bold uppercase tracking-[0.25em] text-slate-400 mb-2">Logo Preview</p>
                        {localSettings.siteLogo ? (
                          <img src={localSettings.siteLogo} alt="Logo preview" className="h-20 w-full object-contain" referrerPolicy="no-referrer" />
                        ) : (
                          <div className="h-20 flex items-center justify-center text-sm text-slate-400">No logo set</div>
                        )}
                      </div>
                      <div className="rounded-2xl border border-slate-200 bg-white p-3">
                        <p className="text-xs font-bold uppercase tracking-[0.25em] text-slate-400 mb-2">App Icon Preview</p>
                        {localSettings.appIcon ? (
                          <img src={localSettings.appIcon} alt="App icon preview" className="h-20 w-full object-contain" referrerPolicy="no-referrer" />
                        ) : (
                          <div className="h-20 flex items-center justify-center text-sm text-slate-400">No icon set</div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-600 mb-2">Hero Title</label>
                  <input
                    value={localSettings.heroTitle}
                    onChange={(e) => {
                      setLocalSettings({ ...localSettings, heroTitle: e.target.value });
                      onSettingsChange({ heroTitle: e.target.value });
                    }}
                    className="w-full rounded-2xl border border-slate-200 px-4 py-3"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-600 mb-2">Hero Subtitle</label>
                  <textarea
                    value={localSettings.heroSubtitle}
                    onChange={(e) => {
                      setLocalSettings({ ...localSettings, heroSubtitle: e.target.value });
                      onSettingsChange({ heroSubtitle: e.target.value });
                    }}
                    className="w-full rounded-2xl border border-slate-200 px-4 py-3 h-28"
                  />
                </div>
                <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5 space-y-4">
                  <div>
                    <h4 className="text-lg font-bold text-slate-900">Typography</h4>
                    <p className="text-sm text-slate-500">Set the site-wide fonts and text colors used across the public pages.</p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-slate-600 mb-2">Body Font</label>
                      <select
                        value={localSettings.bodyFontFamily || INITIAL_CONFIG.bodyFontFamily}
                        onChange={(e) => {
                          setLocalSettings({ ...localSettings, bodyFontFamily: e.target.value });
                          onSettingsChange({ bodyFontFamily: e.target.value });
                        }}
                        className="w-full rounded-2xl border border-slate-200 px-4 py-3 bg-white"
                      >
                        {FONT_PRESETS.map((font) => (
                          <option key={font.value} value={font.value}>{font.label}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-600 mb-2">Heading Font</label>
                      <select
                        value={localSettings.headingFontFamily || INITIAL_CONFIG.headingFontFamily}
                        onChange={(e) => {
                          setLocalSettings({ ...localSettings, headingFontFamily: e.target.value });
                          onSettingsChange({ headingFontFamily: e.target.value });
                        }}
                        className="w-full rounded-2xl border border-slate-200 px-4 py-3 bg-white"
                      >
                        {FONT_PRESETS.map((font) => (
                          <option key={font.value} value={font.value}>{font.label}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-600 mb-2">Body Text Color</label>
                      <input
                        type="color"
                        value={localSettings.bodyTextColor || INITIAL_CONFIG.bodyTextColor}
                        onChange={(e) => {
                          setLocalSettings({ ...localSettings, bodyTextColor: e.target.value });
                          onSettingsChange({ bodyTextColor: e.target.value });
                        }}
                        className="h-12 w-full rounded-2xl border border-slate-200 bg-white p-2"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-600 mb-2">Heading Text Color</label>
                      <input
                        type="color"
                        value={localSettings.headingTextColor || INITIAL_CONFIG.headingTextColor}
                        onChange={(e) => {
                          setLocalSettings({ ...localSettings, headingTextColor: e.target.value });
                          onSettingsChange({ headingTextColor: e.target.value });
                        }}
                        className="h-12 w-full rounded-2xl border border-slate-200 bg-white p-2"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-semibold text-slate-600 mb-2">Footer Text Color</label>
                      <input
                        type="color"
                        value={localSettings.footerTextColor || INITIAL_CONFIG.footerTextColor}
                        onChange={(e) => {
                          setLocalSettings({ ...localSettings, footerTextColor: e.target.value });
                          onSettingsChange({ footerTextColor: e.target.value });
                        }}
                        className="h-12 w-full rounded-2xl border border-slate-200 bg-white p-2"
                      />
                    </div>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-600 mb-2">Contact Phone</label>
                  <input
                    value={localSettings.contactPhone}
                    onChange={(e) => {
                      setLocalSettings({ ...localSettings, contactPhone: e.target.value });
                      onSettingsChange({ contactPhone: e.target.value });
                    }}
                    className="w-full rounded-2xl border border-slate-200 px-4 py-3"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-600 mb-2">Contact Email</label>
                  <input
                    value={localSettings.contactEmail}
                    onChange={(e) => {
                      setLocalSettings({ ...localSettings, contactEmail: e.target.value });
                      onSettingsChange({ contactEmail: e.target.value });
                    }}
                    className="w-full rounded-2xl border border-slate-200 px-4 py-3"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-600 mb-2">Admin Reset Email</label>
                  <input
                    value={localSettings.adminEmail}
                    onChange={(e) => {
                      setLocalSettings({ ...localSettings, adminEmail: e.target.value });
                      onSettingsChange({ adminEmail: e.target.value });
                    }}
                    className="w-full rounded-2xl border border-slate-200 px-4 py-3"
                  />
                  <p className="text-xs text-slate-500 mt-2">This email will receive password reset codes for the admin account.</p>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-600 mb-2">Contact Address</label>
                  <input
                    value={localSettings.contactAddress}
                    onChange={(e) => {
                      setLocalSettings({ ...localSettings, contactAddress: e.target.value });
                      onSettingsChange({ contactAddress: e.target.value });
                    }}
                    className="w-full rounded-2xl border border-slate-200 px-4 py-3"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-600 mb-2">Hero Background Image URL</label>
                  <input
                    value={localSettings.heroBgImage}
                    onChange={(e) => {
                      setLocalSettings({ ...localSettings, heroBgImage: e.target.value });
                      onSettingsChange({ heroBgImage: e.target.value });
                    }}
                    placeholder="https://example.com/hero.jpg"
                    className="w-full rounded-2xl border border-slate-200 px-4 py-3"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-600 mb-2">Services Section Background URL</label>
                  <input
                    value={localSettings.servicesBgImage || ''}
                    onChange={(e) => {
                      setLocalSettings({ ...localSettings, servicesBgImage: e.target.value });
                      onSettingsChange({ servicesBgImage: e.target.value });
                    }}
                    placeholder="https://example.com/services.jpg"
                    className="w-full rounded-2xl border border-slate-200 px-4 py-3"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-600 mb-2">Office Section Background URL</label>
                  <input
                    value={localSettings.officeBgImage || ''}
                    onChange={(e) => {
                      setLocalSettings({ ...localSettings, officeBgImage: e.target.value });
                      onSettingsChange({ officeBgImage: e.target.value });
                    }}
                    placeholder="https://example.com/office.jpg"
                    className="w-full rounded-2xl border border-slate-200 px-4 py-3"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-600 mb-2">Testimonials Background Image URL</label>
                  <input
                    value={localSettings.testimonialsBgImage || ''}
                    onChange={(e) => {
                      setLocalSettings({ ...localSettings, testimonialsBgImage: e.target.value });
                      onSettingsChange({ testimonialsBgImage: e.target.value });
                    }}
                    placeholder="https://example.com/testimonials.jpg"
                    className="w-full rounded-2xl border border-slate-200 px-4 py-3"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-600 mb-2">Rentals Background Image URL</label>
                  <input
                    value={localSettings.rentalsBgImage || ''}
                    onChange={(e) => {
                      setLocalSettings({ ...localSettings, rentalsBgImage: e.target.value });
                      onSettingsChange({ rentalsBgImage: e.target.value });
                    }}
                    placeholder="https://example.com/rentals.jpg"
                    className="w-full rounded-2xl border border-slate-200 px-4 py-3"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-600 mb-2">Sales Background Image URL</label>
                  <input
                    value={localSettings.salesBgImage || ''}
                    onChange={(e) => {
                      setLocalSettings({ ...localSettings, salesBgImage: e.target.value });
                      onSettingsChange({ salesBgImage: e.target.value });
                    }}
                    placeholder="https://example.com/sales.jpg"
                    className="w-full rounded-2xl border border-slate-200 px-4 py-3"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-600 mb-2">Contact Section Background URL</label>
                  <input
                    value={localSettings.contactBgImage || ''}
                    onChange={(e) => {
                      setLocalSettings({ ...localSettings, contactBgImage: e.target.value });
                      onSettingsChange({ contactBgImage: e.target.value });
                    }}
                    placeholder="https://example.com/contact.jpg"
                    className="w-full rounded-2xl border border-slate-200 px-4 py-3"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-600 mb-2">Footer Background Image URL</label>
                  <input
                    value={localSettings.footerBgImage || ''}
                    onChange={(e) => {
                      setLocalSettings({ ...localSettings, footerBgImage: e.target.value });
                      onSettingsChange({ footerBgImage: e.target.value });
                    }}
                    placeholder="https://example.com/footer.jpg"
                    className="w-full rounded-2xl border border-slate-200 px-4 py-3"
                  />
                </div>
                <div className="col-span-full mt-4 p-6 rounded-3xl border border-slate-200 bg-slate-50">
                  <h4 className="text-lg font-bold mb-4">Upload Background Image</h4>
                  <div className="grid gap-4 md:grid-cols-[1.2fr_auto] items-end">
                    <div className="grid gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-slate-600 mb-2">Target Section</label>
                        <select
                          value={bgUploadTarget}
                          onChange={(e) => setBgUploadTarget(e.target.value as any)}
                          className="w-full rounded-2xl border border-slate-200 px-4 py-3"
                        >
                      <option value="heroBgImage">Hero</option>
                      <option value="servicesBgImage">Services</option>
                      <option value="siteLogo">Site Logo</option>
                      <option value="appIcon">App Icon</option>
                      <option value="officeBgImage">Office</option>
                          <option value="testimonialsBgImage">Testimonials</option>
                          <option value="rentalsBgImage">Rentals</option>
                          <option value="salesBgImage">Sales</option>
                          <option value="contactBgImage">Contact</option>
                          <option value="footerBgImage">Footer</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-slate-600 mb-2">Upload Image File</label>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => setBgUploadFile(e.target.files?.[0] ?? null)}
                          className="w-full rounded-2xl border border-slate-200 px-4 py-2 bg-white"
                        />
                      </div>
                      {bgUploadError && <p className="text-sm text-rose-500">{bgUploadError}</p>}
                      {bgUploadSuccess && <p className="text-sm text-emerald-600">{bgUploadSuccess}</p>}
                      {localSettings[bgUploadTarget] ? (
                        <div className="rounded-2xl overflow-hidden border border-slate-200">
                          <img src={localSettings[bgUploadTarget]} alt="Current background preview" className="w-full h-40 object-cover" />
                        </div>
                      ) : null}
                    </div>
                    <button
                      type="button"
                      onClick={uploadSelectedBackgroundImage}
                      disabled={isUploadingBgImage}
                      className="rounded-2xl bg-emerald-600 text-white px-6 py-4 font-semibold hover:bg-emerald-700 transition-all disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {isUploadingBgImage ? 'Uploading...' : 'Upload Background'}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-600 mb-2">Office Hours</label>
                  <input
                    value={localSettings.officeWorkingHours}
                    onChange={(e) => {
                      setLocalSettings({ ...localSettings, officeWorkingHours: e.target.value });
                      onSettingsChange({ officeWorkingHours: e.target.value });
                    }}
                    className="w-full rounded-2xl border border-slate-200 px-4 py-3"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-600 mb-2">Viewing Fee</label>
                  <input
                    value={localSettings.viewingFee}
                    onChange={(e) => {
                      setLocalSettings({ ...localSettings, viewingFee: e.target.value });
                      onSettingsChange({ viewingFee: e.target.value });
                    }}
                    className="w-full rounded-2xl border border-slate-200 px-4 py-3"
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-600 mb-2">Single Room Price Range</label>
                    <input
                      value={localSettings.singleRoomPriceRange || 'Ksh 3k - 8k'}
                      onChange={(e) => {
                        setLocalSettings({ ...localSettings, singleRoomPriceRange: e.target.value });
                        onSettingsChange({ singleRoomPriceRange: e.target.value });
                      }}
                      placeholder="Ksh 3k - 8k"
                      className="w-full rounded-2xl border border-slate-200 px-4 py-3"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-600 mb-2">Bedsitter Price Range</label>
                    <input
                      value={localSettings.bedsitterPriceRange || 'Ksh 6k - 12k'}
                      onChange={(e) => {
                        setLocalSettings({ ...localSettings, bedsitterPriceRange: e.target.value });
                        onSettingsChange({ bedsitterPriceRange: e.target.value });
                      }}
                      placeholder="Ksh 6k - 12k"
                      className="w-full rounded-2xl border border-slate-200 px-4 py-3"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-600 mb-2">1 Bedroom Price Range</label>
                    <input
                      value={localSettings.oneBedroomPriceRange || 'Ksh 10k - 20k'}
                      onChange={(e) => {
                        setLocalSettings({ ...localSettings, oneBedroomPriceRange: e.target.value });
                        onSettingsChange({ oneBedroomPriceRange: e.target.value });
                      }}
                      placeholder="Ksh 10k - 20k"
                      className="w-full rounded-2xl border border-slate-200 px-4 py-3"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-600 mb-2">2 Bedroom Price Range</label>
                    <input
                      value={localSettings.twoBedroomPriceRange || 'Ksh 18k - 35k'}
                      onChange={(e) => {
                        setLocalSettings({ ...localSettings, twoBedroomPriceRange: e.target.value });
                        onSettingsChange({ twoBedroomPriceRange: e.target.value });
                      }}
                      placeholder="Ksh 18k - 35k"
                      className="w-full rounded-2xl border border-slate-200 px-4 py-3"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-600 mb-2">Hostel Price Range</label>
                    <input
                      value={localSettings.hostelPriceRange || 'Ksh 2k - 6k'}
                      onChange={(e) => {
                        setLocalSettings({ ...localSettings, hostelPriceRange: e.target.value });
                        onSettingsChange({ hostelPriceRange: e.target.value });
                      }}
                      placeholder="Ksh 2k - 6k"
                      className="w-full rounded-2xl border border-slate-200 px-4 py-3"
                    />
                  </div>
                </div>
                <div className="mt-4 p-6 rounded-3xl border border-slate-200 bg-slate-50">
                  <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between mb-4">
                    <div>
                      <h4 className="text-lg font-bold text-slate-900">Rental Price Bands</h4>
                      <p className="text-sm text-slate-500">Add more than one band for the same unit type when prices change by location.</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {(['single-room', 'bedsitter', '1-bedroom', '2-bedroom', 'hostel'] as Array<Exclude<RentUnitFilter, 'all'>>).map((unitType) => (
                        <button
                          key={unitType}
                          type="button"
                          onClick={() => addRentalPriceBandPreset(unitType)}
                          className="rounded-full border border-emerald-200 bg-white px-4 py-2 text-xs font-bold uppercase tracking-widest text-slate-700 hover:border-emerald-400 hover:text-emerald-700 transition-all"
                        >
                          Add {RENTAL_UNIT_LABELS[unitType]}
                        </button>
                      ))}
                      <button
                        type="button"
                        onClick={addRentalPriceBand}
                        className="inline-flex items-center gap-2 rounded-2xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 transition-all"
                      >
                        <Plus size={16} />
                        Custom Band
                      </button>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {rentalPriceBands.length === 0 ? (
                      <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-4 py-5 text-sm text-slate-500">
                        No custom bands yet. Add one for each area you manage.
                      </div>
                    ) : null}
                    {rentalPriceBands.map((band, index) => (
                      <div key={band.id} className="rounded-[1.5rem] border border-slate-200 bg-white p-4 shadow-sm">
                        <div className="flex items-center justify-between gap-4 mb-4">
                          <div>
                            <p className="text-xs font-black uppercase tracking-[0.3em] text-slate-400">Band {index + 1}</p>
                            <p className="text-sm text-slate-500">This band will appear in the hero and filter rail.</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeRentalPriceBand(band.id)}
                            className="rounded-2xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-700 hover:bg-rose-100 transition-all"
                          >
                            Remove
                          </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-semibold text-slate-600 mb-2">Label</label>
                            <input
                              value={band.label}
                              onChange={(e) => updateRentalPriceBand(band.id, { label: e.target.value })}
                              placeholder="Kilimani 1 Bedrooms"
                              className="w-full rounded-2xl border border-slate-200 px-4 py-3"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-semibold text-slate-600 mb-2">Location</label>
                            <input
                              value={band.location}
                              onChange={(e) => updateRentalPriceBand(band.id, { location: e.target.value })}
                              placeholder="Kilimani / Ruaka / Ongata Rongai"
                              className="w-full rounded-2xl border border-slate-200 px-4 py-3"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-semibold text-slate-600 mb-2">Unit Type</label>
                            <select
                              value={band.unitType}
                              onChange={(e) => updateRentalPriceBand(band.id, { unitType: e.target.value as Exclude<RentUnitFilter, 'all'> })}
                              className="w-full rounded-2xl border border-slate-200 px-4 py-3 bg-white"
                            >
                              <option value="single-room">Single Room</option>
                              <option value="bedsitter">Bedsitter</option>
                              <option value="1-bedroom">1 Bedroom</option>
                              <option value="2-bedroom">2 Bedroom</option>
                              <option value="hostel">Hostel</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-sm font-semibold text-slate-600 mb-2">Price Range</label>
                            <input
                              value={band.priceRange}
                              onChange={(e) => updateRentalPriceBand(band.id, { priceRange: e.target.value })}
                              placeholder="5000-8000"
                              className="w-full rounded-2xl border border-slate-200 px-4 py-3"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-semibold text-slate-600 mb-2">Display Price</label>
                            <input
                              value={band.displayPrice}
                              onChange={(e) => updateRentalPriceBand(band.id, { displayPrice: e.target.value })}
                              placeholder="Ksh 5k - 8k"
                              className="w-full rounded-2xl border border-slate-200 px-4 py-3"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-semibold text-slate-600 mb-2">Band Accent</label>
                            <input
                              value={band.tone}
                              onChange={(e) => updateRentalPriceBand(band.id, { tone: e.target.value })}
                              placeholder="from-emerald-500/20 to-emerald-700/30"
                              className="w-full rounded-2xl border border-slate-200 px-4 py-3"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="mt-8 p-6 bg-emerald-50 rounded-2xl border-2 border-emerald-200">
                <h4 className="text-lg font-bold mb-4 text-emerald-900 flex items-center gap-2">
                  <CheckCircle2 className="text-emerald-600" size={20} />
                  Homepage Statistics
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-600 mb-2">Properties Managed</label>
                    <input
                      value={localSettings.propertiesManaged || '500+'}
                      onChange={(e) => {
                        setLocalSettings({ ...localSettings, propertiesManaged: e.target.value });
                        onSettingsChange({ propertiesManaged: e.target.value });
                      }}
                      placeholder="e.g., 500+"
                      className="w-full rounded-2xl border border-slate-200 px-4 py-3"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-600 mb-2">Happy Clients</label>
                    <input
                      value={localSettings.happyClients || '1.2k'}
                      onChange={(e) => {
                        setLocalSettings({ ...localSettings, happyClients: e.target.value });
                        onSettingsChange({ happyClients: e.target.value });
                      }}
                      placeholder="e.g., 1.2k"
                      className="w-full rounded-2xl border border-slate-200 px-4 py-3"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-600 mb-2">Years Experience</label>
                    <input
                      value={localSettings.yearsExperience || '15+'}
                      onChange={(e) => {
                        setLocalSettings({ ...localSettings, yearsExperience: e.target.value });
                        onSettingsChange({ yearsExperience: e.target.value });
                      }}
                      placeholder="e.g., 15+"
                      className="w-full rounded-2xl border border-slate-200 px-4 py-3"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-600 mb-2">Secure Transactions</label>
                    <input
                      value={localSettings.secureTransactions || '100%'}
                      onChange={(e) => {
                        setLocalSettings({ ...localSettings, secureTransactions: e.target.value });
                        onSettingsChange({ secureTransactions: e.target.value });
                      }}
                      placeholder="e.g., 100%"
                      className="w-full rounded-2xl border border-slate-200 px-4 py-3"
                    />
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={onSaveSettings}
                className="mt-6 w-full bg-emerald-600 text-white py-4 rounded-2xl font-bold text-lg hover:bg-emerald-700 transition-all shadow-lg hover:shadow-xl"
              >
                💾 Save All Settings
              </button>
              <div className="mt-6 rounded-2xl border-2 border-slate-300 bg-slate-50 p-6">
                <h4 className="text-lg font-bold mb-4">Change Admin Password</h4>
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-600 mb-2">Current Password</label>
                    <input
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      className="w-full rounded-2xl border border-slate-200 px-4 py-3"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-600 mb-2">New Password</label>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full rounded-2xl border border-slate-200 px-4 py-3"
                    />
                  </div>
                </div>
                <button
                  type="button"
                  onClick={async () => {
                    await onChangePassword(currentPassword, newPassword);
                    setCurrentPassword('');
                    setNewPassword('');
                  }}
                  className="mt-4 w-full bg-slate-900 text-white py-3 rounded-2xl font-semibold hover:bg-slate-800 transition-all"
                >
                  Change Password
                </button>
              </div>
              {adminError && <p className="text-red-600 text-sm mt-4">{adminError}</p>}
            </div>
          </section>

          <section className="rounded-[2rem] border-2 border-emerald-200 bg-white p-8 shadow-lg">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                <Building2 className="text-emerald-600" size={28} />
                Property Manager
              </h3>
              <button
                onClick={() => setShowAddProperty(true)}
                className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-xl font-bold hover:bg-emerald-700 transition-all"
              >
                <Plus size={20} />
                Add Property
              </button>
            </div>
            <div className="space-y-4">
              <div className="grid gap-3 md:grid-cols-[1fr_180px]">
                <div>
                  <label className="block text-sm font-semibold text-slate-600 mb-2 flex items-center gap-2">
                    <Search size={16} className="text-emerald-600" />
                    Search Properties
                  </label>
                  <input
                    value={adminPropertySearch}
                    onChange={(e) => setAdminPropertySearch(e.target.value)}
                    placeholder="Search by title, location, status or tags"
                    className="w-full rounded-2xl border-2 border-slate-200 px-4 py-3 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-600 mb-2 flex items-center gap-2">
                    <Filter size={16} className="text-emerald-600" />
                    Status
                  </label>
                  <select
                    value={adminPropertyStatusFilter}
                    onChange={(e) => setAdminPropertyStatusFilter(e.target.value)}
                    className="w-full rounded-2xl border-2 border-slate-200 px-4 py-3 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition-all"
                  >
                    {['All', 'Available', 'Under Offer', 'Sold', 'Rented', 'Unavailable'].map((status) => (
                      <option key={status} value={status}>{status}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="rounded-3xl border-2 border-emerald-200 bg-emerald-50 p-4">
                <p className="text-emerald-900 text-sm font-semibold mb-2 flex items-center gap-2">
                  <CheckCircle2 size={16} />
                  Filtered properties: {filteredAdminProperties.length}
                </p>
                <select
                  value={selectedPropertyId ?? ''}
                  onChange={(e) => onSelectProperty(e.target.value)}
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3"
                >
                  {filteredAdminProperties.length === 0 ? (
                    <option value="">No matching properties</option>
                  ) : (
                    filteredAdminProperties.map((property) => (
                      <option key={property.id} value={property.id}>{property.title} — {property.status}</option>
                    ))
                  )}
                </select>
              </div>

              {propertyDraft ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-lg font-bold text-slate-900">Editing: {propertyDraft.title}</h4>
                    <button
                      onClick={() => setShowDeleteConfirm(propertyDraft.id)}
                      className="flex items-center gap-2 bg-red-100 text-red-600 px-3 py-2 rounded-xl font-bold hover:bg-red-200 transition-all"
                    >
                      <Minus size={16} />
                      Delete
                    </button>
                  </div>

                  {/* Basic Info */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-slate-600 mb-2">Property ID</label>
                      <input
                        value={propertyDraft.id}
                        disabled
                        className="w-full rounded-2xl border border-slate-200 px-4 py-3 bg-slate-50"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-600 mb-2">Type</label>
                      <select
                        value={propertyDraft.type}
                        onChange={(e) => onPropertyDraftChange({ type: e.target.value as 'rent' | 'sale' })}
                        className="w-full rounded-2xl border border-slate-200 px-4 py-3"
                      >
                        <option value="rent">For Rent</option>
                        <option value="sale">For Sale</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-600 mb-2">Title</label>
                    <input
                      value={propertyDraft.title}
                      onChange={(e) => onPropertyDraftChange({ title: e.target.value })}
                      className="w-full rounded-2xl border border-slate-200 px-4 py-3"
                      placeholder="e.g., Premium 2 Bedroom Apartment"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-600 mb-2">Category</label>
                    <select
                      value={propertyDraft.category}
                      onChange={(e) => onPropertyDraftChange({ category: e.target.value })}
                      className="w-full rounded-2xl border border-slate-200 px-4 py-3"
                    >
                      {propertyDraft.type === 'rent' ? (
                        <>
                          <option value="apartment">Apartment</option>
                          <option value="bedsitter">Bedsitter</option>
                          <option value="1-bedroom">1 Bedroom</option>
                          <option value="shop">Shop</option>
                          <option value="commercial">Commercial</option>
                        </>
                      ) : (
                        <>
                          <option value="plot">Plot</option>
                          <option value="house">House</option>
                          <option value="commercial">Commercial</option>
                        </>
                      )}
                    </select>
                  </div>

                  {/* Location with Map */}
                  <div>
                    <label className="block text-sm font-semibold text-slate-600 mb-2">Location</label>
                    <input
                      value={propertyDraft.location}
                      onChange={(e) => {
                        onPropertyDraftChange({ location: e.target.value });
                        setMapLocation(e.target.value);
                      }}
                      className="w-full rounded-2xl border border-slate-200 px-4 py-3"
                      placeholder="e.g., Westlands, Nairobi"
                    />
                    <a 
                      href={getGoogleMapsSearchUrl(propertyDraft.location)} 
                      target="_blank" 
                      rel="noreferrer" 
                      className="inline-flex items-center gap-2 mt-2 text-emerald-600 hover:underline text-sm"
                    >
                      <MapPin size={14} />
                      Preview location on Google Maps
                    </a>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-slate-600 mb-2">Price (Ksh)</label>
                      <input
                        type="number"
                        value={propertyDraft.price}
                        onChange={(e) => onPropertyDraftChange({ price: Number(e.target.value) })}
                        className="w-full rounded-2xl border border-slate-200 px-4 py-3"
                        placeholder="e.g., 25000"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-600 mb-2">Status</label>
                      <select
                        value={propertyDraft.status}
                        onChange={(e) => onPropertyDraftChange({ status: e.target.value as Property['status'] })}
                        className="w-full rounded-2xl border border-slate-200 px-4 py-3"
                      >
                        <option value="Available">Available</option>
                        <option value="Under Offer">Under Offer</option>
                        <option value="Sold">Sold</option>
                        <option value="Rented">Rented</option>
                        <option value="Unavailable">Unavailable</option>
                      </select>
                    </div>
                  </div>

                  {/* Property Details */}
                  {propertyDraft.type === 'rent' && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-slate-600 mb-2">Bedrooms</label>
                        <input
                          type="number"
                          value={propertyDraft.bedrooms ?? ''}
                          onChange={(e) => onPropertyDraftChange({ bedrooms: Number(e.target.value) })}
                          className="w-full rounded-2xl border border-slate-200 px-4 py-3"
                          placeholder="0 for studio"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-slate-600 mb-2">Bathrooms</label>
                        <input
                          type="number"
                          value={propertyDraft.bathrooms ?? ''}
                          onChange={(e) => onPropertyDraftChange({ bathrooms: Number(e.target.value) })}
                          className="w-full rounded-2xl border border-slate-200 px-4 py-3"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-slate-600 mb-2">Size (sqft)</label>
                        <input
                          type="number"
                          value={propertyDraft.sqft ?? ''}
                          onChange={(e) => onPropertyDraftChange({ sqft: Number(e.target.value) })}
                          className="w-full rounded-2xl border border-slate-200 px-4 py-3"
                        />
                      </div>
                    </div>
                  )}

                  {propertyDraft.type === 'sale' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-slate-600 mb-2">Plot Size</label>
                        <input
                          value={propertyDraft.plotSize ?? ''}
                          onChange={(e) => onPropertyDraftChange({ plotSize: e.target.value })}
                          className="w-full rounded-2xl border border-slate-200 px-4 py-3"
                          placeholder="e.g., 50x100 ft"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-slate-600 mb-2">Zoning</label>
                        <input
                          value={propertyDraft.zoning ?? ''}
                          onChange={(e) => onPropertyDraftChange({ zoning: e.target.value })}
                          className="w-full rounded-2xl border border-slate-200 px-4 py-3"
                          placeholder="e.g., Residential"
                        />
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-semibold text-slate-600 mb-2">Description</label>
                    <textarea
                      value={propertyDraft.description}
                      onChange={(e) => onPropertyDraftChange({ description: e.target.value })}
                      className="w-full rounded-2xl border border-slate-200 px-4 py-3 h-32"
                      placeholder="Describe the property..."
                    />
                  </div>

                  {/* Images */}
                  <div>
                    <label className="block text-sm font-semibold text-slate-600 mb-2">Main Image URL</label>
                    <input
                      value={propertyDraft.img}
                      onChange={(e) => onPropertyDraftChange({ img: e.target.value })}
                      className="w-full rounded-2xl border border-slate-200 px-4 py-3"
                      placeholder="https://..."
                    />
                  </div>
                  <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4 space-y-4">
                    <div>
                      <h4 className="text-lg font-bold text-slate-900">Upload Main Image</h4>
                      <p className="text-sm text-slate-500">Upload a local file to replace the main property image.</p>
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => setMainPropertyImageFile(e.target.files?.[0] ?? null)}
                      className="w-full rounded-2xl border border-slate-200 px-4 py-2 bg-white"
                    />
                    <button
                      type="button"
                      onClick={() => uploadSelectedPropertyImage('main')}
                      disabled={isUploadingPropertyImage}
                      className="w-full bg-emerald-600 text-white py-3 rounded-2xl font-semibold hover:bg-emerald-700 transition-all disabled:opacity-60"
                    >
                      {isUploadingPropertyImage ? 'Uploading...' : 'Upload Main Image'}
                    </button>
                    {propertyImageUploadError && <p className="text-sm text-rose-500">{propertyImageUploadError}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-600 mb-2">Additional Images (comma-separated URLs)</label>
                    <textarea
                      value={propertyDraft.images?.join(', ') ?? ''}
                      onChange={(e) => onPropertyDraftChange({ images: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })}
                      className="w-full rounded-2xl border border-slate-200 px-4 py-3 h-20"
                      placeholder="https://image1.jpg, https://image2.jpg"
                    />
                  </div>
                  <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4 space-y-4">
                    <div>
                      <h4 className="text-lg font-bold text-slate-900">Upload Gallery Images</h4>
                      <p className="text-sm text-slate-500">Select one or more local files and upload them into the gallery.</p>
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={(e) => setGalleryPropertyImages(Array.from(e.target.files ?? []))}
                      className="w-full rounded-2xl border border-slate-200 px-4 py-2 bg-white"
                    />
                    <button
                      type="button"
                      onClick={() => uploadSelectedPropertyImage('gallery')}
                      disabled={isUploadingPropertyImage}
                      className="w-full bg-slate-900 text-white py-3 rounded-2xl font-semibold hover:bg-slate-800 transition-all disabled:opacity-60"
                    >
                      {isUploadingPropertyImage ? 'Uploading...' : 'Upload Gallery Images'}
                    </button>
                  </div>

                  {/* Amenities */}
                  <div>
                    <label className="block text-sm font-semibold text-slate-600 mb-2">Amenities (comma-separated)</label>
                    <textarea
                      value={propertyDraft.amenities?.join(', ') ?? ''}
                      onChange={(e) => onPropertyDraftChange({ amenities: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })}
                      className="w-full rounded-2xl border border-slate-200 px-4 py-3 h-20"
                      placeholder="WiFi, Parking, Security, Pool"
                    />
                  </div>

                  {/* Tags */}
                  <div>
                    <label className="block text-sm font-semibold text-slate-600 mb-2">Tags (comma-separated)</label>
                    <input
                      value={propertyDraft.tags?.join(', ') ?? ''}
                      onChange={(e) => onPropertyDraftChange({ tags: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })}
                      className="w-full rounded-2xl border border-slate-200 px-4 py-3"
                      placeholder="luxury, modern, city-view"
                    />
                  </div>

                  {/* Virtual Tour */}
                  <div>
                    <label className="block text-sm font-semibold text-slate-600 mb-2">Virtual Tour URL (optional)</label>
                    <input
                      value={propertyDraft.virtualTourUrl ?? ''}
                      onChange={(e) => onPropertyDraftChange({ virtualTourUrl: e.target.value })}
                      className="w-full rounded-2xl border border-slate-200 px-4 py-3"
                      placeholder="https://..."
                    />
                  </div>
                  <div className="space-y-4 rounded-3xl border border-slate-200 bg-slate-50 p-4">
                    <h4 className="text-lg font-bold text-slate-900">Video Tour</h4>
                    <div>
                      <label className="block text-sm font-semibold text-slate-600 mb-2">Video Tour URL</label>
                      <input
                        value={propertyDraft.videoTourUrl || ''}
                        onChange={(e) => onPropertyDraftChange({ videoTourUrl: e.target.value })}
                        placeholder="Paste YouTube, Vimeo, or direct MP4 URL"
                        className="w-full rounded-2xl border border-slate-200 px-4 py-3"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-600 mb-2">Upload Video File</label>
                      <input
                        type="file"
                        accept="video/mp4,video/webm,video/ogg"
                        onChange={(e) => setSelectedVideoFile(e.target.files?.[0] ?? null)}
                        className="w-full text-sm text-slate-600"
                      />
                      {selectedVideoFile && <p className="mt-2 text-slate-500 text-sm">Selected file: {selectedVideoFile.name}</p>}
                      {uploadError && <p className="text-red-600 text-sm mt-2">{uploadError}</p>}
                      <button
                        type="button"
                        onClick={() => onUploadVideo(propertyDraft.id, selectedVideoFile)}
                        disabled={isUploadingVideo}
                        className="mt-4 w-full bg-slate-900 text-white py-3 rounded-2xl font-semibold hover:bg-slate-800 transition-all disabled:opacity-60"
                      >
                        {isUploadingVideo ? 'Uploading...' : 'Upload Video'}
                      </button>
                    </div>
                    {propertyDraft.videoTourUrl && (
                      <div className="space-y-2">
                        <p className="text-sm text-slate-500">Current video tour preview:</p>
                        <div className="relative aspect-video rounded-3xl overflow-hidden border border-slate-200 bg-black">
                          {isVideoFileUrl(propertyDraft.videoTourUrl) ? (
                            <video controls src={propertyDraft.videoTourUrl} className="absolute inset-0 w-full h-full object-contain" />
                          ) : getEmbedUrl(propertyDraft.videoTourUrl) ? (
                            <iframe
                              src={getEmbedUrl(propertyDraft.videoTourUrl) || propertyDraft.videoTourUrl}
                              className="absolute inset-0 w-full h-full"
                              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                              allowFullScreen
                              title="Property Video Preview"
                            />
                          ) : isSafeHttpUrl(propertyDraft.videoTourUrl) ? (
                            <div className="absolute inset-0 flex items-center justify-center p-6 text-center">
                              <a
                                href={propertyDraft.videoTourUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 rounded-2xl bg-white px-5 py-3 font-bold text-slate-900 hover:bg-emerald-500 hover:text-white transition-all"
                              >
                                <ExternalLink size={18} />
                                Open video tour
                              </a>
                            </div>
                          ) : (
                            <div className="absolute inset-0 flex items-center justify-center p-6 text-center text-white/70">
                              Video preview unavailable.
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => onSaveProperty(propertyDraft)}
                    className="w-full bg-emerald-600 text-white py-3 rounded-2xl font-semibold hover:bg-emerald-700 transition-all"
                  >
                    Save Property
                  </button>
                </div>
              ) : (
                <p className="text-sm text-slate-500">Select a property to edit its details.</p>
              )}
            </div>
          </section>
        </div>

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 z-[220] bg-slate-900/90 backdrop-blur-md flex items-center justify-center p-4">
            <div className="bg-white rounded-[2rem] p-8 max-w-md w-full">
              <h3 className="text-2xl font-bold text-slate-900 mb-4">Delete Property?</h3>
              <p className="text-slate-600 mb-6">Are you sure you want to delete this property? This action cannot be undone.</p>
              <div className="flex gap-4">
                <button
                  onClick={() => setShowDeleteConfirm(null)}
                  className="flex-1 bg-slate-100 text-slate-700 px-4 py-3 rounded-xl font-bold hover:bg-slate-200 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={async () => {
                    await onDeleteProperty(showDeleteConfirm);
                    setShowDeleteConfirm(null);
                  }}
                  className="flex-1 bg-red-600 text-white px-4 py-3 rounded-xl font-bold hover:bg-red-700 transition-all"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Add Property Modal */}
        {showAddProperty && (
          <div className="fixed inset-0 z-[220] bg-slate-900/90 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-white rounded-[2rem] p-8 max-w-2xl w-full my-8">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-slate-900">Add New Property</h3>
                <button onClick={() => setShowAddProperty(false)} className="p-2 hover:bg-slate-100 rounded-full">
                  <X size={24} />
                </button>
              </div>
              <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
                <p className="text-slate-600 mb-4">Fill in the property details below. You can edit them later.</p>
                <button
                  onClick={() => {
                    onAddProperty();
                    setShowAddProperty(false);
                  }}
                  className="w-full bg-emerald-600 text-white py-4 rounded-2xl font-bold hover:bg-emerald-700 transition-all"
                >
                  Create Property
                </button>
                <p className="text-xs text-slate-500 text-center">A new property will be created with default values. You can edit all details after creation.</p>
              </div>
            </div>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
};

const Testimonials = ({ config }: { config: SiteConfig }) => {
  const headingStyle = { fontFamily: config.headingFontFamily, color: config.headingTextColor };
  const bodyStyle = { fontFamily: config.bodyFontFamily, color: config.bodyTextColor };
  const [testimonials, setTestimonials] = useState<Testimonial[]>(config.testimonials);
  const [newTestimonial, setNewTestimonial] = useState({ name: "", content: "", role: "Client" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    if (!newTestimonial.name.trim() || !newTestimonial.content.trim()) {
      setSubmitError('Please provide both a name and testimonial content.');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/testimonial', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newTestimonial),
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || 'Unable to submit testimonial.');
      }

      const testimonial: Testimonial = {
        id: `T-${Date.now()}`,
        name: newTestimonial.name,
        role: newTestimonial.role,
        content: newTestimonial.content,
        photo: `https://picsum.photos/seed/${Date.now()}/200/200`,
        rating: 5,
        date: new Date().toISOString().split('T')[0]
      };

      setTestimonials([testimonial, ...testimonials]);
      setNewTestimonial({ name: "", content: "", role: "Client" });
    } catch (err) {
      console.error(err);
      setSubmitError('Unable to submit testimonial. Please try again later.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="py-24 bg-slate-50 overflow-hidden relative">
      {/* Background Image with Overlay */}
      <div className="absolute inset-0 z-0">
        <img 
          src={config.testimonialsBgImage || "https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=1920&q=80"} 
          alt="Testimonials Background" 
          className="w-full h-full object-cover"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-slate-50/10"></div>
        <div className="animated-bg-overlay"></div>
      </div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-extrabold text-slate-900 mb-4" style={headingStyle}>Client Testimonials</h2>
          <p className="text-slate-500 max-w-2xl mx-auto" style={bodyStyle}>Hear from our satisfied clients about their experiences with {config.siteName} {config.siteNameSecondary}.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          {testimonials.map((t) => (
            <motion.div 
              key={t.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="bg-white p-8 rounded-[2.5rem] shadow-xl shadow-slate-200/50 relative"
            >
              <div className="flex items-center gap-4 mb-6">
                <img src={t.photo} alt={t.name} className="w-14 h-14 rounded-full object-cover border-2 border-emerald-100" />
                <div>
                  <h4 className="font-bold text-slate-900" style={headingStyle}>{t.name}</h4>
                  <p className="text-sm text-slate-500" style={bodyStyle}>{t.role}</p>
                </div>
              </div>
              <p className="text-slate-600 italic mb-6 leading-relaxed" style={bodyStyle}>"{t.content}"</p>
              <div className="flex text-amber-400">
                {[...Array(t.rating)].map((_, i) => (
                  <CheckCircle2 key={i} size={16} fill="currentColor" />
                ))}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Leave Testimonial Bar */}
        <div className="bg-emerald-900 rounded-[3rem] p-8 md:p-12 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-800 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl opacity-50"></div>
          <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-12">
            <div className="max-w-md">
              <h3 className="text-3xl font-bold mb-4" style={headingStyle}>Share Your Experience</h3>
              <p className="text-emerald-100/80" style={bodyStyle}>We value your feedback! Let us know how we've helped you find your perfect home or manage your property.</p>
            </div>
            <form onSubmit={handleSubmit} className="w-full lg:max-w-2xl flex flex-col sm:flex-row gap-4">
              <div className="flex-1 space-y-4">
                <input 
                  type="text" 
                  placeholder="Your Name" 
                  className="w-full bg-white/10 border border-white/20 rounded-2xl px-6 py-4 outline-none focus:bg-white/20 transition-all placeholder:text-emerald-100/50"
                  value={newTestimonial.name}
                  onChange={(e) => setNewTestimonial({ ...newTestimonial, name: e.target.value })}
                  required
                />
                <textarea 
                  placeholder="Your Testimonial" 
                  className="w-full bg-white/10 border border-white/20 rounded-2xl px-6 py-4 outline-none focus:bg-white/20 transition-all placeholder:text-emerald-100/50 h-24 resize-none"
                  value={newTestimonial.content}
                  onChange={(e) => setNewTestimonial({ ...newTestimonial, content: e.target.value })}
                  required
                />
                {submitError && <p className="text-red-200 text-sm">{submitError}</p>}
              </div>
              <button 
                type="submit" 
                disabled={isSubmitting}
                className="bg-white text-emerald-900 px-10 py-4 rounded-2xl font-bold text-lg hover:bg-emerald-50 transition-all self-center sm:self-end h-fit disabled:opacity-50"
              >
                {isSubmitting ? "Submitting..." : "Submit"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
};

export default function App() {
  const [searchQuery, setSearchQuery] = useState("");
  const [heroQuickFilter, setHeroQuickFilter] = useState<{ priceRange: string; unitType: RentUnitFilter; location?: string } | null>(null);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [comparisonList, setComparisonList] = useState<string[]>([]);
  const [userLocation, setUserLocation] = useState<{ lat: number, lng: number } | null>(null);
  const [showComparison, setShowComparison] = useState(false);
  const [selectedService, setSelectedService] = useState<string | undefined>(undefined);
  const [properties, setProperties] = useState<Property[]>(PROPERTIES);
  const [viewingRequestProperty, setViewingRequestProperty] = useState<Property | null>(null);
  const [infoRequestProperty, setInfoRequestProperty] = useState<Property | null>(null);
  const [config, setConfig] = useState<SiteConfig>(INITIAL_CONFIG);
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [adminError, setAdminError] = useState<string | null>(null);
  const [resetMode, setResetMode] = useState<'idle' | 'request' | 'complete'>('idle');
  const [resetEmail, setResetEmail] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [resetNewPassword, setResetNewPassword] = useState('');
  const [resetMessage, setResetMessage] = useState<string | null>(null);
  const [selectedAdminPropertyId, setSelectedAdminPropertyId] = useState<string | null>(PROPERTIES[0]?.id ?? null);
  const [adminPropertyDraft, setAdminPropertyDraft] = useState<Property | null>(PROPERTIES[0] ?? null);
  const [adminSettingsDraft, setAdminSettingsDraft] = useState<SiteConfig>(INITIAL_CONFIG);
  const [adminPropertySearch, setAdminPropertySearch] = useState('');
  const [adminPropertyStatusFilter, setAdminPropertyStatusFilter] = useState('All');
  const [selectedVideoFile, setSelectedVideoFile] = useState<File | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isUploadingVideo, setIsUploadingVideo] = useState(false);
  const [statsConfig, setStatsConfig] = useState({
    propertiesManaged: config.propertiesManaged || '500+',
    happyClients: config.happyClients || '1.2k',
    yearsExperience: config.yearsExperience || '15+',
    secureTransactions: config.secureTransactions || '100%'
  });

  const handleSelectService = (service: string) => {
    setSelectedService(service);
    const contactSection = document.getElementById('contact');
    if (contactSection) {
      contactSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleBookViewing = () => {
    const contactSection = document.getElementById('contact');
    if (contactSection) {
      contactSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleHeroQuickPick = (pick: HeroQuickPick) => {
    setHeroQuickFilter({ priceRange: pick.priceRange, unitType: pick.unitType, location: pick.location });
    setSearchQuery('');
    const listingsSection = document.getElementById('listings-container');
    if (listingsSection) {
      listingsSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const loadAppConfig = useCallback(async () => {
    try {
      const response = await fetch('/api/config');
      if (!response.ok) {
        throw new Error('Unable to fetch configuration');
      }
      const data = await response.json();
      if (data.config) {
        const nextConfig = { ...INITIAL_CONFIG, ...data.config };
        setConfig(nextConfig);
        setAdminSettingsDraft(nextConfig);
      }
      if (Array.isArray(data.properties) && data.properties.length > 0) {
        setProperties(data.properties);
        setSelectedAdminPropertyId((prev) => prev || data.properties[0]?.id || null);
      }
    } catch (error) {
      console.warn('Failed to load remote configuration:', error);
    }
  }, []);

  const loadAdminConfig = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/config', { credentials: 'include' });
      if (!response.ok) {
        throw new Error('Unable to fetch admin configuration');
      }
      const data = await response.json();
      if (data.config) {
        setAdminSettingsDraft({ ...INITIAL_CONFIG, ...data.config });
      }
      if (Array.isArray(data.properties) && data.properties.length > 0) {
        setProperties(data.properties);
        setSelectedAdminPropertyId((prev) => prev || data.properties[0]?.id || null);
      }
    } catch (error) {
      console.warn('Failed to load admin configuration:', error);
    }
  }, []);

  useEffect(() => {
    loadAppConfig();
  }, [loadAppConfig]);

  useEffect(() => {
    return applyInstallManifest(config);
  }, [config]);

  useEffect(() => {
    if (!selectedAdminPropertyId && properties.length > 0) {
      setSelectedAdminPropertyId(properties[0].id);
    }
  }, [properties, selectedAdminPropertyId]);

  useEffect(() => {
    const selectedProperty = properties.find((item) => item.id === selectedAdminPropertyId) ?? properties[0] ?? null;
    setAdminPropertyDraft(selectedProperty);
  }, [properties, selectedAdminPropertyId]);

  useEffect(() => {
    const handleOpenAdmin = () => setShowAdminLogin(true);
    window.addEventListener('open-admin-login', handleOpenAdmin as EventListener);
    return () => window.removeEventListener('open-admin-login', handleOpenAdmin as EventListener);
  }, []);

  const openAdminPanel = () => {
    setAdminError(null);
    setShowAdminLogin(false);
    setShowAdminPanel(true);
  };

  const closeAdminPanel = () => {
    setShowAdminPanel(false);
    setAdminError(null);
  };

  const handleAdminGoogleLogin = async (credential: string) => {
    try {
      const response = await fetch('/api/admin/google-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ credential }),
      });
      const data = await response.json();
      if (!response.ok) {
        setAdminError(data.error || 'Unable to authenticate with Google.');
        return;
      }
      setIsAdminAuthenticated(true);
      setAdminError(null);
      await loadAdminConfig();
      openAdminPanel();
    } catch (error) {
      console.error(error);
      setAdminError('Unable to authenticate with Google.');
    }
  };

  const handleAdminLogin = async (password: string) => {
    try {
      const response = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ password }),
      });
      const data = await response.json();
      if (!response.ok) {
        setAdminError(data.error || 'Unable to authenticate admin.');
        return;
      }
      setIsAdminAuthenticated(true);
      setAdminError(null);
      await loadAdminConfig();
      openAdminPanel();
    } catch (error) {
      console.error(error);
      setAdminError('Unable to authenticate admin.');
    }
  };

  const handleOpenAdminReset = () => {
    setShowAdminLogin(false);
    setResetMode('request');
    setResetMessage(null);
    setResetEmail('');
    setResetToken('');
    setResetNewPassword('');
  };

  const handleAdminLogout = async () => {
    try {
      await fetch('/api/admin/logout', {
        method: 'POST',
        credentials: 'include',
      });
    } catch (error) {
      console.warn('Logout request failed', error);
    }
    setIsAdminAuthenticated(false);
    setShowAdminPanel(false);
  };

  const handleSaveSettings = async (settings: SiteConfig) => {
    try {
      const response = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ settings }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Unable to save settings.');
      }
      const nextSettings = { ...INITIAL_CONFIG, ...data.settings };
      setConfig(nextSettings);
      setAdminSettingsDraft(nextSettings);
    } catch (error) {
      console.error(error);
      setAdminError('Unable to save settings.');
    }
  };

  const handleChangeAdminPassword = async (currentPassword: string, newPassword: string) => {
    try {
      const response = await fetch('/api/admin/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Unable to change password.');
      }
      setAdminError(null);
    } catch (error) {
      console.error(error);
      setAdminError('Unable to change password.');
    }
  };

  const handleRequestAdminReset = async (email: string) => {
    try {
      const response = await fetch('/api/admin/request-reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Unable to initiate password reset.');
      }
      setResetMode('complete');
      setResetMessage('A reset code was sent to your admin email. Enter the code and new password to continue.');
    } catch (error) {
      console.error(error);
      setResetMessage('Unable to initiate password reset.');
    }
  };

  const handleCompleteAdminReset = async (email: string, token: string, newPassword: string) => {
    try {
      const response = await fetch('/api/admin/complete-reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, token, newPassword }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Unable to complete password reset.');
      }
      setResetMode('idle');
      setResetEmail('');
      setResetToken('');
      setResetNewPassword('');
      setResetMessage('Password reset complete. You can now log in with your new password.');
    } catch (error) {
      console.error(error);
      setResetMessage('Unable to complete password reset.');
    }
  };

  const handleAddProperty = () => {
    const newId = `P${Date.now()}`;
    const newProperty: Property = {
      id: newId,
      title: 'New Property',
      price: 0,
      location: 'Location',
      img: 'https://picsum.photos/seed/' + newId + '/800/600',
      images: [],
      type: 'rent',
      category: 'apartment',
      bedrooms: 1,
      bathrooms: 1,
      sqft: 500,
      amenities: [],
      lat: -1.286389,
      lng: 36.817223,
      description: 'Property description',
      status: 'Available',
      tags: [],
    };
    setProperties([...properties, newProperty]);
    setSelectedAdminPropertyId(newId);
    setAdminPropertyDraft(newProperty);
  };

  const handleDeleteProperty = async (id: string) => {
    try {
      const response = await fetch('/api/admin/delete-property', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ id }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Unable to delete property.');
      }
      setProperties((prev) => prev.filter((item) => item.id !== id));
      if (selectedAdminPropertyId === id) {
        const remaining = properties.filter((item) => item.id !== id);
        setSelectedAdminPropertyId(remaining[0]?.id ?? null);
        setAdminPropertyDraft(remaining[0] ?? null);
      }
    } catch (error) {
      console.error(error);
      setAdminError('Unable to delete property.');
    }
  };

  const handleSaveProperty = async (property: Property) => {
    try {
      const updates = {
        title: property.title,
        location: property.location,
        price: property.price,
        description: property.description,
        status: property.status,
        virtualTourUrl: property.virtualTourUrl,
        videoTourUrl: property.videoTourUrl,
        tags: property.tags,
      };
      const response = await fetch('/api/admin/property', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ id: property.id, updates }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Unable to save property.');
      }
      setProperties((prev) => prev.map((item) => (item.id === property.id ? data.property : item)));
      setAdminPropertyDraft(data.property);
    } catch (error) {
      console.error(error);
      setAdminError('Unable to save property.');
    }
  };

  const handleUploadPropertyVideo = async (propertyId: string, file: File | null) => {
    if (!file) {
      setUploadError('Please select a video file before uploading.');
      return;
    }

    setUploadError(null);
    setIsUploadingVideo(true);
    try {
      const formData = new FormData();
      formData.append('propertyId', propertyId);
      formData.append('video', file);
      const response = await fetch('/api/admin/upload-video', {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Unable to upload video.');
      }
      setProperties((prev) => prev.map((item) => (item.id === propertyId ? data.property : item)));
      setAdminPropertyDraft(data.property);
      setSelectedVideoFile(null);
    } catch (error) {
      console.error(error);
      setUploadError('Unable to upload video file.');
    } finally {
      setIsUploadingVideo(false);
    }
  };

  const handleUploadPropertyImage = async (propertyId: string, file: File | null, slot: 'main' | 'gallery') => {
    if (!file) {
      throw new Error('Please select an image file before uploading.');
    }

    const formData = new FormData();
    formData.append('propertyId', propertyId);
    formData.append('slot', slot);
    formData.append('image', file);
    const response = await fetch('/api/admin/upload-property-image', {
      method: 'POST',
      body: formData,
      credentials: 'include',
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'Unable to upload property image.');
    }
    setProperties((prev) => prev.map((item) => (item.id === propertyId ? data.property : item)));
    setAdminPropertyDraft(data.property);
  };

  const handleUploadBackgroundImage = async (key: string, file: File | null) => {
    if (!file) {
      throw new Error('Please select an image file before uploading.');
    }

    const formData = new FormData();
    formData.append('key', key);
    formData.append('image', file);
    const response = await fetch('/api/admin/upload-image', {
      method: 'POST',
      body: formData,
      credentials: 'include',
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'Unable to upload image.');
    }
    const nextSettings = { ...INITIAL_CONFIG, ...data.settings };
    setConfig(nextSettings);
    setAdminSettingsDraft(nextSettings);
    return data;
  };

  const filteredAdminProperties = useMemo(() => {
    return properties.filter((property) => {
      const matchesSearch = matchesPropertySearch(property, adminPropertySearch);
      const matchesStatus = adminPropertyStatusFilter === 'All' || property.status === adminPropertyStatusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [properties, adminPropertySearch, adminPropertyStatusFilter]);

  const handleAdminPropertyChange = (updates: Partial<Property>) => {
    if (!adminPropertyDraft) return;
    setAdminPropertyDraft({ ...adminPropertyDraft, ...updates });
  };

  const handleAdminSettingsChange = (updates: Partial<SiteConfig>) => {
    setAdminSettingsDraft({ ...adminSettingsDraft, ...updates });
  };

  useEffect(() => {
    setAdminSettingsDraft(config);
    setStatsConfig({
      propertiesManaged: config.propertiesManaged || '500+',
      happyClients: config.happyClients || '1.2k',
      yearsExperience: config.yearsExperience || '15+',
      secureTransactions: config.secureTransactions || '100%'
    });
  }, [config]);

  const handleSaveAdminSettings = async () => {
    if (!isAdminAuthenticated) {
      setAdminError('Admin is not authenticated.');
      return;
    }
    await handleSaveSettings(adminSettingsDraft);
  };

  const selectAdminProperty = (id: string) => {
    setSelectedAdminPropertyId(id);
  };

  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => {
          console.error("Error getting location:", error);
        }
      );
    }
  }, []);

  const filteredProperties = useMemo(() => {
    return properties.filter((property) => matchesPropertySearch(property, searchQuery));
  }, [searchQuery, properties]);

  const toggleComparison = useCallback((property: Property) => {
    setComparisonList(prev => {
      if (prev.includes(property.id)) {
        return prev.filter(id => id !== property.id);
      }
      if (prev.length >= 4) return prev;
      return [...prev, property.id];
    });
  }, []);

  const comparisonProperties = useMemo(() => {
    return properties.filter(p => comparisonList.includes(p.id));
  }, [comparisonList, properties]);

  return (
    <main
      className="min-h-screen"
      style={{
        fontFamily: config.bodyFontFamily,
        color: config.bodyTextColor,
      }}
    >
      <InstallAndStartupOverlay config={config} />
      <SEOData config={config} />
      <Navbar onSearch={setSearchQuery} searchValue={searchQuery} onBookViewing={handleBookViewing} config={config} />
      <Hero onSearch={setSearchQuery} onQuickPick={handleHeroQuickPick} properties={properties} config={config} />
      <Services onSelectService={handleSelectService} config={config} />
      <Office config={config} />
      <Testimonials config={config} />
      <div id="listings-container">
        <Listings 
          type="rent" 
          properties={filteredProperties} 
          onSelect={setSelectedProperty}
          onCompare={toggleComparison}
          comparisonList={comparisonList}
          userLocation={userLocation}
          onRequestViewing={setViewingRequestProperty}
          onRequestInfo={setInfoRequestProperty}
          config={config}
          quickFilter={heroQuickFilter}
        />
        <Listings 
          type="sale" 
          properties={filteredProperties} 
          onSelect={setSelectedProperty}
          onCompare={toggleComparison}
          comparisonList={comparisonList}
          userLocation={userLocation}
          onRequestViewing={setViewingRequestProperty}
          onRequestInfo={setInfoRequestProperty}
          config={config}
        />
      </div>

      <Contact initialService={selectedService} config={config} />
      <Footer config={config} />

      <AIChatBot />

      <ComparisonBar 
        count={comparisonList.length} 
        onExpand={() => setShowComparison(true)}
        onClear={() => setComparisonList([])}
      />

      {showAdminLogin && !showAdminPanel && (
        <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID || ''}>
          <AdminLoginModal
            onClose={() => setShowAdminLogin(false)}
            onLogin={handleAdminLogin}
            onGoogleLogin={handleAdminGoogleLogin}
            onForgot={handleOpenAdminReset}
            error={adminError ?? undefined}
          />
        </GoogleOAuthProvider>
      )}

      {resetMode !== 'idle' && !showAdminPanel && (
        <AdminResetModal
          onClose={() => setResetMode('idle')}
          email={resetEmail}
          token={resetToken}
          newPassword={resetNewPassword}
          onChangeEmail={setResetEmail}
          onChangeToken={setResetToken}
          onChangeNewPassword={setResetNewPassword}
          onRequestReset={() => handleRequestAdminReset(resetEmail)}
          onCompleteReset={() => handleCompleteAdminReset(resetEmail, resetToken, resetNewPassword)}
          message={resetMessage}
        />
      )}

      {showAdminPanel && isAdminAuthenticated && (
        <AdminPanel
          config={config}
          properties={properties}
          selectedPropertyId={selectedAdminPropertyId}
          onSelectProperty={selectAdminProperty}
          propertyDraft={adminPropertyDraft}
          onPropertyDraftChange={handleAdminPropertyChange}
          onSaveSettings={handleSaveAdminSettings}
          onSaveProperty={async (property) => {
            if (property) await handleSaveProperty(property);
          }}
          onUploadVideo={handleUploadPropertyVideo}
          onUploadPropertyImage={handleUploadPropertyImage}
          onUploadBackgroundImage={handleUploadBackgroundImage}
          onChangePassword={handleChangeAdminPassword}
          onLogout={handleAdminLogout}
          onClose={closeAdminPanel}
          adminError={adminError}
          onSettingsChange={handleAdminSettingsChange}
          settingsDraft={adminSettingsDraft}
          adminPropertySearch={adminPropertySearch}
          setAdminPropertySearch={setAdminPropertySearch}
          adminPropertyStatusFilter={adminPropertyStatusFilter}
          setAdminPropertyStatusFilter={setAdminPropertyStatusFilter}
          filteredAdminProperties={filteredAdminProperties}
          selectedVideoFile={selectedVideoFile}
          setSelectedVideoFile={setSelectedVideoFile}
          uploadError={uploadError}
          isUploadingVideo={isUploadingVideo}
          onAddProperty={handleAddProperty}
          onDeleteProperty={handleDeleteProperty}
        />
      )}

      {/* Overlays */}
      <AnimatePresence>
        {selectedProperty && (
          <PropertyDetail 
            property={selectedProperty} 
            onClose={() => setSelectedProperty(null)} 
            onRequestViewing={(p) => {
              setSelectedProperty(null);
              setViewingRequestProperty(p);
            }}
            onRequestInfo={(p) => {
              setSelectedProperty(null);
              setInfoRequestProperty(p);
            }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {viewingRequestProperty && (
          <ViewingRequestModal 
            property={viewingRequestProperty} 
            onClose={() => setViewingRequestProperty(null)} 
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {infoRequestProperty && (
          <RequestInfoModal 
            property={infoRequestProperty} 
            onClose={() => setInfoRequestProperty(null)} 
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showComparison && comparisonList.length > 0 && (
          <ComparisonTool 
            properties={comparisonProperties} 
            onClose={() => setShowComparison(false)}
            onRemove={(id) => setComparisonList(prev => prev.filter(pId => pId !== id))}
          />
        )}
      </AnimatePresence>

    </main>
  );
}
