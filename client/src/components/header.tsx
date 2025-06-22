import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { Link, useLocation } from "wouter";
import { Bell, Leaf } from "lucide-react";

export default function Header() {
  const { user, isAuthenticated } = useAuth();
  const [location] = useLocation();

  const handleLogin = () => {
    window.location.href = "/api/login";
  };

  const handleLogout = () => {
    window.location.href = "/api/logout";
  };

  const navigation = [
    { name: "Dashboard", href: "/", current: location === "/" },
    { name: "Upload", href: "/upload", current: location === "/upload" },
    { name: "Recipes", href: "/recipes", current: location === "/recipes" },
    { name: "Meal Plan", href: "/meal-plan", current: location === "/meal-plan" },
  ];

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 health-gradient rounded-lg flex items-center justify-center">
              <Leaf className="text-white text-sm" />
            </div>
            <h1 className="text-xl font-bold text-gray-900">NutriFix</h1>
          </div>
          
          {/* Desktop Navigation */}
          {isAuthenticated && (
            <nav className="hidden md:flex space-x-8">
              {navigation.map((item) => (
                <Link key={item.name} href={item.href}>
                  <a
                    className={`${
                      item.current
                        ? "text-primary font-medium border-b-2 border-primary"
                        : "text-gray-500 hover:text-gray-700"
                    } pb-4 transition-colors`}
                  >
                    {item.name}
                  </a>
                </Link>
              ))}
            </nav>
          )}

          {/* User Menu */}
          <div className="flex items-center space-x-4">
            {isAuthenticated ? (
              <>
                <Button variant="ghost" size="sm" className="p-2">
                  <Bell className="h-5 w-5" />
                </Button>
                <Button
                  variant="ghost"
                  onClick={handleLogout}
                >
                  Logout
                </Button>
              </>
            ) : (
              <Button
                onClick={handleLogin}
              >
                Login
              </Button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
