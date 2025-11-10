import { useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { 
  Sidebar, 
  SidebarContent, 
  SidebarGroup, 
  SidebarGroupContent, 
  SidebarGroupLabel, 
  SidebarMenu, 
  SidebarMenuButton, 
  SidebarMenuItem, 
  useSidebar 
} from "@/components/ui/sidebar";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { FileText, BarChart3, LayoutDashboard, LogOut } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { showToast } from "@/lib/toast";

const menuItems = [
  {
    title: "Dashboard",
    url: "/bank-manager-dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Document Tracking",
    url: "/bank-manager/document-tracking",
    icon: FileText,
  },
  {
    title: "Reports & Analytics",
    url: "/bank-manager/reports-analytics",
    icon: BarChart3,
  },
];

export function BankManagerSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const currentPath = location.pathname;
  const navigate = useNavigate();

  const isActive = (path: string) => currentPath === path;

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      showToast.success("Successfully logged out!");
      navigate("/");
    } catch (error) {
      showToast.error("Failed to log out. Please try again.");
    }
  };

  return (
    <Sidebar
      className={`${collapsed ? "w-14" : "w-64"} transition-all duration-300`}
      collapsible="icon"
    >
      <SidebarContent className="bg-gradient-to-br from-sky-100 via-blue-200 to-cyan-300 border-r-0">
        {/* Menu */}
        <SidebarGroup className="flex-1 px-0 pt-6">
          <SidebarGroupLabel className="px-4 py-3 text-slate-700 text-sm font-medium uppercase tracking-wider">
            {!collapsed && "Main Menu"}
          </SidebarGroupLabel>
          
          <SidebarGroupContent className="px-2">
            <SidebarMenu className="space-y-1">
              {menuItems.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.url);
                
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <NavLink 
                        to={item.url} 
                        className={`
                          flex items-center px-3 py-3 rounded-lg transition-all duration-200 group relative overflow-hidden
                          ${active 
                            ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/25' 
                            : 'text-slate-700 hover:bg-blue-200/50 hover:text-slate-800'
                          }
                        `}
                      >
                        <Icon className={`h-5 w-5 ${collapsed ? '' : 'mr-3'} flex-shrink-0`} />
                        {!collapsed && (
                          <span className="font-medium">{item.title}</span>
                        )}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Logout Section */}
        <SidebarGroup className="px-0 pb-6">
          <SidebarGroupContent className="px-2">
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <button 
                        className={`
                          flex items-center ${collapsed ? 'justify-center' : ''} w-full px-4 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors duration-200 group
                        `}
                      >
                        <LogOut className={`h-5 w-5 ${collapsed ? '' : 'mr-3'} flex-shrink-0`} />
                        {!collapsed && (
                          <span className="font-medium">Logout</span>
                        )}
                      </button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure you want to logout?</AlertDialogTitle>
                        <AlertDialogDescription>
                          You will be redirected to the login page and will need to sign in again.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleLogout} className="bg-red-600 hover:bg-red-700">
                          Yes, Logout
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}