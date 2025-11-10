import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Building2, Users, UserCog, Plus, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import BankManagerAccountsContent from "../components/BankManagerAccountsContent";
import BankEmployeeAccountsContent from "../components/BankEmployeeAccountsContent";
import AdminVerification from "@/components/AdminVerification";

const BankLoginsManagement = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Determine initial tab based on current route or default to manager
  const getInitialTab = () => {
    if (location.pathname.includes('bank-accounts')) return "employee";
    if (location.pathname.includes('bank-manager-accounts')) return "manager";
    return "manager";
  };
  
  const [activeTab, setActiveTab] = useState(getInitialTab());

  // Update tab when coming from old routes
  useEffect(() => {
    const newTab = getInitialTab();
    if (newTab !== activeTab) {
      setActiveTab(newTab);
    }
  }, [location.pathname]);

  return (
    <AdminVerification>
      <SidebarProvider>
        <div className="min-h-screen flex w-full bg-gradient-legal-bg">
          <AppSidebar />
        
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <header className="bg-gradient-to-r from-white/95 to-blue-50/95 backdrop-blur-sm shadow-elegant border-b border-white/20">
            <div className="px-6">
              <div className="flex justify-between items-center h-16">
                <div className="flex items-center space-x-4">
                  <SidebarTrigger className="text-slate-600 hover:text-blue-600 transition-colors duration-200" />
                  <Button
                    onClick={() => navigate("/admin-dashboard")}
                    variant="ghost"
                    className="text-slate-600 hover:text-blue-600 transition-colors duration-200"
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Dashboard
                  </Button>
                </div>
                
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                    <Building2 className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h1 className="text-xl font-bold bg-gradient-to-r from-slate-800 to-blue-600 bg-clip-text text-transparent">
                      Bank Login Management
                    </h1>
                    <p className="text-sm text-slate-600">Manage bank manager and employee logins</p>
                  </div>
                </div>
              </div>
            </div>
          </header>

          {/* Main Content */}
          <main className="flex-1 overflow-auto p-8">
            <div className="max-w-6xl mx-auto">
              <Card className="bg-gradient-to-br from-white/90 via-slate-50/20 to-blue-50/20 backdrop-blur-sm shadow-2xl border-0 rounded-2xl overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600/5 to-purple-600/5 pointer-events-none"></div>
                <CardHeader className="relative bg-gradient-to-r from-blue-600/10 to-purple-600/10 border-b border-slate-200/30">
                  <div className="flex items-center space-x-4">
                    <div className="p-3 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl shadow-lg">
                      <Building2 className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-xl font-bold bg-gradient-to-r from-slate-800 to-blue-600 bg-clip-text text-transparent">
                        Bank Login Accounts
                      </CardTitle>
                      <p className="text-sm text-slate-500 mt-1">Manage bank manager and employee login credentials</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-6">
                  <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="manager" className="cursor-pointer">
                        Bank Manager
                      </TabsTrigger>
                      <TabsTrigger value="employee" className="cursor-pointer">
                        Bank Employee
                      </TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="manager" className="mt-6">
                      <BankManagerAccountsContent />
                    </TabsContent>
                    
                    <TabsContent value="employee" className="mt-6">
                      <BankEmployeeAccountsContent />
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
    </AdminVerification>
  );
};

export default BankLoginsManagement;
