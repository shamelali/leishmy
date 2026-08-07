import {
  User,
  Image,
  Calendar,
  Send,
  Tag,
  Wallet,
  Package,
  Percent,
  BarChart3,
  Lock,
} from "lucide-react";
import type { ForwardRefExoticComponent, RefAttributes, SVGProps } from "react";

type LucideIcon = ForwardRefExoticComponent<SVGProps<SVGSVGElement> & RefAttributes<SVGSVGElement>>;

export interface ArtistNavItem {
  id: string;
  label: string;
  icon: LucideIcon;
  href?: string;
}

export const artistItems: ArtistNavItem[] = [
  { id: "profile", label: "Profile", icon: User },
  { id: "portfolio", label: "Portfolio", icon: Image },
  { id: "bookings", label: "Bookings", icon: Calendar },
  { id: "quotes", label: "Quotes", icon: Send },
  { id: "prices", label: "Prices", icon: Tag },
  { id: "packages", label: "Packages", icon: Package },
  { id: "pricing", label: "Pricing Rules", icon: Percent },
  { id: "payouts", label: "Payouts", icon: Wallet },
  { id: "availability", label: "Availability", icon: Calendar },
  { id: "analytics", label: "Analytics", icon: BarChart3 },
  { id: "account", label: "Account", icon: Lock },
];
