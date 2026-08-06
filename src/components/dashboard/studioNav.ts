import {
  BarChart3,
  Calendar,
  ClipboardList,
  DollarSign,
  Package,
  PieChart,
  Send,
  Settings,
  Share2,
  Users,
} from "lucide-react";
import { type ForwardRefExoticComponent, type RefAttributes, type SVGProps } from "react";

type LucideIcon = ForwardRefExoticComponent<SVGProps<SVGSVGElement> & RefAttributes<SVGSVGElement>>;

export interface StudioNavItem {
  id: string;
  label: string;
  icon: LucideIcon;
  href: string;
}

export const studioItems: StudioNavItem[] = [
  { id: "overview", label: "Overview", icon: BarChart3, href: "/dashboard/studio" },
  { id: "bookings", label: "Bookings", icon: ClipboardList, href: "/dashboard/studio/bookings" },
  { id: "services", label: "Services", icon: Package, href: "/dashboard/studio/services" },
  { id: "quotes", label: "Quotes", icon: Send, href: "/dashboard/studio/quotes" },
  { id: "calendar", label: "Calendar", icon: Calendar, href: "/dashboard/studio/calendar" },
  { id: "staff", label: "Staff", icon: Users, href: "/dashboard/studio/staff" },
  { id: "finance", label: "Finance", icon: DollarSign, href: "/dashboard/studio/finance" },
  { id: "analytics", label: "Analytics", icon: PieChart, href: "/dashboard/studio/analytics" },
  { id: "inventory", label: "Inventory", icon: Package, href: "/dashboard/studio/inventory" },
  { id: "edit", label: "Edit Profile", icon: Settings, href: "/dashboard/studio/edit" },
  { id: "share", label: "Share & Refer", icon: Share2, href: "/dashboard/studio/share" },
];
