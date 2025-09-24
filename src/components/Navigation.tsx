import { Button } from "@/components/ui/button";
import { 
  Menu, 
  X, 
  Leaf, 
  BarChart3, 
  FileCheck, 
  Coins, 
  Settings,
  LogIn
} from "lucide-react";
import { useState } from "react";

const Navigation = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const navItems = [
    { name: "Dashboard", href: "#dashboard", icon: BarChart3 },
    { name: "Upload MRV", href: "#upload", icon: FileCheck },
    { name: "Tokens", href: "#tokens", icon: Coins },
    { name: "Governance", href: "#governance", icon: Settings },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-lg border-b border-white/20 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-gradient-hero rounded-lg shadow-environmental">
              <Leaf className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              CarbonChain
            </span>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <a
                  key={item.name}
                  href={item.href}
                  className="flex items-center space-x-2 text-foreground hover:text-primary transition-colors font-medium"
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.name}</span>
                </a>
              );
            })}
          </div>

          {/* Desktop Auth Buttons */}
          <div className="hidden md:flex items-center space-x-4">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => {
                // Add authentication logic here
                alert('Login functionality - connect to authentication system');
              }}
            >
              <LogIn className="w-4 h-4 mr-2" />
              Login
            </Button>
            <Button 
              variant="environmental" 
              size="sm"
              onClick={() => {
                document.getElementById('dashboard')?.scrollIntoView({ behavior: 'smooth' });
              }}
            >
              Get Started
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden border-t border-white/20 bg-white/90 backdrop-blur-lg">
            <div className="px-2 pt-2 pb-3 space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <a
                    key={item.name}
                    href={item.href}
                    className="flex items-center space-x-2 px-3 py-2 text-foreground hover:text-primary hover:bg-primary/5 rounded-md transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{item.name}</span>
                  </a>
                );
              })}
              <div className="px-3 py-2 space-y-2">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="w-full justify-start"
                  onClick={() => {
                    alert('Login functionality - connect to authentication system');
                    setIsMenuOpen(false);
                  }}
                >
                  <LogIn className="w-4 h-4 mr-2" />
                  Login
                </Button>
                <Button 
                  variant="environmental" 
                  size="sm" 
                  className="w-full"
                  onClick={() => {
                    document.getElementById('dashboard')?.scrollIntoView({ behavior: 'smooth' });
                    setIsMenuOpen(false);
                  }}
                >
                  Get Started
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navigation;