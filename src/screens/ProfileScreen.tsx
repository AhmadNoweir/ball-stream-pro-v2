import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { favouriteService } from "@/services/favouriteService";
import { motion } from "framer-motion";
import { LogOut, User, Mail, Star, X, Trophy } from "lucide-react";
import logo from "@/assets/logo.jpeg";

export default function ProfileScreen() {
  const { user, logout } = useAuth();
  const [favTeams, setFavTeams] = useState<string[]>([]);

  useEffect(() => {
    favouriteService.getFavourites().then(setFavTeams).catch(() => {});
  }, []);

  const removeFav = async (teamName: string) => {
    await favouriteService.removeFavourite(teamName);
    setFavTeams((prev) => prev.filter((t) => t !== teamName));
  };

  return (
    <div className="mx-auto max-w-3xl px-5 py-6">
      <h1 className="font-heading text-xl font-bold text-foreground mb-6">Profile</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Avatar */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="md:col-span-1">
          <div className="rounded-2xl bg-card p-6 text-center">
            <div className="relative inline-block mb-3">
              <img src={logo} alt="Avatar" className="h-16 w-16 rounded-2xl object-cover" />
              <div className="absolute -bottom-0.5 -right-0.5 h-4 w-4 rounded-full bg-live border-2 border-card" />
            </div>
            <h2 className="font-heading text-sm font-bold text-foreground">{user?.username}</h2>
            <p className="text-[11px] text-muted-foreground font-body mt-0.5">{user?.email}</p>
          </div>
        </motion.div>

        {/* Details */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }} className="md:col-span-2 space-y-4">
          {/* Account */}
          <div className="rounded-2xl bg-card p-5">
            <h3 className="text-xs font-body font-semibold text-muted-foreground uppercase tracking-wider mb-3">Account</h3>
            <div className="space-y-2">
              {[
                { icon: User, label: "Username", value: user?.username || "—" },
                { icon: Mail, label: "Email", value: user?.email || "—" },
              ].map((item) => (
                <div key={item.label} className="flex items-center gap-3 rounded-xl bg-secondary/50 p-3">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10">
                    <item.icon className="h-3.5 w-3.5 text-primary" />
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground font-body">{item.label}</p>
                    <p className="text-xs font-body font-medium text-foreground">{item.value}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Favourites */}
          <div className="rounded-2xl bg-card p-5">
            <div className="flex items-center gap-2 mb-3">
              <Star className="h-3.5 w-3.5 text-warning" />
              <h3 className="text-xs font-body font-semibold text-muted-foreground uppercase tracking-wider">Favourite Teams</h3>
              <span className="text-[10px] text-muted-foreground font-body">({favTeams.length})</span>
            </div>
            {favTeams.length === 0 ? (
              <div className="text-center py-5">
                <Trophy className="h-7 w-7 text-border mx-auto mb-1.5" />
                <p className="text-[11px] text-muted-foreground font-body">No favourites yet</p>
                <p className="text-[10px] text-muted-foreground/60 font-body">Star teams from the Matches page</p>
              </div>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {favTeams.map((team) => (
                  <div key={team} className="flex items-center gap-1.5 rounded-lg bg-warning/10 border border-warning/15 px-2.5 py-1">
                    <Star className="h-2.5 w-2.5 fill-warning text-warning" />
                    <span className="text-[11px] font-body font-medium text-foreground">{team}</span>
                    <button onClick={() => removeFav(team)} className="text-muted-foreground hover:text-destructive transition-colors">
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Logout */}
          <button
            onClick={logout}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-destructive/5 border border-destructive/15 py-3 text-xs font-body font-semibold text-destructive hover:bg-destructive/10 transition-colors"
          >
            <LogOut className="h-3.5 w-3.5" />
            Logout
          </button>
        </motion.div>
      </div>
    </div>
  );
}
