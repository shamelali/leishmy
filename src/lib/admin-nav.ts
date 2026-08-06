import {
  BarChart3,
  Users,
  Shield,
  Image as ImageIcon,
  BookOpen,
  CreditCard,
  AlertTriangle,
  TrendingUp,
  Settings,
} from "lucide-react";
import { type ForwardRefExoticComponent, type RefAttributes, type SVGProps } from "react";

type LucideIcon = ForwardRefExoticComponent<SVGProps<SVGSVGElement> & RefAttributes<SVGSVGElement>>;

export interface AdminNavItem {
  id: string;
  label: string;
  icon: LucideIcon;
  href: string;
  badge?: number;
}

export const adminNavItems: AdminNavItem[] = [
  { id: "overview", label: "Overview", icon: BarChart3, href: "/dashboard/admin" },
  { id: "users", label: "Users", icon: Users, href: "/dashboard/admin/users" },
  { id: "verification", label: "Verification", icon: Shield, href: "/dashboard/admin/verification" },
  { id: "content", label: "Content", icon: ImageIcon, href: "/dashboard/admin/content" },
  { id: "bookings", label: "Bookings", icon: BookOpen, href: "/dashboard/admin/bookings" },
  { id: "payments", label: "Payments", icon: CreditCard, href: "/dashboard/admin/payments" },
  { id: "disputes", label: "Disputes", icon: AlertTriangle, href: "/dashboard/admin/disputes" },
  { id: "analytics", label: "Analytics", icon: TrendingUp, href: "/dashboard/admin/analytics" },
  { id: "settings", label: "Settings", icon: Settings, href: "/dashboard/admin/settings" },
];
