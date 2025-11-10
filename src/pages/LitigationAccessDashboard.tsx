import { SidebarProvider } from "@/components/ui/sidebar";
import LitigationAccessSidebar from "@/components/LitigationAccessSidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Clock, CheckCircle2, AlertCircle, TrendingUp, LogOut, Upload, Menu, LayoutDashboard, Scale } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import toast from "react-hot-toast";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useIsMobile } from "@/hooks/use-mobile";
const LitigationAccessDashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const username = localStorage.getItem('litigationAccessUsername') || 'User';
  const [isLogoutDialogOpen, setIsLogoutDialogOpen] = useState(false);
  const [applicationsCount, setApplicationsCount] = useState<number>(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const isMobile = useIsMobile();
  
  useEffect(() => {
    window.scrollTo(0, 0);
    fetchApplicationsCount();
  }, []);

  const fetchApplicationsCount = async () => {
    try {
      const storedUsername = localStorage.getItem('litigationAccessUsername');
      
      if (!storedUsername) {
        return;
      }

      // First, get all litigation case IDs visible to this user
      const { data: visibilityData, error: visibilityError } = await (supabase as any)
        .from('litigation_case_visibility')
        .select('litigation_case_id')
        .eq('litigation_access_username', storedUsername);

      if (visibilityError) {
        console.error('Error fetching visibility:', visibilityError);
        return;
      }

      const visibleCaseIds = visibilityData?.map((v: any) => v.litigation_case_id) || [];
      setApplicationsCount(visibleCaseIds.length);
    } catch (error) {
      console.error('Error fetching applications count:', error);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('litigationAccessLogin');
    localStorage.removeItem('litigationAccessId');
    localStorage.removeItem('litigationAccessUsername');
    navigate('/bank-login');
  };
  const stats = [{
    title: "Applications Submitted",
    value: applicationsCount.toString(),
    description: "Total applications submitted",
    icon: Upload,
    iconColor: "text-blue-600",
    bgColor: "bg-blue-50"
  }];
  const recentNotifications = [{
    title: "New query from advocate on case #LA-2024-001",
    time: "2 hours ago",
    type: "query"
  }, {
    title: "Application #LA-2024-003 has been approved",
    time: "1 day ago",
    type: "success"
  }, {
    title: "Document verification pending for case #LA-2024-002",
    time: "2 days ago",
    type: "warning"
  }];
  const quickStats = [{
    label: "Active Cases",
    value: "7",
    icon: FileText
  }, {
    label: "Approval Rate",
    value: "85%",
    icon: TrendingUp
  }, {
    label: "Avg. Processing Time",
    value: "3.5 days",
    icon: Clock
  }];
  const menuItems = [
    {
      title: "Dashboard",
      icon: LayoutDashboard,
      path: "/litigation-access-dashboard",
    },
    {
      title: "View Applications",
      icon: FileText,
      path: "/litigation-access-applications",
    },
  ];

  return <SidebarProvider>
      <div className="min-h-screen flex w-full bg-gradient-dashboard">
        <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
          <SheetContent side="left" className="p-0 w-72 bg-gradient-to-b from-blue-600 to-blue-700 border-r border-blue-700 overflow-y-auto">
            {/* Mobile Menu Content */}
            <div className="flex flex-col h-full">
              {/* Header */}
              <div className="p-6 border-b border-blue-500/30 bg-blue-700/50">
                <div className="flex flex-col items-center text-center">
                  <div className="w-14 h-14 mb-3 rounded-full bg-white/20 flex items-center justify-center">
                    <Scale className="h-7 w-7 text-white" />
                  </div>
                  <h2 className="text-xl font-bold text-white mb-1">{username}</h2>
                  <p className="text-xs text-white/80 uppercase tracking-wider">Litigation Dashboard</p>
                </div>
              </div>

              {/* Menu Items */}
              <div className="flex-1 px-4 py-6">
                <p className="text-white/70 uppercase tracking-wider text-xs font-semibold mb-3 px-2">Main Menu</p>
                <nav className="space-y-2">
                  {menuItems.map((item) => {
                    const isActive = location.pathname === item.path;
                    return (
                      <button
                        key={item.title}
                        onClick={() => {
                          navigate(item.path);
                          setMobileMenuOpen(false);
                        }}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-colors ${
                          isActive
                            ? 'bg-white text-blue-700'
                            : 'text-white/90 hover:bg-white/10'
                        }`}
                      >
                        <item.icon className="h-5 w-5" />
                        <span>{item.title}</span>
                      </button>
                    );
                  })}
                </nav>
              </div>

              {/* Logout Button */}
              <div className="p-4 border-t border-blue-500/30 bg-blue-700">
                <AlertDialog open={isLogoutDialogOpen} onOpenChange={setIsLogoutDialogOpen}>
                  <AlertDialogTrigger asChild>
                    <button className="w-full flex items-center justify-center gap-3 bg-red-600 text-white font-bold px-4 py-3 rounded-lg hover:bg-red-700 transition-colors">
                      <LogOut className="h-5 w-5" />
                      <span>Logout</span>
                    </button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Confirm Logout</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to logout? You will need to login again to access your account.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={handleLogout} className="bg-red-600 hover:bg-red-700">
                        Logout
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          </SheetContent>
        </Sheet>
        
        {!isMobile && <LitigationAccessSidebar />}
        
        <main className="flex-1">
          {/* Header */}
          <header className="bg-card border-b border-border px-4 md:px-8 py-4 flex items-center justify-between sticky top-0 z-10 shadow-sm">
            <div className="flex items-center gap-3">
              {isMobile && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setMobileMenuOpen(true)}
                  className="md:hidden"
                >
                  <Menu className="h-5 w-5" />
                </Button>
              )}
              <h1 className="text-xl md:text-3xl font-bold text-foreground">Welcome to {username}</h1>
            </div>
            <AlertDialog open={isLogoutDialogOpen} onOpenChange={setIsLogoutDialogOpen}>
              <AlertDialogTrigger asChild>
                <Button 
                  size={isMobile ? "default" : "lg"}
                  className="bg-red-600 hover:bg-red-700 text-white font-extrabold px-4 md:px-8 py-3 md:py-6 text-sm md:text-lg"
                >
                  <LogOut className="h-4 w-4 md:h-5 md:w-5 md:mr-2" />
                  <span className="hidden md:inline">Logout</span>
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Confirm Logout</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to logout? You will need to login again to access your account.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleLogout} className="bg-red-600 hover:bg-red-700">
                    Logout
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </header>

          {/* Main Content */}
          <div className="p-4 md:p-8">
            {/* Welcome Alert */}
            

            {/* Stats Grid */}
            <div className="grid grid-cols-1 gap-6 mb-8">
              {stats.map((stat, index) => (
                <Card key={index} className="hover:shadow-lg transition-shadow">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      {stat.title}
                    </CardTitle>
                    <div className={`${stat.bgColor} p-2 rounded-lg`}>
                      <stat.icon className={`h-5 w-5 ${stat.iconColor}`} />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">{stat.value}</div>
                    <p className="text-xs text-muted-foreground mt-1">{stat.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Two Column Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Notifications Section */}
              

              {/* Quick Stats Section */}
              
            </div>
          </div>
        </main>
      </div>
    </SidebarProvider>;
};
export default LitigationAccessDashboard;