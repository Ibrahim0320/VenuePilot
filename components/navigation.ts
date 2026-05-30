import {
  BarChart3,
  CheckCheck,
  Database,
  LayoutDashboard,
  MessageSquareText,
  Settings,
  Sparkles,
  TrendingUp
} from "lucide-react";

export const navigation = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/data", label: "Data", icon: Database },
  { href: "/forecast", label: "Forecast", icon: TrendingUp },
  { href: "/briefing", label: "Briefing", icon: Sparkles },
  { href: "/copilot", label: "Copilot", icon: MessageSquareText },
  { href: "/approvals", label: "Approvals", icon: CheckCheck },
  { href: "/settings", label: "Settings", icon: Settings },
  { href: "/", label: "Landing", icon: BarChart3 }
];
