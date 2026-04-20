import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, Lock, User, Eye, EyeOff, Loader2, Sun, Moon, ArrowRight } from "lucide-react";
import { useTheme } from "@/context/ThemeContext";
import logo from "@/assets/logo.jpeg";

export default function AuthScreen() {
  const { login, register, isLoading } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email || password.length < 6) {
      setError("Please enter a valid email and password (min 6 chars).");
      return;
    }

    const err = isLogin
      ? await login(email, password)
      : await register(username, email, password);
    if (err) setError(err);
  };

  return (
    <div className="relative flex min-h-screen">
      {/* Left side - branding */}
      <div className="hidden lg:flex lg:w-1/2 gradient-primary relative items-center justify-center">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,rgba(255,255,255,0.1),transparent_60%)]" />
        <div className="relative z-10 text-center px-12">
          <img src={logo} alt="Ball Stream Pro" className="h-28 w-28 rounded-3xl object-cover mx-auto mb-6 shadow-2xl" />
          <h1 className="font-heading text-3xl font-bold text-primary-foreground mb-3">Ball Stream Pro</h1>
          <p className="text-primary-foreground/70 font-body text-lg max-w-sm mx-auto">
            Live scores, AI insights, and fan chat — your ultimate football companion.
          </p>
        </div>
        <div className="absolute -left-10 -bottom-10 h-60 w-60 rounded-full bg-white/5 blur-3xl" />
        <div className="absolute right-10 top-10 h-32 w-32 rounded-full bg-white/5 blur-2xl" />
      </div>

      {/* Right side - form */}
      <div className="flex-1 flex flex-col items-center justify-center bg-background px-6 relative">
        <button
          onClick={toggleTheme}
          className="absolute top-4 right-4 flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          aria-label="Toggle theme"
        >
          {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </button>

        {/* Mobile logo */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8 flex flex-col items-center lg:hidden">
          <img src={logo} alt="Ball Stream Pro" className="h-20 w-20 rounded-2xl object-cover glow-primary mb-4" />
          <h1 className="font-heading text-2xl font-bold text-gradient">Ball Stream Pro</h1>
        </motion.div>

        {/* Desktop heading */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="hidden lg:block mb-8 text-center">
          <h2 className="font-heading text-2xl font-bold text-foreground mb-1">
            {isLogin ? "Welcome back" : "Create account"}
          </h2>
          <p className="text-sm text-muted-foreground font-body">
            {isLogin ? "Sign in to continue to your dashboard" : "Join the football community"}
          </p>
        </motion.div>

        <motion.form
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          onSubmit={handleSubmit}
          className="w-full max-w-sm space-y-4"
        >
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="rounded-xl bg-destructive/10 border border-destructive/20 p-3.5 text-sm text-destructive font-body"
              >
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {!isLogin && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full rounded-xl border border-border bg-card pl-10 pr-4 py-3.5 text-sm text-foreground font-body placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="relative">
            <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl border border-border bg-card pl-10 pr-4 py-3.5 text-sm text-foreground font-body placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
            />
          </div>

          <div className="relative">
            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type={showPw ? "text" : "password"}
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl border border-border bg-card pl-10 pr-10 py-3.5 text-sm text-foreground font-body placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
            />
            <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
              {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full rounded-xl gradient-primary py-3.5 font-body text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/20 hover:shadow-primary/30 hover:opacity-95 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
            {isLogin ? "Sign In" : "Create Account"}
          </button>

          <p className="text-center text-sm text-muted-foreground font-body pt-2">
            {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
            <button type="button" onClick={() => { setIsLogin(!isLogin); setError(null); }} className="text-primary hover:underline font-semibold">
              {isLogin ? "Sign Up" : "Sign In"}
            </button>
          </p>
        </motion.form>
      </div>
    </div>
  );
}
