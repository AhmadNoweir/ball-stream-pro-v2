import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { ThemeProvider } from "@/context/ThemeContext";
import { TopNav } from "@/components/TopNav";
import AuthScreen from "@/screens/AuthScreen";
import HomeScreen from "@/screens/HomeScreen";
import MatchScreen from "@/screens/MatchScreen";
import ChatScreen from "@/screens/ChatScreen";
import AIScreen from "@/screens/AIScreen";
import ProfileScreen from "@/screens/ProfileScreen";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function AppRoutes() {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) return <AuthScreen />;

  return (
    <div className="min-h-screen bg-background">
      <TopNav />
      <main>
        <Routes>
          <Route path="/" element={<HomeScreen />} />
          <Route path="/matches" element={<MatchScreen />} />
          <Route path="/chat" element={<ChatScreen />} />
          <Route path="/ai" element={<AIScreen />} />
          <Route path="/profile" element={<ProfileScreen />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
    </div>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Sonner />
      <ThemeProvider>
        <AuthProvider>
          <BrowserRouter>
            <AppRoutes />
          </BrowserRouter>
        </AuthProvider>
      </ThemeProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
