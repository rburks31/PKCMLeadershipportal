import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Church, Menu, User } from "lucide-react";
import { Link } from "wouter";

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Navigation */}
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Link href="/">
                <div className="flex items-center space-x-2 cursor-pointer" data-testid="link-home">
                  <Church className="text-pastoral-blue text-2xl" />
                  <span className="text-xl font-bold text-gray-900">PKCM Leadership and Ministry Class</span>
                </div>
              </Link>
            </div>
            <div className="hidden md:flex items-center space-x-6">
              <Link href="/">
                <a className="text-gray-700 hover:text-pastoral-blue transition-colors" data-testid="link-my-courses">
                  My Courses
                </a>
              </Link>
              <Link href="/">
                <a className="text-gray-700 hover:text-pastoral-blue transition-colors" data-testid="link-browse">
                  Browse
                </a>
              </Link>
              <div className="relative">
                <div className="flex items-center space-x-2 text-gray-700">
                  <img 
                    src={user?.profileImageUrl || "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=32&h=32&fit=crop&crop=face"} 
                    alt="User avatar" 
                    className="w-8 h-8 rounded-full" 
                  />
                  <span data-testid="text-user-name">{user?.firstName || "Student"}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => window.location.href = "/api/logout"}
                    data-testid="button-logout"
                  >
                    Logout
                  </Button>
                </div>
              </div>
            </div>
            <button className="md:hidden text-gray-700" data-testid="button-mobile-menu">
              <Menu className="text-xl" />
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main>{children}</main>
    </div>
  );
}
