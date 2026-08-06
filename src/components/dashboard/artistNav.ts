import {
  User,
  Image,
  Calendar,
  Send,
  Tag,
  Wallet,
  Package,
  Percent,
  FileText,
  BarChart3,
  Settings,
  Lock,
} from "lucide-react";
import type { ForwardRefExoticComponent, RefAttributes, SVGProps } from "react";

type LucideIcon = ForwardRefExoticComponent<SVGProps<SVGSVGElement> & RefAttributes<SVGSVGElement>>;

export interface ArtistNavItem {
  id: string;
  label: string;
  icon: LucideIcon;
  href: string;
}

export const artistItems: ArtistNavItem[] = [
  { id: "overview", label: "Overview", icon: BarChart3, href: "/dashboard/artist" },
  { id: "profile", label: "Profile", icon: User, href: "/dashboard/artist" },
  { id: "portfolio", label: "Portfolio", icon: Image, href: "/dashboard/artist" },
  { id: "bookings", label: "Bookings", icon: Calendar, href: "/dashboard/artist" },
  { id: "quotes", label: "Quotes", icon: Send, href: "/dashboard/artist" },
  { id: "prices", label: "Prices", icon: Tag, href: "/dashboard/artist" },
  { id: "packages", label: "Packages", icon: Package, href: "/dashboard/artist" },
  { id: "pricing", label: "Pricing Rules", icon: Percent, href: "/dashboard/artist" },
  { id: "payouts", label: "Payouts", icon: Wallet, href: "/dashboard/artist" },
  { id: "availability", label: "Availability", icon: Calendar, href: "/dashboard/artist" },
  { id: "analytics", label: "Analytics", icon: BarChart3, href: "/dashboard/artist" },
  { id: "account", label: "Account", icon: Lock, href: "/dashboard/artist" },
];
