import { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import logoImage from "@assets/SEVEN WEAPONS OF THE WEAPON_1755651386501.jpg";
import { 
  Home, 
  BookOpen, 
  Settings, 
  LogOut, 
  User,
  Shield,
  Video
} from "lucide-react";

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const { user, isAuthenticated } = useAuth();
  const [location] = useLocation();

  if (!isAuthenticated) {
    return <div>{children}</div>;
  }

  const isAdmin = (user as any)?.role === 'admin';

  const navigation = [
    { name: "Home", href: "/", icon: Home, current: location === "/" },
    { name: "Courses", href: "/courses", icon: BookOpen, current: location.startsWith("/courses") },
    { name: "Live Classes", href: "/live-classes", icon: Video, current: location === "/live-classes" },
    ...(isAdmin ? [{ name: "Admin Portal", href: "/admin", icon: Shield, current: location === "/admin" }] : []),
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation Header */}
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              {/* Logo */}
              <div className="flex-shrink-0 flex items-center">
                <Link href="/">
                  <div className="flex items-center space-x-3" data-testid="link-logo">
                    <img 
                      src={logoImage} 
                      alt="PKCM Logo" 
                      className="h-10 w-auto pkcm-logo"
                    />
                    <div className="text-xl font-bold text-pastoral-primary">
                      PKCM Leadership
                    </div>
                  </div>
                </Link>
              </div>

              {/* Navigation Links */}
              <div className="hidden sm:ml-8 sm:flex sm:space-x-8">
                {navigation.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link key={item.name} href={item.href}>
                      <button
                        className={`${
                          item.current
                            ? "border-pastoral-primary text-pastoral-primary"
                            : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                        } whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2`}
                        data-testid={`link-nav-${item.name.toLowerCase().replace(' ', '-')}`}
                      >
                        <Icon className="w-4 h-4" />
                        <span>{item.name}</span>
                      </button>
                    </Link>
                  );
                })}
              </div>
            </div>

            {/* User Menu */}
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <User className="w-4 h-4 text-gray-500" />
                <span className="text-sm text-gray-700">
                  {(user as any)?.firstName} {(user as any)?.lastName}
                </span>
                {isAdmin && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                    Admin
                  </span>
                )}
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => window.location.href = "/api/logout"}
                data-testid="button-logout"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        <div className="sm:hidden">
          <div className="pt-2 pb-3 space-y-1">
            {navigation.map((item) => {
              const Icon = item.icon;
              return (
                <Link key={item.name} href={item.href}>
                  <button
                    className={`${
                      item.current
                        ? "bg-pastoral-primary bg-opacity-10 border-pastoral-primary text-pastoral-primary"
                        : "border-transparent text-gray-600 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-800"
                    } block pl-3 pr-4 py-2 border-l-4 text-base font-medium w-full text-left flex items-center space-x-3`}
                    data-testid={`link-nav-mobile-${item.name.toLowerCase().replace(' ', '-')}`}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{item.name}</span>
                  </button>
                </Link>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t">
        <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8">
          <p className="text-center text-sm text-gray-500">
            © 2025 Promise Kingdom Community Ministries. Empowering every follower of Jesus to grow in faith and multiply kingdom impact.
          </p>
        </div>
      </footer>
    </div>
  );
}