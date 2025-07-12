import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { Bell, Leaf, Menu, X } from "lucide-react";
import { useState } from "react";
import { redirectToLogin, redirectToLogout } from "@/lib/auth";

export default function Navigation() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { user, isAuthenticated } = useAuth();
  const [location] = useLocation();

  const navigation = [
    { name: "Dashboard", href: "/", current: location === "/" },
    { name: "Upload", href: "/upload", current: location === "/upload" },
    { name: "Results", href: "/blood-test-results", current: location === "/blood-test-results" },
    { name: "Foods", href: "/food-recommendations", current: location === "/food-recommendations" },
    { name: "Recipes", href: "/recipes", current: location === "/recipes" },
    { name: "Meal Plan", href: "/meal-plan", current: location === "/meal-plan" },
  ];

  const handleLogin = () => {
    redirectToLogin();
  };

  const handleLogout = () => {
    redirectToLogout();
  };

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <div className="w-8 h-8 health-gradient rounded-lg flex items-center justify-center">
                <Leaf className="text-white text-sm" />
              </div>
              <span className="ml-2 text-xl font-bold">NutriFix</span>
            </div>
            
            {/* Desktop navigation */}
            {isAuthenticated && (
              <div className="hidden sm:ml-8 sm:flex sm:space-x-2">
                {navigation.map((item) => (
                  <Link key={item.name} href={item.href}>
                    <Button
                      variant={item.current ? "default" : "ghost"}
                      size="lg"
                      className={`${
                        item.current
                          ? "bg-primary-50 text-primary-700 hover:bg-primary-100 border-b-2 border-primary-500"
                          : "text-gray-600 hover:text-primary-600 hover:bg-primary-50"
                      } rounded-none relative font-medium`}
                    >
                      {item.name}
                    </Button>
                  </Link>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center space-x-2">
            {isAuthenticated ? (
              <>
                <Button variant="ghost" size="icon" className="text-gray-600 hover:text-primary-600">
                  <Bell className="h-5 w-5" />
                </Button>
                <Button 
                  onClick={handleLogout} 
                  variant="outline"
                  className="font-medium"
                >
                  Sign Out
                </Button>
              </>
            ) : (
              <Button 
                onClick={handleLogin} 
                className="bg-primary-500 hover:bg-primary-600 text-white font-medium"
              >
                Sign In
              </Button>
            )}

            {/* Mobile menu button */}
            <div className="sm:hidden">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="text-gray-600"
              >
                {isMobileMenuOpen ? (
                  <X className="h-6 w-6" />
                ) : (
                  <Menu className="h-6 w-6" />
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        {isMobileMenuOpen && (
          <div className="sm:hidden py-2">
            {navigation.map((item) => (
              <Link key={item.name} href={item.href}>
                <Button
                  variant={item.current ? "default" : "ghost"}
                  className={`${
                    item.current
                      ? "bg-primary-50 text-primary-700"
                      : "text-gray-600"
                  } w-full justify-start rounded-none py-2 font-medium`}
                >
                  {item.name}
                </Button>
              </Link>
            ))}
          </div>
        )}
      </div>
    </nav>
  );
}
