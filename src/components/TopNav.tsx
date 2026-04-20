import { useEffect, useState } from "react";
import { NavLink } from "react-router-dom";
import { Home, Trophy, MessageCircle, Bot, User, Sun, Moon, LogOut } from "lucide-react";
import { useTheme } from "@/context/ThemeContext";
import { useAuth } from "@/context/AuthContext";
import { chatService } from "@/services/chatService";
import logo from "@/assets/logo.jpeg";

const navItems = [
  { to: "/", icon: Home, label: "Home" },
  { to: "/matches", icon: Trophy, label: "Matches" },
  { to: "/chat", icon: MessageCircle, label: "Chat" },
  { to: "/ai", icon: Bot, label: "AI" },
  { to: "/profile", icon: User, label: "Profile" },
];

export function TopNav() {
  const { theme, toggleTheme } = useTheme();
  const { user, logout } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const fetchUnread = () => {
      chatService.getUnreadCount().then(setUnreadCount).catch(() => {});
    };
    fetchUnread();
    const interval = setInterval(fetchUnread, 15000);
    window.addEventListener("chat:read", fetchUnread);
    return () => {
      clearInterval(interval);
      window.removeEventListener("chat:read", fetchUnread);
    };
  }, []);

  return (
    <header className="sticky top-0 z-50 bg-card/80 backdrop-blur-xl border-b border-border/60">
      <div className="mx-auto max-w-7xl flex items-center justify-between px-5 h-14">
        {/* Logo */}
        <NavLink to="/" className="flex items-center gap-2.5">
          <img src={logo} alt="Ball Stream Pro" className="h-8 w-8 rounded-lg object-cover" />
          <span className="font-heading text-xs font-bold text-gradient hidden sm:inline tracking-wide">BALL STREAM PRO</span>
        </NavLink>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-0.5">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/"}
              className={({ isActive }) =>
                `relative flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[13px] font-body font-medium transition-all ${
                  isActive
                    ? "text-primary bg-primary/8"
                    : "text-muted-foreground hover:text-foreground"
                }`
              }
            >
              <item.icon className="h-4 w-4" />
              {item.label}
              {item.to === "/chat" && unreadCount > 0 && (
                <span className="flex h-4 min-w-[16px] items-center justify-center rounded-full bg-live px-1 text-[9px] font-bold text-white">
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Right */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={toggleTheme}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:text-foreground transition-colors"
          >
            {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>

          {user && (
            <>
              <div className="hidden sm:flex items-center gap-2 rounded-lg bg-secondary/60 px-2.5 py-1 ml-1">
                <div className="h-5 w-5 rounded-full gradient-primary flex items-center justify-center">
                  <span className="text-[8px] font-heading font-bold text-primary-foreground">{user.username[0]}</span>
                </div>
                <span className="text-xs font-body font-medium text-foreground">{user.username}</span>
              </div>
              <button
                onClick={logout}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:text-destructive transition-colors"
              >
                <LogOut className="h-3.5 w-3.5" />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Mobile nav */}
      <nav className="md:hidden flex items-center justify-around border-t border-border/60 px-1 py-1">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === "/"}
            className={({ isActive }) =>
              `relative flex flex-col items-center gap-0.5 px-3 py-1 rounded-lg text-[9px] font-body font-medium transition-colors ${
                isActive ? "text-primary" : "text-muted-foreground"
              }`
            }
          >
            <div className="relative">
              <item.icon className="h-4 w-4" />
              {item.to === "/chat" && unreadCount > 0 && (
                <span className="absolute -top-1 -right-2 flex h-3 min-w-[12px] items-center justify-center rounded-full bg-live px-0.5 text-[7px] font-bold text-white">
                  {unreadCount > 99 ? "+" : unreadCount}
                </span>
              )}
            </div>
            {item.label}
          </NavLink>
        ))}
      </nav>
    </header>
  );
}
