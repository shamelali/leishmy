import {
  BarChart3,
  Calendar,
  DollarSign,
  Package,
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
  { id: "quotes", label: "Quotes", icon: Send, href: "/dashboard/studio/quotes" },
  { id: "calendar", label: "Calendar", icon: Calendar, href: "/dashboard/studio/calendar" },
  { id: "staff", label: "Staff", icon: Users, href: "/dashboard/studio/staff" },
  { id: "finance", label: "Finance", icon: DollarSign, href: "/dashboard/studio/finance" },
  { id: "inventory", label: "Inventory", icon: Package, href: "/dashboard/studio/inventory" },
  { id: "edit", label: "Edit Profile", icon: Settings, href: "/dashboard/studio/edit" },
  { id: "share", label: "Share & Refer", icon: Share2, href: "/dashboard/studio/share" },
];
