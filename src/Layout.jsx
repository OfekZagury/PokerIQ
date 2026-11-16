import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { UserService as User } from "@/services/user" ;
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Spade, Heart, Diamond, Club, LogOut } from "lucide-react";

export default function Layout({ children }) {
  const location = useLocation();
  const [user, setUser] = useState(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const currentUser = await User.me();
        setUser(currentUser);
      } catch (error) {
        setUser(null);
      }
    };
    fetchUser();
  }, [location.pathname]); // Re-check user on page navigation

  const handleLogout = async () => {
    await User.logout();
    window.location.reload(); // Reload the page to reset state and redirect to home
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-green-950 to-black">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Lato:wght@400;700&family=Playfair+Display:wght@700;900&display=swap');
        
        body {
            font-family: 'Lato', sans-serif;
        }

        .font-heading {
            font-family: 'Playfair Display', serif;
        }
      `}</style>

      {/* Poker felt texture overlay */}
      <div
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage: `
            radial-gradient(circle at 1px 1px, rgba(255,255,255,0.15) 1px, transparent 0),
            linear-gradient(45deg, rgba(0,0,0,0.1) 25%, transparent 25%),
            linear-gradient(-45deg, rgba(0,0,0,0.1) 25%, transparent 25%)
          `,
          backgroundSize: '20px 20px, 40px 40px, 40px 40px'
        }}
      />

      <div className="relative z-10 flex flex-col min-h-screen">
        {/* Header */}
        <header className="bg-black/20 backdrop-blur-md border-b border-green-700/30">
          <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
            <Link to={createPageUrl("Home")} className="flex items-center gap-3 group">
              <div className="relative">
                <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-full flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform duration-200">
                  <Spade className="w-6 h-6 text-black" />
                </div>
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
                  <Heart className="w-2 h-2 text-white" />
                </div>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white font-heading">Poker IQ</h1>
                <p className="text-sm text-green-300">Master poker through daily challenges</p>
              </div>
            </Link>

            {user && (
              <div className="flex items-center gap-4">
                <span className="text-white text-sm hidden md:block">
                  Welcome, {user.full_name || user.email}
                </span>
                <Button
                  onClick={handleLogout}
                  variant="outline"
                  size="sm"
                  className="border-red-500/50 text-red-300 hover:bg-red-500/20 hover:text-red-200 hover:border-red-500/70"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Logout
                </Button>
              </div>
            )}

            {!user && (
              <div className="flex items-center gap-4">
                <a
                  href="/login"
                  className="rounded-full border border-yellow-500/60 bg-yellow-500/20 px-4 py-2 text-yellow-200 hover:bg-yellow-500/30"
                >
                  Login
                </a>
              </div>
            )}
          </div>
        </header>

        {/* Main content */}
        <main className="flex-1 relative">
          {children}
        </main>

        {/* Footer with card suits decoration */}
        <footer className="bg-black/30 backdrop-blur-md border-t border-green-700/30 mt-auto">
          <div className="max-w-6xl mx-auto px-4 py-6">
            <div className="flex items-center justify-center gap-4 text-green-300">
              <Spade className="w-5 h-5 text-black bg-white rounded-full p-1" />
              <Heart className="w-5 h-5 text-red-500 bg-white rounded-full p-1" />
              <Diamond className="w-5 h-5 text-red-500 bg-white rounded-full p-1" />
              <Club className="w-5 h-5 text-black bg-white rounded-full p-1" />
            </div>
            <p className="text-center text-sm text-green-400 mt-2">
              © 2025 Poker IQ - Learn, Practice, Master
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
}