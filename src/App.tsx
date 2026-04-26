/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { motion, AnimatePresence } from "motion/react";
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
  ExternalLink,
  Eye,
  Info,
  Plus,
  Minus,
  Tag,
  Check,
  Layout,
  MessageSquare,
  Users,
  Award,
  ShieldCheck,
  TrendingUp,
  Image as ImageIcon,
  Moon,
  SunMedium
} from "lucide-react";
import React, { useState, useEffect, useMemo, useCallback } from "react";
import { AIChatBot } from "./components/AIChatBot";
import { 
  auth, 
  db, 
  loginWithGoogle, 
  logout, 
  uploadFileToStorage,
  buildStoragePath,
  handleFirestoreError, 
  OperationType 
} from "./firebase";
import { 
  onSnapshot, 
  collection, 
  doc, 
  setDoc, 
  getDoc,
  getDocFromServer,
  updateDoc, 
  deleteDoc, 
  getDocs, 
} from "firebase/firestore";
import { getIdTokenResult, onAuthStateChanged } from "firebase/auth";

// --- Types ---
const env = import.meta.env as Record<string, string | undefined>;

const readTextEnv = (key: string, fallback: string) => {
  const value = env[key]?.trim();
  return value ? value : fallback;
};

type ThemeMode = 'light' | 'dark';

const THEME_STORAGE_KEY = 'lphask-theme';

const safeGetLocalStorage = (key: string) => {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
};

const safeSetLocalStorage = (key: string, value: string) => {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // Ignore storage failures so the app still renders.
  }
};

const getInitialTheme = (): ThemeMode => {
  if (typeof window === 'undefined') return 'light';

  const savedTheme = safeGetLocalStorage(THEME_STORAGE_KEY);
  if (savedTheme === 'light' || savedTheme === 'dark') {
    return savedTheme;
  }

  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
};

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
  lat: number;
  lng: number;
  description: string;
  virtualTourUrl?: string;
  videoTourUrl?: string;
  tags?: string[];
  status: 'Available' | 'Under Offer' | 'Sold' | 'Rented' | 'Unavailable';
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
  heroTitle: string;
  heroSubtitle: string;
  heroBadge: string;
  contactPhone: string;
  contactEmail: string;
  contactAddress: string;
  brandThemeColor: string;
  socialLinks: {
    facebook: string;
    instagram: string;
    twitter: string;
  };
  siteDescription: string;
  heroBgImage: string;
  viewingFee: string;
  services: {
    id: string;
    title: string;
    desc: string;
    icon: string;
    color: string;
  }[];
  testimonials: Testimonial[];
  officeWorkingHours: string;
  stats: {
    label: string;
    value: string;
    icon: string;
  }[];
  rentalRanges: {
    id: string;
    type: string;
    region: string;
    price: string;
    minBedrooms: number;
    maxBedrooms: number;
  }[];
  sectionImages: {
    services: string;
    rentalGuide: string;
    listings: string;
    office: string;
    testimonials: string;
    contact: string;
    footer: string;
  };
}

// --- Data ---
const INITIAL_CONFIG: SiteConfig = {
  siteName: readTextEnv("VITE_SITE_NAME", "LPHASK"),
  siteNameSecondary: readTextEnv("VITE_SITE_NAME_SECONDARY", "HOMES & PROPERTIES"),
  heroTitle: readTextEnv("VITE_HERO_TITLE", "Homes, plots, and managed spaces with a sharper standard."),
  heroSubtitle: readTextEnv("VITE_HERO_SUBTITLE", "Property management, construction, media, and land services shaped around clear communication and dependable delivery."),
  heroBadge: readTextEnv("VITE_HERO_BADGE", "Property management / construction / media"),
  contactPhone: readTextEnv("VITE_CONTACT_PHONE", "+254 700 000 000"),
  contactEmail: readTextEnv("VITE_CONTACT_EMAIL", "info@lphaskhomes.com"),
  contactAddress: readTextEnv("VITE_CONTACT_ADDRESS", "Nairobi, Kenya"),
  brandThemeColor: readTextEnv("VITE_BRAND_THEME_COLOR", "#861b2a"),
  officeWorkingHours: readTextEnv("VITE_OFFICE_WORKING_HOURS", "Mon - Fri: 8:00 AM - 6:00 PM, Sat: 9:00 AM - 4:00 PM"),
  stats: [
    { label: "Properties Managed", value: "250+", icon: "Building2" },
    { label: "Happy Clients", value: "1,200+", icon: "Users" },
    { label: "Years Experience", value: "12+", icon: "Award" },
    { label: "Successful Projects", value: "45+", icon: "ShieldCheck" }
  ],
  rentalRanges: [
    { id: "range-1", type: "Studio / Bedsitter", region: "Nairobi CBD", price: "Ksh 8,000 - 12,000", minBedrooms: 0, maxBedrooms: 0 },
    { id: "range-2", type: "1 Bedroom Apartment", region: "Westlands", price: "Ksh 25,000 - 45,000", minBedrooms: 1, maxBedrooms: 1 },
    { id: "range-3", type: "2 Bedroom Apartment", region: "Kilimani", price: "Ksh 50,000 - 85,000", minBedrooms: 2, maxBedrooms: 2 },
    { id: "range-4", type: "Executive Studio", region: "Lavington", price: "Ksh 35,000 - 55,000", minBedrooms: 0, maxBedrooms: 0 },
    { id: "range-5", type: "Commercial Shop", region: "Eastlands", price: "Ksh 15,000 - 30,000", minBedrooms: 0, maxBedrooms: 0 }
  ],
  sectionImages: {
    services: "https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&q=80",
    rentalGuide: "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&q=80",
    listings: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&q=80",
    office: "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80",
    testimonials: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&q=80",
    contact: "https://images.unsplash.com/photo-1423666639041-f56000c27a9a?auto=format&fit=crop&q=80",
    footer: "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&q=80",
  },
  socialLinks: {
    facebook: readTextEnv("VITE_SOCIAL_FACEBOOK", "#"),
    instagram: readTextEnv("VITE_SOCIAL_INSTAGRAM", "#"),
    twitter: readTextEnv("VITE_SOCIAL_TWITTER", "#")
  },
  siteDescription: readTextEnv("VITE_SITE_DESCRIPTION", "Premium property management, land sales, construction, and visual media for Nairobi and surrounding markets."),
  heroBgImage: readTextEnv("VITE_HERO_BG_IMAGE", "https://images.unsplash.com/photo-1494526585095-c41746248156?auto=format&fit=crop&q=80&w=1920"),
  viewingFee: readTextEnv("VITE_VIEWING_FEE", "Ksh 300"),
  services: [
    {
      title: "Property Management",
      desc: "Comprehensive management for apartments, shops, and residential complexes.",
      icon: "Building2",
      color: "bg-emerald-50",
      id: "Property Rental"
    },
    {
      title: "Construction Contractors",
      desc: "Expert building services from foundation to finish. Quality materials guaranteed.",
      icon: "HardHat",
      color: "bg-red-50",
      id: "Construction"
    },
    {
      title: "Photography & Video",
      desc: "Professional wedding coverage, photoshoots, and event videography.",
      icon: "Camera",
      color: "bg-blue-50",
      id: "Photography/Video"
    },
    {
      title: "SGR Booking & Pickups",
      desc: "Hassle-free SGR train booking and reliable pickup/drop-off services for your convenience.",
      icon: "Train",
      color: "bg-purple-50",
      id: "SGR Booking & Pickups"
    },
    {
      title: "Plots & Shambas",
      desc: "Prime land for sale and lease. Secure titles and verified locations.",
      icon: "Home",
      color: "bg-amber-50",
      id: "Property Sale"
    }
  ],
  testimonials: [
    {
      id: "T1",
      name: "Sarah Wanjiku",
      role: "Homeowner",
      content: "LPHASK Homes made my dream of owning a home a reality. Their professionalism and attention to detail are unmatched in the Kenyan market.",
      photo: "https://picsum.photos/seed/user1/200/200",
      rating: 5,
      date: "2024-03-15"
    },
    {
      id: "T2",
      name: "John Kamau",
      role: "Real Estate Investor",
      content: "I've worked with many agencies, but LPHASK stands out for their transparency and excellent property management services. Highly recommended!",
      photo: "https://picsum.photos/seed/user2/200/200",
      rating: 5,
      date: "2024-02-20"
    },
    {
      id: "T3",
      name: "Mary Atieno",
      role: "Tenant",
      content: "Finding a rental was so easy with their search tool. The property was exactly as described, and the move-in process was seamless.",
      photo: "https://picsum.photos/seed/user3/200/200",
      rating: 4,
      date: "2024-01-10"
    }
  ]
};

// Coordinates roughly around Nairobi area for demonstration
const PROPERTIES: Property[] = [
  { 
    id: "R1",
    title: "Premium 2 Bedroom", 
    price: 25000, 
    location: "City Center", 
    img: "https://picsum.photos/seed/apt1/800/600",
    images: [
      "https://picsum.photos/seed/apt1-1/800/600",
      "https://picsum.photos/seed/apt1-2/800/600",
      "https://picsum.photos/seed/apt1-3/800/600"
    ],
    type: 'rent',
    category: 'apartment',
    bedrooms: 2,
    bathrooms: 2,
    sqft: 850,
    amenities: ["WiFi", "Parking", "Security", "Elevator", "Backup Generator"],
    leaseDuration: "12 Months",
    lat: -1.286389,
    lng: 36.817223,
    description: "Experience luxury living in the heart of the city. This premium 2-bedroom apartment offers breathtaking views, modern finishes, and top-tier security. Perfect for professionals and small families.",
    virtualTourUrl: "https://example.com/tour/r1",
    videoTourUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    status: 'Available',
    tags: ["luxury", "modern", "city-view"]
  },
  { 
    id: "R2",
    title: "Standard 1 Bedroom", 
    price: 15000, 
    location: "Suburbs", 
    img: "https://picsum.photos/seed/apt2/800/600",
    images: [
      "https://picsum.photos/seed/apt2-1/800/600",
      "https://picsum.photos/seed/apt2-2/800/600"
    ],
    type: 'rent',
    category: '1-bedroom',
    bedrooms: 1,
    bathrooms: 1,
    sqft: 500,
    amenities: ["Water", "Security", "Balcony"],
    leaseDuration: "6 Months",
    lat: -1.3032,
    lng: 36.7850,
    description: "A cozy and affordable 1-bedroom apartment located in a quiet suburban neighborhood. Features a spacious balcony and reliable water supply.",
    status: 'Available',
    tags: ["affordable", "quiet", "suburban"]
  },
  { 
    id: "R3",
    title: "Executive Bedsitter", 
    price: 7500, 
    location: "Westlands", 
    img: "https://picsum.photos/seed/apt3/800/600",
    images: [
      "https://picsum.photos/seed/apt3-1/800/600"
    ],
    type: 'rent',
    category: 'bedsitter',
    bedrooms: 0,
    bathrooms: 1,
    sqft: 250,
    amenities: ["WiFi", "CCTV", "Secure Parking"],
    leaseDuration: "Monthly",
    lat: -1.2633,
    lng: 36.8011,
    description: "Modern executive bedsitter in the vibrant Westlands area. Ideal for students or young professionals looking for a secure and connected living space.",
    status: 'Available',
    tags: ["student-friendly", "secure", "westlands"]
  },
  { 
    id: "R4",
    title: "Modern Shop Space", 
    price: 10000, 
    location: "Market Area", 
    img: "https://picsum.photos/seed/shop1/800/600",
    images: [],
    type: 'rent',
    category: 'shop',
    sqft: 400,
    amenities: ["Power", "Water", "Loading Zone"],
    leaseDuration: "24 Months",
    lat: -1.2841,
    lng: 36.8249,
    description: "Prime commercial space in a high-traffic market area. Perfect for retail or service-based businesses.",
    status: 'Available',
    tags: ["commercial", "business", "prime-location"]
  },
  { 
    id: "S1",
    title: "Prime Residential Plot", 
    price: 4000000, 
    location: "Green Valley", 
    img: "https://picsum.photos/seed/land1/800/600",
    images: [],
    type: 'sale',
    category: 'plot',
    plotSize: "50x100 ft",
    zoning: "Residential",
    lat: -1.3500,
    lng: 36.9000,
    description: "Ready to build residential plot in the prestigious Green Valley estate. Fully serviced with water and electricity on site.",
    status: 'Available',
    tags: ["residential", "investment", "ready-to-build"]
  },
  { 
    id: "S2",
    title: "Development Land", 
    price: 2000000, 
    location: "Hillside", 
    img: "https://picsum.photos/seed/land2/800/600",
    images: [],
    type: 'sale',
    category: 'plot',
    plotSize: "1/4 Acre",
    zoning: "Mixed Use",
    lat: -1.2100,
    lng: 36.7000,
    description: "Strategic 1/4 acre land perfect for commercial or residential development. Located along a major access road.",
    status: 'Under Offer',
    tags: ["development", "mixed-use", "hillside"]
  },
  { 
    id: "S3",
    title: "Suburban Shamba", 
    price: 1000000, 
    location: "Outskirts", 
    img: "https://picsum.photos/seed/land3/800/600",
    images: [],
    type: 'sale',
    category: 'plot',
    plotSize: "1/2 Acre",
    zoning: "Agricultural",
    lat: -1.4000,
    lng: 36.6000,
    description: "Fertile 1/2 acre shamba ideal for small-scale farming or a quiet country home.",
    status: 'Sold',
    tags: ["farming", "agricultural", "quiet"]
  },
  { 
    id: "S4",
    title: "Starter Plot", 
    price: 100000, 
    location: "New Estate", 
    img: "https://picsum.photos/seed/land4/800/600",
    images: [],
    type: 'sale',
    category: 'plot',
    plotSize: "40x60 ft",
    zoning: "Residential",
    lat: -1.4500,
    lng: 37.0000,
    description: "Affordable starter plot in a rapidly growing estate. Great investment opportunity for first-time buyers.",
    status: 'Available',
    tags: ["affordable", "starter", "investment"]
  },
  { 
    id: "R5",
    title: "Large Commercial Office", 
    price: 150000, 
    location: "Upper Hill", 
    img: "https://picsum.photos/seed/office1/800/600",
    images: [],
    type: 'rent',
    category: 'commercial',
    sqft: 2500,
    amenities: ["Elevator", "Security", "Parking", "Backup Generator"],
    leaseDuration: "60 Months",
    lat: -1.2988,
    lng: 36.8122,
    description: "Spacious and modern office space in the prestigious Upper Hill district. Ideal for corporate headquarters or large firms.",
    status: 'Available',
    tags: ["corporate", "office", "upper-hill"]
  },
];

// --- SEO & Structured Data ---
const SEOData = ({ config }: { config: SiteConfig }) => {
  const addressParts = config.contactAddress.split(",").map(part => part.trim()).filter(Boolean);
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "RealEstateAgent",
    "name": `${config.siteName} ${config.siteNameSecondary}`,
    "description": config.heroSubtitle,
    "url": window.location.href,
    "telephone": config.contactPhone,
    "address": {
      "@type": "PostalAddress",
      "addressLocality": addressParts[0] || config.contactAddress,
      "addressCountry": "KE"
    },
    "openingHours": config.officeWorkingHours,
    "priceRange": "$$",
    "image": config.heroBgImage,
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
    Building2, HardHat, Camera, Train, Home, Phone, Mail, Clock, MapPin, 
    Facebook, Instagram, Twitter, Video, Eye, Info, CheckCircle2,
    Users, Award, ShieldCheck, TrendingUp, Filter, Search, Navigation,
    ArrowRight, ChevronLeft, ChevronRight, ExternalLink, Plus, Minus,
    Tag, Check, Layout, MessageSquare
  };
  const Icon = icons[name] || Home;
  return <Icon className={className} size={size} />;
};

const Stats = ({ config }: { config: SiteConfig }) => {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mt-16">
      {config.stats.map((stat, idx) => (
        <motion.div 
          key={idx}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ delay: idx * 0.1 }}
          viewport={{ once: true }}
          className="bg-white/10 backdrop-blur-md border border-white/10 p-6 rounded-3xl hover:bg-white/15 transition-all group"
        >
          <div className="text-emerald-400 mb-4 group-hover:scale-110 transition-transform">
            <IconRenderer name={stat.icon} size={32} />
          </div>
          <div className="text-3xl font-black text-white mb-1">{stat.value}</div>
          <div className="text-slate-400 text-sm font-bold uppercase tracking-wider">{stat.label}</div>
        </motion.div>
      ))}
    </div>
  );
};

const Navbar = ({
  onAdminClick,
  onSearch,
  config,
  theme,
  onToggleTheme,
}: {
  onAdminClick: () => void,
  onSearch: (val: string) => void,
  config: SiteConfig,
  theme: ThemeMode,
  onToggleTheme: () => void,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const isDark = theme === 'dark';

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks = [
    { name: "Home", href: "#home" },
    { name: "Services", href: "#services" },
    { name: "Rentals", href: "#rentals" },
    { name: "Sales", href: "#sales" },
    { name: "Contact", href: "#contact" },
    { name: "Admin", href: "#admin", onClick: (e: React.MouseEvent) => { e.preventDefault(); onAdminClick(); } },
  ];

  return (
    <nav className={`fixed w-full z-50 transition-all duration-300 ${scrolled ? (isDark ? "bg-slate-950/85 backdrop-blur-md shadow-sm py-2 border-b border-white/5" : "bg-white/95 backdrop-blur-md shadow-sm py-2") : "bg-transparent py-4 sm:py-6"}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <span className="text-xl sm:text-2xl font-black tracking-tighter">
              <span className={scrolled ? (isDark ? "text-white" : "text-emerald-700") : "text-white"}>{config.siteName}</span>
              <span className="text-red-600 ml-0.5">{config.siteNameSecondary}</span>
            </span>
          </div>
          
          {/* Desktop Nav */}
          <div className="hidden md:flex items-center space-x-6 lg:space-x-8">
            {scrolled && (
              <div className="relative flex items-center bg-slate-100/50 backdrop-blur-sm rounded-full px-4 py-1.5 border border-slate-200/50">
                <Search size={14} className="text-slate-400 mr-2" />
                <input 
                  type="text" 
                  placeholder="Quick search..." 
                  className="bg-transparent text-xs text-slate-900 focus:outline-none w-24 lg:w-32 focus:w-48 transition-all"
                  onChange={(e) => onSearch(e.target.value)}
                />
              </div>
            )}
            {navLinks.map((link) => (
              <a 
                key={link.name} 
                href={link.href} 
                onClick={link.onClick}
                className={`text-xs lg:text-sm font-bold uppercase tracking-widest hover:text-emerald-500 transition-colors ${scrolled ? (isDark ? "text-slate-200" : "text-slate-600") : "text-white/90"}`}
              >
                {link.name}
              </a>
            ))}
            <button
              type="button"
              onClick={onToggleTheme}
              className={`inline-flex items-center justify-center w-10 h-10 rounded-full border transition-all active:scale-95 ${
                scrolled
                  ? isDark
                    ? "border-white/10 bg-white/5 text-white hover:bg-white/10"
                    : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                  : "border-white/20 bg-white/10 text-white backdrop-blur-md hover:bg-white/20"
              }`}
              aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
            >
              {isDark ? <SunMedium size={18} /> : <Moon size={18} />}
            </button>
            <button className="bg-emerald-600 text-white px-6 py-2 rounded-full text-xs font-black uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-600/20 active:scale-95">
              Book Viewing
            </button>
          </div>

          {/* Mobile Toggle */}
          <div className="md:hidden flex items-center">
            <button 
              onClick={() => setIsOpen(!isOpen)} 
              className={`p-2 rounded-xl transition-all ${scrolled ? (isDark ? "text-white bg-white/5" : "text-slate-900 bg-slate-100") : "text-white bg-white/10 backdrop-blur-md"}`}
            >
              {isOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, x: '100%' }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: '100%' }}
            className={`fixed inset-0 z-50 flex flex-col md:hidden ${isDark ? "bg-slate-950 text-white" : "bg-white text-slate-900"}`}
          >
            <div className={`p-4 flex justify-between items-center border-b ${isDark ? "border-white/5" : "border-slate-100"}`}>
              <span className="text-xl font-black italic tracking-tighter">
                <span className="text-emerald-700">{config.siteName}</span>
                <span className="text-red-600 ml-0.5">{config.siteNameSecondary}</span>
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onToggleTheme}
                  className={`p-2 rounded-xl transition-all ${isDark ? "bg-white/5 text-white" : "bg-slate-100 text-slate-900"}`}
                  aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
                >
                  {isDark ? <SunMedium size={20} /> : <Moon size={20} />}
                </button>
                <button 
                  onClick={() => setIsOpen(false)}
                  className={`p-2 rounded-xl ${isDark ? "bg-white/5 text-white" : "bg-slate-100 text-slate-900"}`}
                >
                  <X size={24} />
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-8">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                <input 
                  type="text" 
                  placeholder="Search properties..." 
                  className={`w-full pl-12 pr-4 py-4 rounded-2xl outline-none focus:ring-2 focus:ring-emerald-500 transition-all ${isDark ? "bg-white/5 border border-white/10 text-white placeholder:text-slate-500" : "bg-slate-50 border border-slate-100 text-slate-900"}`}
                  onChange={(e) => onSearch(e.target.value)}
                />
              </div>
              <div className="space-y-4">
                {navLinks.map((link) => (
                  <a 
                    key={link.name} 
                    href={link.href} 
                    onClick={(e) => {
                      setIsOpen(false);
                      if (link.onClick) link.onClick(e);
                    }}
                    className="flex items-center justify-between group"
                  >
                    <span className={`text-2xl font-black group-hover:text-emerald-600 transition-colors uppercase tracking-widest ${isDark ? "text-white" : "text-slate-900"}`}>{link.name}</span>
                    <ArrowRight className="text-emerald-600 opacity-0 group-hover:opacity-100 transition-all -translate-x-4 group-hover:translate-x-0" />
                  </a>
                ))}
              </div>
            </div>
            <div className={`p-6 border-t ${isDark ? "border-white/5" : "border-slate-100"}`}>
              <button className="w-full bg-emerald-600 text-white py-5 rounded-2xl font-black text-lg uppercase tracking-widest shadow-xl shadow-emerald-600/20 active:scale-95">
                Book A Viewing
              </button>
              <div className={`mt-6 flex justify-center gap-6 ${isDark ? "text-slate-500" : "text-slate-400"}`}>
                <Facebook size={24} />
                <Instagram size={24} />
                <Twitter size={24} />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

const Hero = ({ onSearch, properties, config }: { onSearch: (val: string) => void, properties: Property[], config: SiteConfig }) => {
  const [searchValue, setSearchValue] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);

  const suggestions = useMemo(() => {
    if (!searchValue.trim()) return [];
    const q = searchValue.toLowerCase();
    const matches = new Set<string>();
    
    properties.forEach(p => {
      if (p.title.toLowerCase().includes(q)) matches.add(p.title);
      if (p.location.toLowerCase().includes(q)) matches.add(p.location);
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
    <section id="home" className="relative min-h-[90vh] sm:min-h-screen pt-24 pb-16 sm:pt-32 sm:pb-24 flex items-center overflow-hidden">
      {/* Background Image with Overlay */}
      <div className="absolute inset-0 z-0 select-none pointer-events-none">
        <img 
          src={config.heroBgImage} 
          alt="Hero Background" 
          className="w-full h-full object-cover"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-b md:bg-gradient-to-r from-slate-900/95 via-slate-900/70 to-slate-900/40"></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="max-w-4xl text-center md:text-left"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="inline-flex items-center gap-2 bg-emerald-500/20 backdrop-blur-md border border-emerald-500/30 px-4 py-1.5 rounded-full mb-8 sm:mb-10"
          >
            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
            <span className="text-[10px] sm:text-xs font-black text-emerald-400 uppercase tracking-widest">{config.heroBadge}</span>
          </motion.div>

          <h1 className="text-3xl sm:text-5xl md:text-6xl font-black text-white leading-[1.2] sm:leading-tight tracking-tight mb-6 sm:mb-8">
            {config.heroTitle} <br className="hidden sm:block" />
            <span className="text-emerald-500">Dream Home.</span>
          </h1>

          <p className="text-sm sm:text-lg text-slate-300 mb-8 sm:mb-12 max-w-2xl mx-auto md:mx-0 leading-relaxed font-medium">
            {config.heroSubtitle}
          </p>
          
          <div className="relative max-w-2xl mx-auto md:mx-0 mb-10 sm:mb-12">
            <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3 bg-white/5 backdrop-blur-md p-2 rounded-2xl sm:rounded-full border border-white/10 shadow-2xl">
              <div className="relative flex-1">
                <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                <input 
                  type="text" 
                  placeholder="Area, type, or ID..." 
                  className="w-full bg-slate-900/20 sm:bg-transparent pl-14 pr-6 py-4 text-white placeholder-slate-500 outline-none font-bold text-base sm:text-lg rounded-xl sm:rounded-none"
                  value={searchValue}
                  onChange={(e) => {
                    setSearchValue(e.target.value);
                    setShowSuggestions(true);
                  }}
                  onFocus={() => setShowSuggestions(true)}
                />
              </div>
              <button type="submit" className="bg-emerald-600 text-white px-10 py-4 rounded-xl sm:rounded-full font-black text-base sm:text-lg hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-600/20 flex items-center justify-center gap-2 active:scale-95">
                <Search size={20} />
                Search
              </button>
            </form>

            <AnimatePresence>
              {showSuggestions && suggestions.length > 0 && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="absolute top-full left-0 right-0 mt-4 bg-white/95 backdrop-blur-xl rounded-3xl overflow-hidden shadow-2xl border border-slate-100 z-50 p-2"
                >
                  {suggestions.map((suggestion, idx) => (
                    <button 
                      key={idx}
                      onClick={() => handleSuggestionClick(suggestion)}
                      className="w-full px-6 py-4 text-left hover:bg-slate-50 rounded-2xl flex items-center gap-3 text-slate-700 font-bold transition-all border-b border-slate-50 last:border-0"
                    >
                      <MapPin size={16} className="text-emerald-600" />
                      {suggestion}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center md:justify-start items-center relative z-20 pt-4">
            <a 
              href="#listings-container" 
              className="w-full sm:w-auto flex items-center justify-center bg-emerald-600 text-white px-10 py-5 rounded-2xl font-black text-sm sm:text-lg uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-900/40 group active:scale-95 border-b-4 border-emerald-800"
            >
              Explore Rentals
              <ArrowRight className="ml-3 group-hover:translate-x-1 transition-all" size={24} />
            </a>
            <a 
              href="#contact" 
              className="w-full sm:w-auto flex items-center justify-center bg-white/10 backdrop-blur-md border-2 border-white/20 text-white px-10 py-5 rounded-2xl font-black text-sm sm:text-lg uppercase tracking-widest hover:bg-white/20 transition-all active:scale-95"
            >
              Contact Us
            </a>
          </div>

          {/* KPI Stats displayed on Hero */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mt-16 sm:mt-24">
            {config.stats.map((stat, idx) => (
              <motion.div 
                key={idx}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.5 + idx * 0.1 }}
                className="bg-white/5 backdrop-blur-lg border border-white/10 p-4 sm:p-5 rounded-xl sm:rounded-2xl hover:bg-white/10 transition-all group"
              >
                <div className="flex items-center gap-3 sm:gap-4 mb-2">
                  <div className="text-emerald-400 group-hover:scale-110 transition-transform">
                    <IconRenderer name={stat.icon} size={28} />
                  </div>
                  <div className="text-xl sm:text-2xl font-black text-white tracking-tighter">{stat.value}</div>
                </div>
                <div className="text-[10px] sm:text-xs font-black text-slate-400 uppercase tracking-widest">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
};

const Services = ({ onSelectService, config }: { onSelectService: (service: string) => void, config: SiteConfig }) => {
  return (
    <SectionBackground imageUrl={config.sectionImages.services} opacity={0.04} className="bg-slate-50">
      <section id="services" className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-emerald-700 font-bold tracking-widest uppercase text-sm mb-4">Our Expertise</h2>
            <h3 className="text-4xl font-extrabold text-slate-900">Comprehensive Home Solutions</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {config.services.map((service, idx) => (
              <motion.div 
                key={idx}
                whileHover={{ y: -10 }}
                className="bg-white/80 backdrop-blur-sm p-8 rounded-3xl shadow-sm border border-slate-100 hover:shadow-xl transition-all flex flex-col"
              >
                <div className={`w-16 h-16 ${service.color} rounded-2xl flex items-center justify-center mb-6`}>
                  <IconRenderer name={service.icon} className={service.color.replace('bg-', 'text-').replace('-50', '-600')} size={32} />
                </div>
                <h4 className="text-xl font-bold text-slate-900 mb-4">{service.title}</h4>
                <p className="text-slate-600 leading-relaxed mb-6 flex-1">{service.desc}</p>
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
    </SectionBackground>
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSuccess(true);
      setTimeout(onClose, 2000);
    }, 1500);
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[200] bg-slate-900/90 backdrop-blur-md flex items-center justify-center p-4"
    >
      <motion.div 
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        className="bg-white w-full max-w-lg rounded-[3rem] overflow-hidden shadow-2xl relative p-8 md:p-12"
      >
        <button onClick={onClose} className="absolute top-8 right-8 p-2 hover:bg-slate-100 rounded-full transition-colors">
          <X size={24} />
        </button>

        {isSuccess ? (
          <div className="text-center py-12">
            <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 size={40} />
            </div>
            <h3 className="text-3xl font-extrabold text-slate-900 mb-2">Inquiry Sent!</h3>
            <p className="text-slate-500">We'll get back to you with more information about <span className="font-bold">{property.title}</span> shortly.</p>
          </div>
        ) : (
          <>
            <div className="mb-8">
              <h3 className="text-3xl font-extrabold text-slate-900 mb-2">Request Info</h3>
              <p className="text-slate-500">Inquire about <span className="font-bold text-emerald-600">{property.title}</span></p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Full Name</label>
                <input 
                  type="text" 
                  required
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Email Address</label>
                  <input 
                    type="email" 
                    required
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Phone Number</label>
                  <input 
                    type="tel" 
                    required
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Your Question</label>
                <textarea 
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none transition-all h-32 resize-none"
                  placeholder="What would you like to know?"
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  required
                />
              </div>
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    // Simulate API call
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSuccess(true);
      setTimeout(onClose, 2000);
    }, 1500);
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[200] bg-slate-900/90 backdrop-blur-md flex items-center justify-center p-4"
    >
      <motion.div 
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        className="bg-white w-full max-w-lg rounded-[3rem] overflow-hidden shadow-2xl relative p-8 md:p-12"
      >
        <button onClick={onClose} className="absolute top-8 right-8 p-2 hover:bg-slate-100 rounded-full transition-colors">
          <X size={24} />
        </button>

        {isSuccess ? (
          <div className="text-center py-12">
            <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 size={40} />
            </div>
            <h3 className="text-3xl font-extrabold text-slate-900 mb-2">Request Sent!</h3>
            <p className="text-slate-500">We'll contact you shortly to confirm your viewing.</p>
          </div>
        ) : (
          <>
            <div className="mb-8">
              <h3 className="text-3xl font-extrabold text-slate-900 mb-2">Request Viewing</h3>
              <p className="text-slate-500">Schedule a visit for <span className="font-bold text-emerald-600">{property.title}</span></p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Full Name</label>
                  <input 
                    type="text" 
                    required
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Phone Number</label>
                  <input 
                    type="tel" 
                    required
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Email Address</label>
                <input 
                  type="email" 
                  required
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Preferred Date</label>
                  <input 
                    type="date" 
                    required
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Preferred Time</label>
                  <input 
                    type="time" 
                    required
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                    value={formData.time}
                    onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Additional Message</label>
                <textarea 
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none transition-all h-24 resize-none"
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                />
              </div>
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

const getEmbedUrl = (url: string) => {
  if (!url) return null;
  if (url.startsWith('data:video/')) return null;
  
  // YouTube
  const ytMatch = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/);
  if (ytMatch) return `https://www.youtube.com/embed/${ytMatch[1]}`;
  
  // Vimeo
  const vimeoMatch = url.match(/(?:vimeo\.com\/|player\.vimeo\.com\/video\/)(\d+)/);
  if (vimeoMatch) return `https://player.vimeo.com/video/${vimeoMatch[1]}`;

  return url;
};

const VideoPlayer = ({ url, className }: { url: string, className?: string }) => {
  const embedUrl = getEmbedUrl(url);
  const isDirectFile = url.startsWith('data:video/') || url.match(/\.(mp4|webm|ogg|mov)$|^blob:/i);

  if (embedUrl && !isDirectFile) {
    return (
      <iframe 
        src={embedUrl}
        className={className || "absolute inset-0 w-full h-full"}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
        allowFullScreen
        title="Video Tour"
      ></iframe>
    );
  }

  return (
    <video 
      src={url} 
      controls 
      playsInline
      preload="metadata"
      className={className || "absolute inset-0 w-full h-full object-contain"}
    />
  );
};

const SectionBackground = ({ imageUrl, children, opacity = 0.05, className = "" }: { imageUrl: string, children: React.ReactNode, opacity?: number, className?: string }) => {
  return (
    <div className={`relative overflow-hidden w-full ${className}`}>
      <div 
        className="absolute inset-0 z-0 pointer-events-none select-none"
        style={{ 
          backgroundImage: `url(${imageUrl})`, 
          backgroundSize: 'cover', 
          backgroundPosition: 'center', 
          opacity: opacity 
        }}
      />
      <div className="relative z-10 w-full h-full">
        {children}
      </div>
    </div>
  );
};

const PropertyDetail = ({ property, onClose, onRequestViewing, onRequestInfo }: { 
  property: Property, 
  onClose: () => void, 
  onRequestViewing: (p: Property) => void,
  onRequestInfo: (p: Property) => void
}) => {
  const [activeImg, setActiveImg] = useState(0);
  const allImages = useMemo(() => {
    const images = [];
    if (property.img) images.push(property.img);
    if (property.images && Array.isArray(property.images)) {
      property.images.forEach(img => {
        if (img && img !== property.img) images.push(img);
      });
    }
    if (images.length === 0) images.push("https://picsum.photos/seed/property/1920/1080");
    return images;
  }, [property]);

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
                  <VideoPlayer url={property.videoTourUrl} />
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
              {property.virtualTourUrl && (
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
              href={`https://www.google.com/maps/dir/?api=1&destination=${property.lat},${property.lng}`}
              target="_blank" 
              rel="noopener noreferrer"
              className="lg:col-span-2 h-96 bg-white/5 rounded-[3rem] border border-white/10 relative overflow-hidden group block"
            >
              <iframe 
                src={`https://www.google.com/maps/embed/v1/place?key=${import.meta.env.VITE_GOOGLE_MAPS_API_KEY || ''}&q=${property.lat},${property.lng}&zoom=15`}
                width="100%" 
                height="100%" 
                style={{ border: 0 }} 
                allowFullScreen={true} 
                loading="lazy" 
                referrerPolicy="no-referrer-when-downgrade"
                title="Property Location"
                className="opacity-80 group-hover:opacity-100 transition-opacity pointer-events-none"
              ></iframe>
              <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
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
                href={`https://www.google.com/maps/dir/?api=1&destination=${property.lat},${property.lng}`}
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
  config
}: { 
  type: 'rent' | 'sale', 
  properties: Property[],
  onSelect: (p: Property) => void,
  onCompare: (p: Property) => void,
  comparisonList: string[],
  userLocation: { lat: number, lng: number } | null,
  onRequestViewing: (p: Property) => void,
  onRequestInfo: (p: Property) => void,
  config: SiteConfig
}) => {
  const [filters, setFilters] = useState({
    priceRange: 'all',
    bedrooms: 'all',
    location: 'all',
    propertyType: 'all',
    sortBy: 'default',
    amenities: [] as string[],
    status: 'all'
  });
  const [showAmenities, setShowAmenities] = useState(false);

  const allAmenities = useMemo(() => {
    const amenities = new Set<string>();
    properties.filter(p => p.type === type).forEach(p => {
      p.amenities?.forEach(a => amenities.add(a));
    });
    return Array.from(amenities);
  }, [properties, type]);

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

      // Bedrooms Filter (Rentals only)
      if (type === 'rent' && filters.bedrooms !== 'all') {
        const range = config.rentalRanges.find(r => r.id === filters.bedrooms);
        if (range) {
          const propertyBeds = p.bedrooms || 0;
          if (propertyBeds < range.minBedrooms || propertyBeds > range.maxBedrooms) return false;
        }
      }

      // Property Type Filter
      if (filters.propertyType !== 'all') {
        if (p.category !== filters.propertyType) return false;
      }

      // Location Filter
      if (filters.location !== 'all') {
        if (p.location !== filters.location) return false;
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
  }, [properties, type, filters, userLocation, config.rentalRanges]);

  const locations = useMemo(() => {
    const locs = new Set(properties.filter(p => p.type === type).map(p => p.location));
    return Array.from(locs);
  }, [properties, type]);

  return (
    <SectionBackground imageUrl={config.sectionImages.listings} opacity={0.03}>
      <section id={type === 'rent' ? "rentals" : "sales"} className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col xl:flex-row justify-between items-start xl:items-end mb-12 gap-8">
            <div>
              <h2 className={`font-bold tracking-widest uppercase text-sm mb-4 ${type === 'rent' ? 'text-emerald-700' : 'text-red-700'}`}>
                {type === 'rent' ? "Available for Let" : "Properties for Sale"}
              </h2>
              <h3 className="text-4xl font-extrabold text-slate-900">
                {type === 'rent' ? "Featured Rentals" : "Investment Opportunities"}
              </h3>
            </div>
            
            {/* Filters */}
            <div className="flex flex-wrap gap-3">
              <div className="flex items-center bg-white/80 backdrop-blur-sm rounded-xl px-3 py-2 border border-slate-200">
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

              <div className="flex items-center bg-white/80 backdrop-blur-sm rounded-xl px-3 py-2 border border-slate-200">
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
                <div className="flex items-center bg-white/80 backdrop-blur-sm rounded-xl px-3 py-2 border border-slate-200">
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
                <div className="flex items-center bg-white/80 backdrop-blur-sm rounded-xl px-3 py-2 border border-slate-200">
                  <Bed size={16} className="text-slate-500 mr-2" />
                  <select 
                    className="bg-transparent text-sm font-semibold focus:outline-none max-w-[120px]"
                    value={filters.bedrooms}
                    onChange={(e) => setFilters(prev => ({ ...prev, bedrooms: e.target.value }))}
                  >
                    <option value="all">All Sizes</option>
                    {config.rentalRanges.map(range => (
                      <option key={range.id} value={range.id}>{range.type}</option>
                    ))}
                  </select>
                </div>
              )}

              {type === 'sale' && (
                <div className="flex items-center bg-white/80 backdrop-blur-sm rounded-xl px-3 py-2 border border-slate-200">
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

              <div className="flex items-center bg-white/80 backdrop-blur-sm rounded-xl px-3 py-2 border border-slate-200">
                <MapPin size={16} className="text-slate-500 mr-2" />
                <select 
                  className="bg-transparent text-sm font-semibold focus:outline-none max-w-[120px]"
                  value={filters.location}
                  onChange={(e) => setFilters(prev => ({ ...prev, location: e.target.value }))}
                >
                  <option value="all">All Locations</option>
                  {locations.map(loc => (
                    <option key={loc} value={loc}>{loc}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center bg-white/80 backdrop-blur-sm rounded-xl px-3 py-2 border border-slate-200">
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

              <div className="relative">
                <button 
                  onClick={() => setShowAmenities(!showAmenities)}
                  className="flex items-center bg-white/80 backdrop-blur-sm rounded-xl px-4 py-2 border border-slate-200 cursor-pointer hover:bg-slate-50 transition-all"
                >
                  <Filter size={16} className="text-slate-500 mr-2" />
                  <span className="text-sm font-semibold truncate max-w-[120px]">
                    {filters.amenities.length === 0 ? "Amenities" : `${filters.amenities.length} Selected`}
                  </span>
                  <Plus size={14} className={`ml-2 transition-transform ${showAmenities ? 'rotate-45' : ''}`} />
                </button>
                
                <AnimatePresence>
                  {showAmenities && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className="absolute top-full right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-slate-100 p-4 z-[60] min-w-[240px]"
                    >
                      <div className="flex justify-between items-center mb-3 pb-2 border-b border-slate-100">
                        <span className="text-xs font-black text-slate-400 uppercase">Select Amenities</span>
                        {filters.amenities.length > 0 && (
                          <button 
                            onClick={() => setFilters(prev => ({ ...prev, amenities: [] }))}
                            className="text-[10px] font-bold text-red-500 hover:text-red-600"
                          >
                            Clear All
                          </button>
                        )}
                      </div>
                      <div className="space-y-1 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
                        {allAmenities.map(amenity => (
                          <label key={amenity} className="flex items-center justify-between gap-3 cursor-pointer hover:bg-slate-50 p-2 rounded-xl transition-colors group">
                            <span className="text-sm text-slate-700 group-hover:text-emerald-700 transition-colors">{amenity}</span>
                            <div className="relative">
                              <input 
                                type="checkbox" 
                                className="peer appearance-none w-5 h-5 rounded-md border-2 border-slate-200 checked:bg-emerald-500 checked:border-emerald-500 transition-all cursor-pointer"
                                checked={filters.amenities.includes(amenity)}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setFilters(prev => ({ ...prev, amenities: [...prev.amenities, amenity] }));
                                  } else {
                                    setFilters(prev => ({ ...prev, amenities: prev.amenities.filter(a => a !== amenity) }));
                                  }
                                }}
                              />
                              <Check className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-white w-3.5 h-3.5 pointer-events-none opacity-0 peer-checked:opacity-100 transition-opacity" strokeWidth={4} />
                            </div>
                          </label>
                        ))}
                      </div>
                      <button 
                        onClick={() => setShowAmenities(false)}
                        className="mt-4 w-full bg-slate-900 text-white py-2.5 rounded-xl text-xs font-bold hover:bg-slate-800 transition-all"
                      >
                        Apply Filters
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>

          {filteredProperties.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 sm:gap-8">
              {filteredProperties.map((item) => (
                <motion.div 
                  key={item.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  className="group cursor-pointer bg-white rounded-[2.5rem] overflow-hidden shadow-sm hover:shadow-2xl transition-all border border-slate-100 flex flex-col active:scale-[0.98]"
                >
                  <div className="relative overflow-hidden aspect-[4/3]" onClick={() => onSelect(item)}>
                    <img 
                      src={item.img} 
                      alt={item.title} 
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute top-4 left-4 flex flex-col gap-2">
                      <div className="bg-white/95 backdrop-blur-sm px-3 py-1.5 rounded-xl text-[10px] font-black text-slate-900 border border-slate-100 shadow-sm">
                        {item.id}
                      </div>
                      <div className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg ${
                        item.status === 'Available' ? 'bg-emerald-500 text-white' :
                        item.status === 'Under Offer' ? 'bg-amber-500 text-white' :
                        item.status === 'Sold' || item.status === 'Rented' ? 'bg-red-600 text-white' :
                        'bg-slate-900 text-white'
                      }`}>
                        {item.status}
                      </div>
                    </div>
                    {userLocation && (
                      <div className="absolute bottom-4 left-4 bg-emerald-600/95 backdrop-blur-sm px-3 py-1.5 rounded-xl text-[10px] font-black text-white flex items-center shadow-lg border border-emerald-500/20">
                        <Navigation size={12} className="mr-1.5" />
                        {getDistance(userLocation.lat, userLocation.lng, item.lat, item.lng).toFixed(1)} KM
                      </div>
                    )}
                  </div>
                  
                  <div className="p-5 sm:p-6 flex-1 flex flex-col">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="text-lg sm:text-xl font-black text-slate-900 leading-tight flex-1" onClick={() => onSelect(item)}>{item.title}</h4>
                      <button 
                        onClick={(e) => { e.stopPropagation(); onCompare(item); }}
                        className={`p-2 rounded-xl transition-all ${comparisonList.includes(item.id) ? 'bg-emerald-500 text-white shadow-lg' : 'bg-slate-100 text-slate-400 hover:bg-slate-200'}`}
                        title="Compare Property"
                      >
                        <Scale size={20} />
                      </button>
                    </div>
                    <div className="flex items-center text-slate-500 text-sm font-bold mb-6" onClick={() => onSelect(item)}>
                      <MapPin size={14} className="mr-1.5 text-emerald-500" /> {item.location}
                    </div>

                    <div className="flex items-center justify-between mt-auto pt-4 border-t border-slate-50">
                      <div className="flex flex-col">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Price</span>
                        <div className="text-xl font-black text-emerald-600 tracking-tighter">
                          Ksh {item.price.toLocaleString()}
                          {item.type === 'rent' && <span className="text-[10px] font-bold text-slate-400 ml-1 italic">/mo</span>}
                        </div>
                      </div>
                      <button className="bg-slate-900 text-white p-3 rounded-2xl hover:bg-emerald-600 transition-all shadow-xl shadow-slate-900/10 active:scale-90">
                        <ArrowRight size={20} />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-20 bg-white/50 backdrop-blur-sm rounded-[2.5rem] border-2 border-dashed border-slate-200">
              <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6 text-emerald-600">
                <Search size={40} />
              </div>
              <h4 className="text-2xl font-black text-slate-900 mb-2">No Properties Found</h4>
              <p className="text-slate-500 font-medium mb-8">Try adjusting your filters or search terms for better results.</p>
              <button 
                onClick={() => setFilters({ priceRange: 'all', bedrooms: 'all', location: 'all', propertyType: 'all', sortBy: 'default', amenities: [], status: 'all' })}
                className="bg-emerald-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-600/20"
              >
                Clear All Filters
              </button>
            </div>
          )}
        </div>
      </section>
    </SectionBackground>
  );
};

const RentalGuide = ({ config }: { config: SiteConfig }) => {
  return (
    <SectionBackground imageUrl={config.sectionImages.rentalGuide} opacity={0.04} className="bg-slate-50">
      <section id="rental-guide" className="py-24 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-100 text-emerald-700 rounded-full text-[10px] font-black uppercase tracking-widest mb-4"
            >
              <TrendingUp size={14} /> Regional Market Guide
            </motion.div>
            <h2 className="text-4xl md:text-5xl font-black text-slate-900 mb-6 tracking-tight">Standard Rental Rates</h2>
            <p className="text-slate-500 max-w-2xl mx-auto font-medium">Standard rental rates across our most popular regions to help you plan your next move with transparency.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {config.rentalRanges.map((range, idx) => (
              <motion.div
                key={range.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                viewport={{ once: true }}
                className="bg-white/80 backdrop-blur-md p-8 rounded-[2.5rem] shadow-sm hover:shadow-xl transition-all border border-slate-100 group flex flex-col h-full"
              >
                <div className="flex justify-between items-start mb-8">
                  <div className="p-4 bg-emerald-50 rounded-2xl text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-all duration-500">
                    <Home size={24} />
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Starting From</span>
                    <div className="text-xl font-black text-slate-900 group-hover:text-emerald-700 transition-colors uppercase tracking-tighter">
                      {range.price}
                    </div>
                  </div>
                </div>
                
                <div className="flex-1">
                  <h4 className="text-xl font-black text-slate-900 mb-2 group-hover:translate-x-1 transition-transform">{range.type}</h4>
                  <div className="flex items-center text-slate-500 font-bold text-sm">
                    <MapPin size={14} className="mr-2 text-emerald-500" /> {range.region}
                  </div>
                </div>

                <div className="mt-10 pt-6 border-t border-slate-50 flex items-center justify-between">
                  <div className="flex items-center text-[10px] font-black text-slate-400 uppercase tracking-widest gap-2 bg-slate-50 px-3 py-1.5 rounded-xl">
                    <Bed size={14} className="text-emerald-500" /> {range.minBedrooms}-{range.maxBedrooms} {range.minBedrooms === 1 && range.maxBedrooms === 1 ? 'Bed' : 'Beds'}
                  </div>
                  <a 
                    href="#rentals" 
                    className="w-10 h-10 rounded-full border border-slate-200 flex items-center justify-center text-slate-400 hover:bg-emerald-600 hover:text-white hover:border-emerald-600 transition-all active:scale-90"
                  >
                    <ArrowRight size={18} />
                  </a>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </SectionBackground>
  );
};

const Office = ({ config }: { config: SiteConfig }) => {
  return (
    <section id="office" className="py-24 bg-white overflow-hidden">
      <div className="max-w-7xl mx-auto px-4">
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
            <h2 className="text-4xl md:text-5xl font-extrabold text-slate-900 leading-tight">
              {config.siteName} Plaza, <span className="text-emerald-600">Nairobi</span>
            </h2>
            <p className="text-slate-600 text-lg leading-relaxed">
              Our headquarters is located in the heart of Nairobi. We welcome you to visit us for a one-on-one consultation regarding property management, construction, or real estate investment.
            </p>
            
            <div className="space-y-4">
              <div className="flex items-start gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <div className="bg-emerald-600 p-3 rounded-xl text-white">
                  <MapPin size={24} />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900">Address</h4>
                  <p className="text-slate-600">{config.contactAddress}</p>
                </div>
              </div>
              
              <div className="flex items-start gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <div className="bg-emerald-600 p-3 rounded-xl text-white">
                  <Clock size={24} />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900">Business Hours</h4>
                  <p className="text-slate-600">{config.officeWorkingHours}</p>
                </div>
              </div>
            </div>

            <a 
              href="https://www.google.com/maps/dir/?api=1&destination=-1.3032,36.7850" 
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
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3988.814347714857!2d36.7828!3d-1.3032!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x182f109966600001%3A0x7d00000000000000!2sNgong%20Rd%2C%20Nairobi!5e0!3m2!1sen!2ske!4v1712345678901!5m2!1sen!2ske" 
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
    service: initialService || "Select Service",
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      setIsSubmitting(true);
      // Simulate API call
      setTimeout(() => {
        setIsSubmitting(false);
        setIsSuccess(true);
        setFormData({ name: "", email: "", service: "Select Service", message: "" });
        setTimeout(() => setIsSuccess(false), 5000);
      }, 1500);
    }
  };

  return (
    <SectionBackground imageUrl={config.sectionImages.contact} opacity={0.06} className="bg-emerald-900">
      <section id="contact" className="py-24 text-white overflow-hidden relative">
      {/* Decorative background elements */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-800 rounded-full blur-3xl -mr-48 -mt-48 opacity-50"></div>
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-emerald-800 rounded-full blur-3xl -ml-48 -mb-48 opacity-50"></div>

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
    </SectionBackground>
  );
};

const Footer = ({ config }: { config: SiteConfig }) => {
  return (
    <footer className="bg-slate-950 text-slate-200 relative overflow-hidden border-t border-white/5">
      {/* Background Image Overlay */}
      <div 
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{ 
          backgroundImage: `url(${config.sectionImages.footer})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}
      />
      
      <div className="relative z-10 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
            <div>
              <div className="text-3xl font-extrabold tracking-tighter mb-6 flex items-center">
                <span className="text-emerald-500">{config.siteName}</span>
                <span className="text-red-500 ml-1">{config.siteNameSecondary}</span>
              </div>
              <p className="text-slate-400 leading-relaxed mb-8 max-w-sm">
                {config.siteDescription}
              </p>
              <div className="flex space-x-4">
                <a href={config.socialLinks.facebook} className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center hover:bg-emerald-600 hover:scale-110 transition-all">
                  <Facebook size={22} className="text-white" />
                </a>
                <a href={config.socialLinks.instagram} className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center hover:bg-emerald-600 hover:scale-110 transition-all">
                  <Instagram size={22} className="text-white" />
                </a>
                <a href={config.socialLinks.twitter} className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center hover:bg-emerald-600 hover:scale-110 transition-all">
                  <Twitter size={22} className="text-white" />
                </a>
              </div>
            </div>

            <div>
              <h5 className="text-white text-lg font-black uppercase tracking-widest mb-8 border-l-4 border-emerald-600 pl-4 italic">Quick Links</h5>
              <ul className="space-y-4 text-slate-400 font-medium">
                <li><a href="#home" className="hover:text-emerald-500 transition-colors flex items-center gap-2 group"><div className="w-1.5 h-1.5 bg-emerald-500 rounded-full opacity-0 group-hover:opacity-100 transition-all" /> Home</a></li>
                <li><a href="#services" className="hover:text-emerald-500 transition-colors flex items-center gap-2 group"><div className="w-1.5 h-1.5 bg-emerald-500 rounded-full opacity-0 group-hover:opacity-100 transition-all" /> Our Services</a></li>
                <li><a href="#listings-container" className="hover:text-emerald-500 transition-colors flex items-center gap-2 group"><div className="w-1.5 h-1.5 bg-emerald-500 rounded-full opacity-0 group-hover:opacity-100 transition-all" /> Rental Listings</a></li>
                <li><a href="#contact" className="hover:text-emerald-500 transition-colors flex items-center gap-2 group"><div className="w-1.5 h-1.5 bg-emerald-500 rounded-full opacity-0 group-hover:opacity-100 transition-all" /> Office Location</a></li>
              </ul>
            </div>

            <div>
              <h5 className="text-white text-lg font-black uppercase tracking-widest mb-8 border-l-4 border-emerald-600 pl-4 italic">Our Expertise</h5>
              <ul className="space-y-4 text-slate-400 font-medium">
                {config.services.map(s => (
                  <li key={s.id} className="flex items-center gap-3">
                    <div className="w-1 h-1 bg-slate-700 rounded-full" />
                    {s.title}
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h5 className="text-white text-lg font-black uppercase tracking-widest mb-8 border-l-4 border-emerald-600 pl-4 italic">Updates</h5>
              <p className="text-slate-400 mb-6">Stay informed about the latest investment alerts and premium opportunities.</p>
              <div className="flex gap-2">
                <input 
                  type="email" 
                  placeholder="Your Email" 
                  className="bg-white/5 border border-white/10 px-4 py-4 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500 w-full text-white placeholder:text-slate-600"
                />
                <button className="bg-emerald-600 text-white p-4 rounded-2xl hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-900/40">
                  <ArrowRight size={20} />
                </button>
              </div>
            </div>
          </div>

          <div className="pt-10 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-8 text-slate-500 text-xs font-bold uppercase tracking-[0.2em]">
            <p>&copy; {new Date().getFullYear()} {config.siteName}. All rights reserved.</p>
            <div className="flex items-center gap-4 group">
              <span className="text-slate-700">Powered by</span>
              <div className="flex items-center gap-3 bg-white/5 px-4 py-2.5 rounded-2xl hover:bg-white/10 transition-all border border-white/5">
                <div className="w-8 h-8 bg-white rounded-xl flex items-center justify-center p-1.5 shadow-inner">
                  <svg viewBox="0 0 100 100" className="w-full h-full">
                    <circle cx="50" cy="50" r="45" fill="none" stroke="#000" strokeWidth="4" />
                    <circle cx="50" cy="30" r="10" fill="#000" />
                    <circle cx="30" cy="65" r="10" fill="#000" />
                    <circle cx="70" cy="65" r="10" fill="#000" />
                    <path d="M50 30 L30 65 M50 30 L70 65 M30 65 L70 65" stroke="#000" strokeWidth="4" fill="none" />
                  </svg>
                </div>
                <div className="flex flex-col leading-none">
                  <span className="text-white font-black tracking-tighter text-[11px]">TRACE</span>
                  <span className="text-[7px] text-slate-500 uppercase tracking-[0.3em] font-black">Technologies</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

const AdminLogin = () => {
  const [isError, setIsError] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleGoogleLogin = async () => {
    setLoading(true);
    setIsError(false);
    try {
      await loginWithGoogle();
    } catch (error) {
      console.error("Login Error:", error);
      setIsError(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[200] bg-slate-900/95 backdrop-blur-xl flex items-center justify-center p-4"
    >
      <motion.div 
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        className="bg-white w-full max-w-md rounded-[2.5rem] overflow-hidden shadow-2xl p-6 sm:p-10 md:p-12"
      >
        <div className="text-center mb-8">
          <div className="w-16 h-16 sm:w-20 sm:h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6">
            <ShieldCheck size={40} className="w-8 h-8 sm:w-10 sm:h-10" />
          </div>
          <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mb-2">Command Center</h3>
          <p className="text-slate-500 text-sm">Authorized Personnel Only</p>
        </div>

        <div className="space-y-6">
          <p className="text-center text-slate-500 text-sm leading-relaxed px-4">
            Access to the management dashboard requires secure authentication. Please sign in with an authorized Google account.
          </p>

          <AnimatePresence>
            {isError && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="bg-red-50 p-4 rounded-2xl border border-red-100 text-red-600 text-xs sm:text-sm font-bold text-center"
              >
                Access Denied. Please ensure your account is authorized to access this panel.
              </motion.div>
            )}
          </AnimatePresence>

          <button 
            type="button"
            disabled={loading}
            onClick={handleGoogleLogin}
            className="w-full bg-white border border-slate-200 text-slate-900 py-4 sm:py-5 rounded-3xl font-bold text-sm sm:text-base hover:bg-slate-50 transition-all flex items-center justify-center gap-3 active:scale-95 shadow-sm hover:shadow-md disabled:opacity-50"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <>
                <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-5 h-5 sm:w-6 sm:h-6" alt="Google" />
                Sign in with Google Account
              </>
            )}
          </button>
          
          <div className="pt-6 border-t border-slate-100 flex flex-col items-center gap-2">
            <div className="flex items-center gap-2 text-[10px] text-slate-400 font-bold uppercase tracking-widest">
              <ShieldCheck size={12} /> Encrypted Session
            </div>
            <p className="text-[9px] text-slate-300 text-center uppercase tracking-tight">Your credentials are managed securely by Google Firebase Auth</p>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

const AdminPanel = ({ 
  properties, 
  onSaveProperty,
  onDeleteProperty,
  onClose,
  config,
  onSaveConfig,
  role
}: { 
  properties: Property[], 
  onSaveProperty: (p: Property) => Promise<void>,
  onDeleteProperty: (p: Property) => Promise<void>,
  onClose: () => void,
  config: SiteConfig,
  onSaveConfig: (c: SiteConfig) => Promise<void>,
  role: 'super-admin' | 'content-manager'
}) => {
  const [editingProperty, setEditingProperty] = useState<Property | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [newImageUrl, setNewImageUrl] = useState("");
  const [activeTab, setActiveTab] = useState<'properties' | 'site-settings' | 'configuration'>(role === 'super-admin' ? 'properties' : 'properties');
  const [editingConfig, setEditingConfig] = useState<SiteConfig>(config);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [isSaving, setIsSaving] = useState(false);

  const adminFilteredProperties = useMemo(() => {
    return properties.filter(p => {
      const title = p.title || "";
      const location = p.location || "";
      const id = p.id || "";
      const matchesSearch = title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                           location.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           id.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === "all" || p.status === statusFilter;
      const matchesType = typeFilter === "all" || p.type === typeFilter;
      return matchesSearch && matchesStatus && matchesType;
    });
  }, [properties, searchTerm, statusFilter, typeFilter]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingProperty) {
      setIsSaving(true);
      try {
        await onSaveProperty(editingProperty);
        setEditingProperty(null);
        setIsAdding(false);
      } finally {
        setIsSaving(false);
      }
    }
  };

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await onSaveConfig(editingConfig);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    const prop = properties.find(p => p.id === id);
    if (prop) {
      setIsSaving(true);
      try {
        await onDeleteProperty(prop);
        setDeleteConfirm(null);
      } finally {
        setIsSaving(false);
      }
    }
  };

  const startEdit = (p: Property) => {
    setEditingProperty({ ...p, images: p.images || [] });
    setIsAdding(false);
  };

  const startAdd = () => {
    setEditingProperty({
      id: `NEW-${Date.now()}`,
      title: "",
      price: 0,
      location: "",
      img: "https://picsum.photos/seed/new/800/600",
      images: [],
      type: 'rent',
      category: '2-bedroom',
      description: "",
      lat: -1.286389,
      lng: 36.817223,
      virtualTourUrl: "",
      status: 'Available',
      tags: []
    });
    setIsAdding(true);
  };

  const uploadPropertyAsset = async (file: File, assetType: 'image' | 'video', index: number) => {
    if (!editingProperty) return;

    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const storagePath = buildStoragePath([
      'media',
      'lphask',
      'properties',
      editingProperty.id,
      assetType === 'video' ? 'video' : 'images',
      `${Date.now()}-${index}-${safeName}`,
    ]);

    return uploadFileToStorage(file, storagePath);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'image' | 'video' = 'image') => {
    const files = e.target.files;
    if (!files || files.length === 0 || !editingProperty) return;

    const selectedFiles = Array.from(files);
    if (type === 'video') {
      const downloadUrl = await uploadPropertyAsset(selectedFiles[0], type, 0);
      if (downloadUrl) {
        setEditingProperty(prev => prev ? { ...prev, videoTourUrl: downloadUrl } : prev);
      }
    } else {
      const uploadedUrls: string[] = [];
      for (const [index, file] of selectedFiles.entries()) {
        const downloadUrl = await uploadPropertyAsset(file, type, index);
        if (downloadUrl) {
          uploadedUrls.push(downloadUrl);
        }
      }
      if (uploadedUrls.length > 0) {
        setEditingProperty(prev => prev ? { ...prev, images: [...(prev.images || []), ...uploadedUrls] } : prev);
      }
    }
    e.target.value = '';
  };

  const moveImage = (index: number, direction: 'left' | 'right') => {
    if (editingProperty) {
      const newImages = [...(editingProperty.images || [])];
      const targetIndex = direction === 'left' ? index - 1 : index + 1;
      if (targetIndex >= 0 && targetIndex < newImages.length) {
        [newImages[index], newImages[targetIndex]] = [newImages[targetIndex], newImages[index]];
        setEditingProperty({ ...editingProperty, images: newImages });
      }
    }
  };

  const addImage = () => {
    if (newImageUrl && editingProperty) {
      setEditingProperty({
        ...editingProperty,
        images: [...(editingProperty.images || []), newImageUrl]
      });
      setNewImageUrl("");
    }
  };

  const removeImage = (index: number) => {
    if (editingProperty) {
      const newImages = [...(editingProperty.images || [])];
      newImages.splice(index, 1);
      setEditingProperty({ ...editingProperty, images: newImages });
    }
  };

  const uploadConfigAsset = async (
    file: File,
    category: 'hero' | 'section',
    key: string
  ) => {
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const storagePath = buildStoragePath([
      'media',
      'lphask',
      category,
      key,
      `${Date.now()}-${safeName}`,
    ]);

    return uploadFileToStorage(file, storagePath);
  };

  const updateRentalRange = (index: number, patch: Partial<SiteConfig["rentalRanges"][number]>) => {
    setEditingConfig(prev => {
      const next = [...prev.rentalRanges];
      next[index] = { ...next[index], ...patch };
      return { ...prev, rentalRanges: next };
    });
  };

  const addRentalRange = () => {
    setEditingConfig(prev => ({
      ...prev,
      rentalRanges: [
        ...prev.rentalRanges,
        {
          id: `range-${Date.now()}`,
          type: "",
          region: "",
          price: "",
          minBedrooms: 0,
          maxBedrooms: 0
        }
      ]
    }));
  };

  const removeRentalRange = (index: number) => {
    setEditingConfig(prev => ({
      ...prev,
      rentalRanges: prev.rentalRanges.filter((_, idx) => idx !== index)
    }));
  };

  const updateService = (index: number, patch: Partial<SiteConfig["services"][number]>) => {
    setEditingConfig(prev => {
      const next = [...prev.services];
      next[index] = { ...next[index], ...patch };
      return { ...prev, services: next };
    });
  };

  const addService = () => {
    setEditingConfig(prev => ({
      ...prev,
      services: [
        ...prev.services,
        {
          id: `service-${Date.now()}`,
          title: "",
          desc: "",
          icon: "Home",
          color: "bg-emerald-50"
        }
      ]
    }));
  };

  const removeService = (index: number) => {
    setEditingConfig(prev => ({
      ...prev,
      services: prev.services.filter((_, idx) => idx !== index)
    }));
  };

  const updateTestimonial = (index: number, patch: Partial<Testimonial>) => {
    setEditingConfig(prev => {
      const next = [...prev.testimonials];
      next[index] = { ...next[index], ...patch };
      return { ...prev, testimonials: next };
    });
  };

  const addTestimonial = () => {
    setEditingConfig(prev => ({
      ...prev,
      testimonials: [
        ...prev.testimonials,
        {
          id: `T-${Date.now()}`,
          name: "",
          role: "Client",
          content: "",
          photo: "https://picsum.photos/seed/lphask-testimonial/200/200",
          rating: 5,
          date: new Date().toISOString().split("T")[0]
        }
      ]
    }));
  };

  const removeTestimonial = (index: number) => {
    setEditingConfig(prev => ({
      ...prev,
      testimonials: prev.testimonials.filter((_, idx) => idx !== index)
    }));
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] bg-slate-900/90 backdrop-blur-md flex items-center justify-center p-4"
    >
      <div className="bg-white w-full max-w-5xl h-full sm:h-[90vh] rounded-none sm:rounded-[3rem] overflow-hidden flex flex-col shadow-2xl relative">
        <div className="p-4 sm:p-8 border-b border-slate-100 flex flex-col md:flex-row justify-between items-center bg-slate-50 gap-4">
          <div className="text-center md:text-left">
            <div className="flex items-center justify-center md:justify-start gap-2 mb-1">
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 leading-none">Command Center</h2>
              <span className={`text-[10px] font-black px-2 py-0.5 rounded-lg uppercase tracking-widest ${
                role === 'super-admin' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
              }`}>
                {role.replace('-', ' ')}
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-500">Manage listings and configurations</p>
          </div>
          <div className="flex flex-wrap justify-center gap-1.5 sm:gap-2 bg-white p-1 rounded-2xl shadow-sm border border-slate-200">
            <button 
              onClick={() => { setActiveTab('properties'); setEditingProperty(null); }}
              className={`px-4 sm:px-6 py-2 rounded-xl font-bold text-xs sm:text-sm transition-all ${activeTab === 'properties' ? 'bg-emerald-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-900'}`}
            >
              Properties
            </button>
            {role === 'super-admin' && (
              <>
                <button 
                  onClick={() => { setActiveTab('site-settings'); setEditingProperty(null); }}
                  className={`px-4 sm:px-6 py-2 rounded-xl font-bold text-xs sm:text-sm transition-all ${activeTab === 'site-settings' ? 'bg-emerald-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-900'}`}
                >
                  Site Settings
                </button>
                <button 
                  onClick={() => { setActiveTab('configuration'); setEditingProperty(null); }}
                  className={`px-4 sm:px-6 py-2 rounded-xl font-bold text-xs sm:text-sm transition-all ${activeTab === 'configuration' ? 'bg-emerald-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-900'}`}
                >
                  Page Assets
                </button>
              </>
            )}
            <button 
              onClick={() => { logout(); onClose(); }}
              className="px-4 sm:px-6 py-2 rounded-xl font-bold text-xs sm:text-sm text-red-600 hover:bg-red-50 transition-all border border-transparent hover:border-red-100"
            >
              Logout
            </button>
          </div>
          <button onClick={onClose} className="absolute top-4 right-4 md:static p-2.5 sm:p-3 bg-white rounded-2xl text-slate-400 hover:text-slate-900 shadow-sm transition-all">
            <X size={20} className="sm:w-6 sm:h-6" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 sm:p-8">
          {activeTab === 'site-settings' ? (
            <div className="max-w-4xl mx-auto space-y-12">
              <form onSubmit={handleSaveConfig} className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-6">
                    <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                      <Building2 className="text-emerald-600" size={20} />
                      Site Information
                    </h3>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-700">Site Name (Primary)</label>
                        <input 
                          type="text" 
                          className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none"
                          value={editingConfig.siteName}
                          onChange={(e) => setEditingConfig({ ...editingConfig, siteName: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-700">Site Name (Secondary)</label>
                        <input 
                          type="text" 
                          className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none"
                          value={editingConfig.siteNameSecondary}
                          onChange={(e) => setEditingConfig({ ...editingConfig, siteNameSecondary: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-700">Site Description</label>
                        <textarea 
                          className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none h-24 resize-none"
                          value={editingConfig.siteDescription}
                          onChange={(e) => setEditingConfig({ ...editingConfig, siteDescription: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-700">Hero Badge</label>
                        <input 
                          type="text"
                          className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none"
                          value={editingConfig.heroBadge}
                          onChange={(e) => setEditingConfig({ ...editingConfig, heroBadge: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-700">Brand Theme Color</label>
                        <input 
                          type="text"
                          className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none"
                          value={editingConfig.brandThemeColor}
                          onChange={(e) => setEditingConfig({ ...editingConfig, brandThemeColor: e.target.value })}
                          placeholder="#861b2a"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                      <TrendingUp className="text-emerald-600" size={20} />
                      Performance Stats (KPIs)
                    </h3>
                    <div className="space-y-4">
                      {editingConfig.stats.map((stat, idx) => (
                        <div key={idx} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-3">
                          <div className="text-sm font-black text-emerald-700 uppercase tracking-tighter">Stat: {stat.label}</div>
                          <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1">
                              <label className="text-[10px] font-bold text-slate-500 uppercase">Label</label>
                              <input 
                                type="text"
                                className="w-full px-3 py-2 rounded-lg border border-slate-200 outline-none text-sm"
                                value={stat.label}
                                onChange={(e) => {
                                  const newStats = [...editingConfig.stats];
                                  newStats[idx] = { ...stat, label: e.target.value };
                                  setEditingConfig({ ...editingConfig, stats: newStats });
                                }}
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="text-[10px] font-bold text-slate-500 uppercase">Value</label>
                              <input 
                                type="text"
                                className="w-full px-3 py-2 rounded-lg border border-slate-200 outline-none text-sm"
                                value={stat.value}
                                onChange={(e) => {
                                  const newStats = [...editingConfig.stats];
                                  newStats[idx] = { ...stat, value: e.target.value };
                                  setEditingConfig({ ...editingConfig, stats: newStats });
                                }}
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                   <div className="space-y-6">
                    <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                      <Phone className="text-emerald-600" size={20} />
                      Contact Information
                    </h3>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-700">Phone Number</label>
                        <input 
                          type="text" 
                          className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none"
                          value={editingConfig.contactPhone}
                          onChange={(e) => setEditingConfig({ ...editingConfig, contactPhone: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-700">Email Address</label>
                        <input 
                          type="email" 
                          className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none"
                          value={editingConfig.contactEmail}
                          onChange={(e) => setEditingConfig({ ...editingConfig, contactEmail: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-700">Viewing Fee</label>
                        <input 
                          type="text" 
                          className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none"
                          value={editingConfig.viewingFee}
                          onChange={(e) => setEditingConfig({ ...editingConfig, viewingFee: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-700">Contact Address</label>
                        <input 
                          type="text" 
                          className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none"
                          value={editingConfig.contactAddress}
                          onChange={(e) => setEditingConfig({ ...editingConfig, contactAddress: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-700">Office Hours</label>
                        <input 
                          type="text" 
                          className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none"
                          value={editingConfig.officeWorkingHours}
                          onChange={(e) => setEditingConfig({ ...editingConfig, officeWorkingHours: e.target.value })}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700">Facebook URL</label>
                    <input 
                      type="url"
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none"
                      value={editingConfig.socialLinks.facebook}
                      onChange={(e) => setEditingConfig({
                        ...editingConfig,
                        socialLinks: { ...editingConfig.socialLinks, facebook: e.target.value }
                      })}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700">Instagram URL</label>
                    <input 
                      type="url"
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none"
                      value={editingConfig.socialLinks.instagram}
                      onChange={(e) => setEditingConfig({
                        ...editingConfig,
                        socialLinks: { ...editingConfig.socialLinks, instagram: e.target.value }
                      })}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700">Twitter / X URL</label>
                    <input 
                      type="url"
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none"
                      value={editingConfig.socialLinks.twitter}
                      onChange={(e) => setEditingConfig({
                        ...editingConfig,
                        socialLinks: { ...editingConfig.socialLinks, twitter: e.target.value }
                      })}
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-8 border-t border-slate-100">
                  <button 
                    type="submit"
                    className="px-10 py-4 bg-emerald-600 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-emerald-700 shadow-xl shadow-emerald-600/20 active:scale-95 transition-all"
                  >
                    Save Site Settings
                  </button>
                </div>
              </form>
            </div>
          ) : activeTab === 'configuration' ? (
            <div className="max-w-4xl mx-auto space-y-12">
              <form onSubmit={handleSaveConfig} className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-6">
                    <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                      <ImageIcon className="text-emerald-600" size={20} />
                      Section Background Images
                    </h3>
                    <div className="space-y-4">
                      {Object.entries(editingConfig.sectionImages).map(([key, value]) => (
                        <div key={key} className="space-y-2">
                          <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">{key.replace(/([A-Z])/g, ' $1')}</label>
                          <div className="flex items-center gap-2">
                            <input 
                              type="text" 
                              className="flex-1 px-4 py-2 rounded-xl border border-slate-200 outline-none text-sm"
                              value={value}
                              onChange={(e) => setEditingConfig({ 
                                ...editingConfig, 
                                sectionImages: { ...editingConfig.sectionImages, [key]: e.target.value } 
                              })}
                            />
                             <label className="cursor-pointer bg-slate-100 p-2 rounded-lg hover:bg-slate-200 transition-all">
                              <Camera size={16} className="text-slate-600" />
                              <input 
                                type="file" 
                                className="hidden" 
                                accept="image/*"
                                onChange={async (e) => {
                                  const file = e.target.files?.[0];
                                  if (file) {
                                    const uploadedUrl = await uploadConfigAsset(file, 'section', key);
                                    setEditingConfig({ 
                                      ...editingConfig, 
                                      sectionImages: { ...editingConfig.sectionImages, [key]: uploadedUrl } 
                                    });
                                    e.currentTarget.value = '';
                                  }
                                }}
                              />
                            </label>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-6">
                    <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                      <Home className="text-emerald-600" size={20} />
                      Hero & Global Assets
                    </h3>
                    <div className="space-y-4">
                       <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-700">Hero Background Image</label>
                        <div className="flex items-center gap-4">
                          <div className="flex-1">
                            <input 
                              type="text" 
                              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none"
                              value={editingConfig.heroBgImage}
                              onChange={(e) => setEditingConfig({ ...editingConfig, heroBgImage: e.target.value })}
                            />
                          </div>
                          <label className="cursor-pointer bg-slate-100 p-3 rounded-xl hover:bg-slate-200 transition-all">
                            <Camera size={20} className="text-slate-600" />
                            <input 
                              type="file" 
                              className="hidden" 
                              accept="image/*"
                              onChange={async (e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  const uploadedUrl = await uploadConfigAsset(file, 'hero', 'background');
                                  setEditingConfig({ ...editingConfig, heroBgImage: uploadedUrl });
                                  e.currentTarget.value = '';
                                }
                              }}
                            />
                          </label>
                        </div>
                      </div>
                      
                      <div className="space-y-2 pt-4 border-t border-slate-100">
                        <label className="text-sm font-bold text-slate-700">Hero Title</label>
                        <input 
                          type="text" 
                          className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none"
                          value={editingConfig.heroTitle}
                          onChange={(e) => setEditingConfig({ ...editingConfig, heroTitle: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-700">Hero Subtitle</label>
                        <textarea 
                          className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none h-24 resize-none"
                          value={editingConfig.heroSubtitle}
                          onChange={(e) => setEditingConfig({ ...editingConfig, heroSubtitle: e.target.value })}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-8 pt-6 border-t border-slate-100">
                  <div className="flex items-center justify-between gap-4">
                    <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                      <Layers className="text-emerald-600" size={20} />
                      Rental Guide Ranges
                    </h3>
                    <button
                      type="button"
                      onClick={addRentalRange}
                      className="px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold uppercase tracking-widest hover:bg-slate-800 transition-all"
                    >
                      Add Range
                    </button>
                  </div>
                  <div className="space-y-4">
                    {editingConfig.rentalRanges.map((range, idx) => (
                      <div key={range.id} className="rounded-[2rem] border border-slate-200 bg-slate-50 p-4 md:p-6 space-y-4">
                        <div className="flex items-center justify-between gap-4">
                          <div className="text-sm font-black uppercase tracking-widest text-slate-500">Range {idx + 1}</div>
                          <button
                            type="button"
                            onClick={() => removeRentalRange(idx)}
                            className="text-xs font-bold uppercase tracking-widest text-red-600 hover:text-red-700"
                          >
                            Remove
                          </button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Type</label>
                            <input
                              type="text"
                              className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none"
                              value={range.type}
                              onChange={(e) => updateRentalRange(idx, { type: e.target.value })}
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Region</label>
                            <input
                              type="text"
                              className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none"
                              value={range.region}
                              onChange={(e) => updateRentalRange(idx, { region: e.target.value })}
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Price</label>
                            <input
                              type="text"
                              className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none"
                              value={range.price}
                              onChange={(e) => updateRentalRange(idx, { price: e.target.value })}
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Min Beds</label>
                              <input
                                type="number"
                                className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none"
                                value={range.minBedrooms}
                                onChange={(e) => updateRentalRange(idx, { minBedrooms: Number(e.target.value) })}
                              />
                            </div>
                            <div className="space-y-2">
                              <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Max Beds</label>
                              <input
                                type="number"
                                className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none"
                                value={range.maxBedrooms}
                                onChange={(e) => updateRentalRange(idx, { maxBedrooms: Number(e.target.value) })}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-8 pt-6 border-t border-slate-100">
                  <div className="flex items-center justify-between gap-4">
                    <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                      <Building2 className="text-emerald-600" size={20} />
                      Service Blocks
                    </h3>
                    <button
                      type="button"
                      onClick={addService}
                      className="px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold uppercase tracking-widest hover:bg-slate-800 transition-all"
                    >
                      Add Service
                    </button>
                  </div>
                  <div className="space-y-4">
                    {editingConfig.services.map((service, idx) => (
                      <div key={service.id} className="rounded-[2rem] border border-slate-200 bg-white p-4 md:p-6 space-y-4">
                        <div className="flex items-center justify-between gap-4">
                          <div className="text-sm font-black uppercase tracking-widest text-slate-500">Service {idx + 1}</div>
                          <button
                            type="button"
                            onClick={() => removeService(idx)}
                            className="text-xs font-bold uppercase tracking-widest text-red-600 hover:text-red-700"
                          >
                            Remove
                          </button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Title</label>
                            <input
                              type="text"
                              className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none"
                              value={service.title}
                              onChange={(e) => updateService(idx, { title: e.target.value })}
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Icon Name</label>
                            <input
                              type="text"
                              className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none"
                              value={service.icon}
                              onChange={(e) => updateService(idx, { icon: e.target.value })}
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Description</label>
                            <textarea
                              className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none h-24 resize-none"
                              value={service.desc}
                              onChange={(e) => updateService(idx, { desc: e.target.value })}
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">ID</label>
                              <input
                                type="text"
                                className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none"
                                value={service.id}
                                onChange={(e) => updateService(idx, { id: e.target.value })}
                              />
                            </div>
                            <div className="space-y-2">
                              <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Color Class</label>
                              <input
                                type="text"
                                className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none"
                                value={service.color}
                                onChange={(e) => updateService(idx, { color: e.target.value })}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-8 pt-6 border-t border-slate-100">
                  <div className="flex items-center justify-between gap-4">
                    <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                      <MessageSquare className="text-emerald-600" size={20} />
                      Testimonials
                    </h3>
                    <button
                      type="button"
                      onClick={addTestimonial}
                      className="px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold uppercase tracking-widest hover:bg-slate-800 transition-all"
                    >
                      Add Testimonial
                    </button>
                  </div>
                  <div className="space-y-4">
                    {editingConfig.testimonials.map((testimonial, idx) => (
                      <div key={testimonial.id} className="rounded-[2rem] border border-slate-200 bg-slate-50 p-4 md:p-6 space-y-4">
                        <div className="flex items-center justify-between gap-4">
                          <div className="text-sm font-black uppercase tracking-widest text-slate-500">Testimonial {idx + 1}</div>
                          <button
                            type="button"
                            onClick={() => removeTestimonial(idx)}
                            className="text-xs font-bold uppercase tracking-widest text-red-600 hover:text-red-700"
                          >
                            Remove
                          </button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Name</label>
                            <input
                              type="text"
                              className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none"
                              value={testimonial.name}
                              onChange={(e) => updateTestimonial(idx, { name: e.target.value })}
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Role</label>
                            <input
                              type="text"
                              className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none"
                              value={testimonial.role}
                              onChange={(e) => updateTestimonial(idx, { role: e.target.value })}
                            />
                          </div>
                          <div className="space-y-2 md:col-span-2">
                            <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Content</label>
                            <textarea
                              className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none h-28 resize-none"
                              value={testimonial.content}
                              onChange={(e) => updateTestimonial(idx, { content: e.target.value })}
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Photo URL</label>
                            <input
                              type="text"
                              className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none"
                              value={testimonial.photo}
                              onChange={(e) => updateTestimonial(idx, { photo: e.target.value })}
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Rating</label>
                              <input
                                type="number"
                                min="1"
                                max="5"
                                className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none"
                                value={testimonial.rating}
                                onChange={(e) => updateTestimonial(idx, { rating: Number(e.target.value) })}
                              />
                            </div>
                            <div className="space-y-2">
                              <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Date</label>
                              <input
                                type="date"
                                className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none"
                                value={testimonial.date}
                                onChange={(e) => updateTestimonial(idx, { date: e.target.value })}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-8 border-t border-slate-100">
                  <button 
                    type="submit"
                    className="px-10 py-4 bg-emerald-600 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-emerald-700 shadow-xl shadow-emerald-600/20 active:scale-95 transition-all"
                  >
                    Update Page Assets
                  </button>
                </div>
              </form>
            </div>
          ) : editingProperty ? (
            <div className="max-w-4xl mx-auto space-y-12">
              <form onSubmit={handleSave} className="space-y-6">
                <h3 className="text-2xl font-bold text-slate-900 mb-6">{isAdding ? 'Add New Property' : 'Edit Property'}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700">Property Title</label>
                    <input 
                      type="text" 
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none"
                      value={editingProperty.title}
                      onChange={(e) => setEditingProperty({ ...editingProperty, title: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700">Price (Ksh)</label>
                    <input 
                      type="number" 
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none"
                      value={editingProperty.price}
                      onChange={(e) => setEditingProperty({ ...editingProperty, price: Number(e.target.value) })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700">Location</label>
                    <input 
                      type="text" 
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none"
                      value={editingProperty.location}
                      onChange={(e) => setEditingProperty({ ...editingProperty, location: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700">Type</label>
                    <select 
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none"
                      value={editingProperty.type}
                      onChange={(e) => setEditingProperty({ ...editingProperty, type: e.target.value as 'rent' | 'sale' })}
                    >
                      <option value="rent">For Rent</option>
                      <option value="sale">For Sale</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700">Status</label>
                    <select 
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none"
                      value={editingProperty.status}
                      onChange={(e) => setEditingProperty({ ...editingProperty, status: e.target.value as any })}
                    >
                      <option value="Available">Available</option>
                      <option value="Under Offer">Under Offer</option>
                      <option value="Sold">Sold</option>
                      <option value="Rented">Rented</option>
                      <option value="Unavailable">Unavailable</option>
                    </select>
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <label className="text-sm font-bold text-slate-700">Tags (comma separated)</label>
                    <div className="relative">
                      <Tag size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input 
                        type="text" 
                        placeholder="luxury, modern, quiet"
                        className="w-full pl-12 pr-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none"
                        value={editingProperty.tags?.join(", ") || ""}
                        onChange={(e) => setEditingProperty({ ...editingProperty, tags: e.target.value.split(",").map(t => t.trim()).filter(t => t !== "") })}
                      />
                    </div>
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <label className="text-sm font-bold text-slate-700">Amenities (comma separated)</label>
                    <div className="relative">
                      <CheckCircle2 size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input 
                        type="text" 
                        placeholder="WiFi, Parking, Security, Balcony"
                        className="w-full pl-12 pr-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none"
                        value={editingProperty.amenities?.join(", ") || ""}
                        onChange={(e) => setEditingProperty({ ...editingProperty, amenities: e.target.value.split(",").map(t => t.trim()).filter(t => t !== "") })}
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700">Bedrooms</label>
                    <input 
                      type="number" 
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none"
                      value={editingProperty.bedrooms || 0}
                      onChange={(e) => setEditingProperty({ ...editingProperty, bedrooms: Number(e.target.value) })}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700">Bathrooms</label>
                    <input 
                      type="number" 
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none"
                      value={editingProperty.bathrooms || 0}
                      onChange={(e) => setEditingProperty({ ...editingProperty, bathrooms: Number(e.target.value) })}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700">Sq Ft / Plot Size</label>
                    <input 
                      type="text" 
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none"
                      value={editingProperty.sqft || editingProperty.plotSize || ""}
                      onChange={(e) => {
                        if (editingProperty.type === 'rent') {
                          setEditingProperty({ ...editingProperty, sqft: Number(e.target.value) });
                        } else {
                          setEditingProperty({ ...editingProperty, plotSize: e.target.value });
                        }
                      }}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700">Zoning / Category</label>
                    <input 
                      type="text" 
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none"
                      value={editingProperty.zoning || editingProperty.category || ""}
                      onChange={(e) => {
                        if (editingProperty.type === 'rent') {
                          setEditingProperty({ ...editingProperty, category: e.target.value });
                        } else {
                          setEditingProperty({ ...editingProperty, zoning: e.target.value });
                        }
                      }}
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700">Virtual Tour URL</label>
                    <div className="relative">
                      <Eye size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input 
                        type="url" 
                        placeholder="https://example.com/tour"
                        className="w-full pl-12 pr-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none"
                        value={editingProperty.virtualTourUrl || ""}
                        onChange={(e) => setEditingProperty({ ...editingProperty, virtualTourUrl: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700">Video Tour</label>
                    <div className="flex items-center gap-4">
                      <div className="flex-1 relative">
                        <Video size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input 
                          type="text" 
                          placeholder="YouTube/Vimeo URL or uploaded file"
                          className="w-full pl-12 pr-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none"
                          value={editingProperty.videoTourUrl?.startsWith('data:video/') ? "File Uploaded" : (editingProperty.videoTourUrl || "")}
                          onChange={(e) => setEditingProperty({ ...editingProperty, videoTourUrl: e.target.value })}
                        />
                      </div>
                      <label className="cursor-pointer bg-slate-100 p-3 rounded-xl hover:bg-slate-200 transition-all flex items-center gap-2">
                        <Plus size={16} className="text-slate-600" />
                        <span className="text-xs font-bold text-slate-600">Upload File</span>
                        <input 
                          type="file" 
                          className="hidden" 
                          accept="video/*"
                          onChange={(e) => handleFileUpload(e, 'video')}
                        />
                      </label>
                      {editingProperty.videoTourUrl && (
                        <button 
                          type="button"
                          onClick={() => setEditingProperty({ ...editingProperty, videoTourUrl: "" })}
                          className="p-3 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition-all"
                        >
                          <X size={16} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">Description</label>
                  <textarea 
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none h-32"
                    value={editingProperty.description}
                    onChange={(e) => setEditingProperty({ ...editingProperty, description: e.target.value })}
                    required
                  />
                </div>

                {/* Media Management */}
                <div className="space-y-4 pt-6 border-t border-slate-100">
                  <h4 className="text-lg font-bold text-slate-900">Media Assets</h4>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div className="relative group aspect-video rounded-xl overflow-hidden border-2 border-emerald-500">
                      <img src={editingProperty.img} alt="Primary" className="w-full h-full object-cover" />
                      <div className="absolute top-2 left-2 bg-emerald-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-lg">PRIMARY</div>
                    </div>
                    {editingProperty.images.map((img, idx) => (
                      <div key={idx} className="relative group aspect-video rounded-xl overflow-hidden border border-slate-200">
                        <img src={img} alt={`Property ${idx}`} className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1">
                          <button 
                            type="button"
                            onClick={() => moveImage(idx, 'left')}
                            disabled={idx === 0}
                            className="p-1.5 bg-white/20 text-white rounded-lg hover:bg-white/40 transition-all disabled:opacity-30"
                            title="Move Left"
                          >
                            <ChevronLeft size={14} />
                          </button>
                          <button 
                            type="button"
                            onClick={() => {
                              const oldPrimary = editingProperty.img;
                              const newImages = [...editingProperty.images];
                              newImages[idx] = oldPrimary;
                              setEditingProperty({ ...editingProperty, img: img, images: newImages });
                            }}
                            className="p-1.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-all"
                            title="Set as Primary"
                          >
                            <Check size={14} />
                          </button>
                          <button 
                            type="button"
                            onClick={() => moveImage(idx, 'right')}
                            disabled={idx === editingProperty.images.length - 1}
                            className="p-1.5 bg-white/20 text-white rounded-lg hover:bg-white/40 transition-all disabled:opacity-30"
                            title="Move Right"
                          >
                            <ChevronRight size={14} />
                          </button>
                          <button 
                            type="button"
                            onClick={() => removeImage(idx)}
                            className="p-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all"
                            title="Remove Image"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      </div>
                    ))}
                    <div className="aspect-video rounded-xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center p-4 text-center relative group hover:border-emerald-500 transition-colors">
                      <Camera size={24} className="text-slate-400 mb-2 group-hover:text-emerald-500" />
                      <p className="text-xs text-slate-500 group-hover:text-emerald-600">Upload Photos</p>
                      <input 
                        type="file" 
                        accept="image/*" 
                        multiple
                        onChange={(e) => handleFileUpload(e, 'image')}
                        className="absolute inset-0 opacity-0 cursor-pointer"
                      />
                    </div>
                    <div className="relative group aspect-video rounded-xl overflow-hidden border-2 border-dashed border-slate-200 flex flex-col items-center justify-center p-4 text-center hover:border-emerald-500 transition-colors">
                      <Video size={24} className="text-slate-400 mb-2" />
                      <p className="text-xs text-slate-500">Upload Video</p>
                      <input 
                        type="file" 
                        accept="video/*" 
                        onChange={(e) => handleFileUpload(e, 'video')}
                        className="absolute inset-0 opacity-0 cursor-pointer"
                      />
                    </div>
                    {editingProperty.videoTourUrl && editingProperty.videoTourUrl.startsWith('data:video') && (
                      <div className="relative group aspect-video rounded-xl overflow-hidden border-2 border-red-500">
                        <video src={editingProperty.videoTourUrl} className="w-full h-full object-cover" />
                        <div className="absolute top-2 left-2 bg-red-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-lg">VIDEO TOUR</div>
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <button 
                            type="button"
                            onClick={() => setEditingProperty({ ...editingProperty, videoTourUrl: "" })}
                            className="p-2 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-all"
                          >
                            <X size={16} />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <input 
                      type="url" 
                      placeholder="Paste image URL here..."
                      className="flex-1 px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none"
                      value={newImageUrl}
                      onChange={(e) => setNewImageUrl(e.target.value)}
                    />
                    <button 
                      type="button"
                      onClick={addImage}
                      className="bg-slate-900 text-white px-6 py-3 rounded-xl font-bold hover:bg-slate-800 transition-all"
                    >
                      Add
                    </button>
                  </div>
                </div>

                <div className="flex gap-4 pt-8">
                  <button type="submit" className="flex-1 bg-emerald-700 text-white py-4 rounded-2xl font-bold hover:bg-emerald-800 transition-all">
                    Save Changes
                  </button>
                  <button type="button" onClick={() => setEditingProperty(null)} className="flex-1 bg-slate-100 text-slate-700 py-4 rounded-2xl font-bold hover:bg-slate-200 transition-all">
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-100 pb-6 mb-6">
                <div>
                  <h3 className="text-xl font-bold text-slate-900">Property Listings ({adminFilteredProperties.length})</h3>
                  <p className="text-sm text-slate-500">Manage and coordinate all property details</p>
                </div>
                <button 
                  onClick={startAdd}
                  className="bg-emerald-700 text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2 hover:bg-emerald-800 transition-all shadow-lg shadow-emerald-700/20"
                >
                  <Plus size={20} /> Add Property
                </button>
              </div>

              {/* Filters & Search */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                <div className="md:col-span-2 relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input 
                    type="text" 
                    placeholder="Search by ID, Title, or Location..."
                    className="w-full pl-12 pr-4 py-3 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <div className="relative">
                  <Filter className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <select 
                    className="w-full pl-12 pr-4 py-3 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none appearance-none bg-white font-medium text-slate-700"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                  >
                    <option value="all">All Statuses</option>
                    <option value="Available">Available</option>
                    <option value="Under Offer">Under Offer</option>
                    <option value="Sold">Sold</option>
                    <option value="Rented">Rented</option>
                    <option value="Unavailable">Unavailable</option>
                  </select>
                </div>
                <div className="relative">
                  <Layout className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <select 
                    className="w-full pl-12 pr-4 py-3 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none appearance-none bg-white font-medium text-slate-700"
                    value={typeFilter}
                    onChange={(e) => setTypeFilter(e.target.value)}
                  >
                    <option value="all">All Types</option>
                    <option value="rent">Rent</option>
                    <option value="sale">Sale</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4">
                {adminFilteredProperties.map(p => (
                  <motion.div 
                    layout
                    key={p.id} 
                    className="group bg-white p-5 rounded-3xl border border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 hover:shadow-xl hover:shadow-slate-200/50 transition-all border-l-4 border-l-transparent hover:border-l-emerald-500"
                  >
                    <div className="flex items-center gap-6">
                      <div className="relative">
                        <img src={p.img} className="w-24 h-24 rounded-2xl object-cover shadow-md" alt={p.title} />
                        <span className={`absolute -top-2 -right-2 px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider shadow-lg ${
                          p.type === 'rent' ? 'bg-blue-600 text-white' : 'bg-red-600 text-white'
                        }`}>
                          {p.type}
                        </span>
                      </div>
                      <div>
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <h4 className="font-black text-slate-900 text-lg uppercase tracking-tight">{p.title}</h4>
                          <span className={`text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest ${
                            p.status === 'Available' ? 'bg-emerald-100 text-emerald-700' :
                            p.status === 'Sold' || p.status === 'Rented' ? 'bg-rose-100 text-rose-700' :
                            'bg-amber-100 text-amber-700'
                          }`}>
                            {p.status}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-slate-500 font-medium mb-2">
                          <MapPin size={14} className="text-emerald-600" />
                          {p.location}
                          <span className="w-1 h-1 rounded-full bg-slate-300 mx-1"></span>
                          <span className="text-slate-400 font-mono text-xs">{p.id}</span>
                        </div>
                        <div className="flex flex-wrap items-center gap-4">
                          <p className="text-emerald-700 font-black text-xl leading-none tracking-tight">Ksh {p.price.toLocaleString()}</p>
                          {p.tags && p.tags.length > 0 && (
                            <div className="flex gap-1">
                              {p.tags.slice(0, 3).map(tag => (
                                <span key={tag} className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-lg font-bold border border-slate-200">#{tag}</span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                      <button 
                        onClick={() => startEdit(p)} 
                        className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-3 bg-emerald-50 text-emerald-700 rounded-xl font-bold hover:bg-emerald-100 transition-all text-sm"
                      >
                        <Info size={16} />
                        Edit
                      </button>
                      {role === 'super-admin' && (
                        <button 
                          onClick={() => setDeleteConfirm(p.id)} 
                          className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-3 bg-rose-50 text-rose-700 rounded-xl font-bold hover:bg-rose-100 transition-all text-sm"
                        >
                          <X size={16} />
                          Delete
                        </button>
                      )}
                    </div>
                  </motion.div>
                ))}
                {adminFilteredProperties.length === 0 && (
                  <div className="text-center py-20 bg-slate-50 rounded-[3rem] border border-dashed border-slate-200">
                    <Search className="mx-auto text-slate-300 mb-4" size={48} />
                    <h4 className="text-xl font-bold text-slate-900 mb-1">No matching properties</h4>
                    <p className="text-slate-500">Try adjusting your filters or search term</p>
                    <button 
                      onClick={() => { setSearchTerm(""); setStatusFilter("all"); setTypeFilter("all"); }}
                      className="mt-6 text-emerald-600 font-bold hover:underline"
                    >
                      Clear all filters
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Delete Confirmation Overlay */}
        <AnimatePresence>
          {deleteConfirm && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-[110] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4"
            >
              <motion.div 
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-white p-8 rounded-[2rem] max-w-sm w-full text-center shadow-2xl"
              >
                <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <X size={32} />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">Delete Property?</h3>
                <p className="text-slate-500 mb-6">This action cannot be undone. Are you sure you want to remove this listing?</p>
                <div className="flex gap-3">
                  <button 
                    onClick={() => handleDelete(deleteConfirm)}
                    className="flex-1 bg-red-600 text-white py-3 rounded-xl font-bold hover:bg-red-700 transition-all"
                  >
                    Yes, Delete
                  </button>
                  <button 
                    onClick={() => setDeleteConfirm(null)}
                    className="flex-1 bg-slate-100 text-slate-700 py-3 rounded-xl font-bold hover:bg-slate-200 transition-all"
                  >
                    Cancel
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};


const Testimonials = ({ config }: { config: SiteConfig }) => {
  const [testimonials, setTestimonials] = useState<Testimonial[]>(config.testimonials);
  const [newTestimonial, setNewTestimonial] = useState({ name: "", content: "", role: "Client" });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simulate API call
    setTimeout(() => {
      const testimonial: Testimonial = {
        id: `T-${Date.now()}`,
        name: newTestimonial.name,
        role: newTestimonial.role,
        content: newTestimonial.content,
        photo: `https://picsum.photos/seed/${newTestimonial.name.replace(/\s+/g, '-').toLowerCase()}-${Date.now()}/200/200`,
        rating: 5,
        date: new Date().toISOString().split('T')[0]
      };
      
      setTestimonials([testimonial, ...testimonials]);
      setNewTestimonial({ name: "", content: "", role: "Client" });
      setIsSubmitting(false);
    }, 1000);
  };

  return (
    <SectionBackground imageUrl={config.sectionImages.testimonials} opacity={0.04} className="bg-slate-50">
      <section className="py-24 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-extrabold text-slate-900 mb-4">Client Testimonials</h2>
          <p className="text-slate-500 max-w-2xl mx-auto">Hear from our satisfied clients about their experiences with LPHASK Homes & Properties.</p>
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
                  <h4 className="font-bold text-slate-900">{t.name}</h4>
                  <p className="text-sm text-slate-500">{t.role}</p>
                </div>
              </div>
              <p className="text-slate-600 italic mb-6 leading-relaxed">"{t.content}"</p>
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
              <h3 className="text-3xl font-bold mb-4">Share Your Experience</h3>
              <p className="text-emerald-100/80">We value your feedback! Let us know how we've helped you find your perfect home or manage your property.</p>
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
    </SectionBackground>
  );
};

export default function App() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [comparisonList, setComparisonList] = useState<string[]>([]);
  const [userLocation, setUserLocation] = useState<{ lat: number, lng: number } | null>(null);
  const [showComparison, setShowComparison] = useState(false);
  const [selectedService, setSelectedService] = useState<string | undefined>(undefined);
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [properties, setProperties] = useState<Property[]>([]);
  const [viewingRequestProperty, setViewingRequestProperty] = useState<Property | null>(null);
  const [infoRequestProperty, setInfoRequestProperty] = useState<Property | null>(null);
  const [config, setConfig] = useState<SiteConfig>(INITIAL_CONFIG);
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);
  const [adminRole, setAdminRole] = useState<'super-admin' | 'content-manager'>('content-manager');
  const [authReady, setAuthReady] = useState(false);
  const [theme, setTheme] = useState<ThemeMode>(getInitialTheme);

  useEffect(() => {
    const root = document.documentElement;
    root.dataset.theme = theme;
    root.style.colorScheme = theme;
    safeSetLocalStorage(THEME_STORAGE_KEY, theme);
  }, [theme]);

  // --- Auth State Listener ---
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      try {
        if (user) {
          const token = await getIdTokenResult(user, true);
          const isVerifiedAdmin = Boolean(user.emailVerified && token.claims.admin === true);
          setIsAdminLoggedIn(isVerifiedAdmin);
          setAdminRole(isVerifiedAdmin ? 'super-admin' : 'content-manager');
        } else {
          setIsAdminLoggedIn(false);
          setAdminRole('content-manager');
        }
      } catch (error) {
        console.warn("Unable to determine admin status:", error);
        setIsAdminLoggedIn(false);
        setAdminRole('content-manager');
      } finally {
        setAuthReady(true);
      }
    });
    return () => unsubscribe();
  }, []);

  // --- Firestore Real-time Sync ---
  useEffect(() => {
    // Sync Config
    const configUnsubscribe = onSnapshot(doc(db, 'config', 'site'), (snapshot) => {
      if (snapshot.exists()) {
        setConfig({ ...INITIAL_CONFIG, ...snapshot.data() } as SiteConfig);
      }
    }, (error) => handleFirestoreError(error, OperationType.GET, 'config/site'));

    // Sync Properties
    const propertiesUnsubscribe = onSnapshot(collection(db, 'properties'), (snapshot) => {
      if (!snapshot.empty) {
        setProperties(snapshot.docs.map(doc => doc.data() as Property));
      }
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'properties'));

    return () => {
      configUnsubscribe();
      propertiesUnsubscribe();
    };
  }, []);

  // --- Auto-Seed Logic (Admin Only) ---
  useEffect(() => {
    const seedIfMissing = async () => {
      if (!isAdminLoggedIn || adminRole !== 'super-admin') return;

      try {
        // Only get from server for authoritative check
        const configSnap = await getDocFromServer(doc(db, 'config', 'site'));
        if (!configSnap.exists()) {
          console.log("Seeding initial config...");
          await setDoc(doc(db, 'config', 'site'), INITIAL_CONFIG);
        }

        const propSnap = await getDocs(collection(db, 'properties'));
        if (propSnap.empty) {
          console.log("Seeding initial properties...");
          for (const p of PROPERTIES) {
            await setDoc(doc(db, 'properties', p.id), p);
          }
        }
      } catch (err) {
        console.warn("Seeding failed (permissions or network):", err);
      }
    };

    seedIfMissing();
  }, [isAdminLoggedIn, adminRole]);

  // --- Handlers ---
  const handleUpdateProperties = async (newProperties: Property[]) => {
    // In a real app we'd identify changed/deleted docs, 
    // but for this MVP we handle bulk logic in AdminPanel or here
    // Let's implement individual doc updates when AdminPanel calls this
    setProperties(newProperties); 
  };

  const syncPropertyToFirestore = async (property: Property, isDelete: boolean = false) => {
    try {
      if (adminRole !== 'super-admin') {
        throw new Error('Unauthorized admin action.');
      }
      if (isDelete) {
        await deleteDoc(doc(db, 'properties', property.id));
      } else {
        await setDoc(doc(db, 'properties', property.id), property);
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `properties/${property.id}`);
    }
  };

  const syncConfigToFirestore = async (newConfig: SiteConfig) => {
    try {
      if (adminRole !== 'super-admin') {
        throw new Error('Unauthorized admin action.');
      }
      await setDoc(doc(db, 'config', 'site'), newConfig);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'config/site');
    }
  };

  const handleSelectService = (service: string) => {
    setSelectedService(service);
    const contactSection = document.getElementById('contact');
    if (contactSection) {
      contactSection.scrollIntoView({ behavior: 'smooth' });
    }
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

  useEffect(() => {
    const brandName = `${config.siteName} ${config.siteNameSecondary}`.trim();
    document.title = brandName;

    const descriptionMeta = document.querySelector('meta[name="description"]');
    if (descriptionMeta) {
      descriptionMeta.setAttribute("content", config.siteDescription);
    }

    let themeMeta = document.querySelector('meta[name="theme-color"]');
    if (!themeMeta) {
      themeMeta = document.createElement("meta");
      themeMeta.setAttribute("name", "theme-color");
      document.head.appendChild(themeMeta);
    }
    themeMeta.setAttribute("content", theme === 'dark' ? '#07111e' : config.brandThemeColor);
  }, [config.siteName, config.siteNameSecondary, config.siteDescription, config.brandThemeColor, theme]);

  const filteredProperties = useMemo(() => {
    if (!searchQuery.trim()) return properties;
    const q = searchQuery.toLowerCase();
    return properties.filter(p => 
      p.title.toLowerCase().includes(q) || 
      p.location.toLowerCase().includes(q) || 
      p.category.toLowerCase().includes(q) ||
      p.id.toLowerCase() === q ||
      p.tags?.some(tag => tag.toLowerCase().includes(q))
    );
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

  const activeProperty = useMemo(() => {
    if (!selectedProperty) return null;
    return properties.find(p => p.id === selectedProperty.id) || selectedProperty;
  }, [selectedProperty, properties]);

  if (!authReady) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <main className="min-h-screen">
      <SEOData config={config} />
      <Navbar
        onAdminClick={() => setIsAdminMode(true)}
        onSearch={setSearchQuery}
        config={config}
        theme={theme}
        onToggleTheme={() => setTheme(prev => prev === 'dark' ? 'light' : 'dark')}
      />
      <Hero onSearch={setSearchQuery} properties={properties} config={config} />
      <Services onSelectService={handleSelectService} config={config} />
      <RentalGuide config={config} />
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

      <AIChatBot properties={properties} config={config} />

      <ComparisonBar 
        count={comparisonList.length} 
        onExpand={() => setShowComparison(true)}
        onClear={() => setComparisonList([])}
      />

      {/* Overlays */}
      <AnimatePresence>
        {activeProperty && (
          <PropertyDetail 
            property={activeProperty} 
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

      <AnimatePresence>
        {isAdminMode && !isAdminLoggedIn && (
          <AdminLogin />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isAdminMode && isAdminLoggedIn && (
          <AdminPanel 
            properties={properties} 
            onSaveProperty={(p) => syncPropertyToFirestore(p)}
            onDeleteProperty={(p) => syncPropertyToFirestore(p, true)}
            onClose={() => {
              setIsAdminMode(false);
            }} 
            config={config}
            onSaveConfig={syncConfigToFirestore}
            role={adminRole}
          />
        )}
      </AnimatePresence>
    </main>
  );
}
