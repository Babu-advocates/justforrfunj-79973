import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { ArrowLeft, Landmark, Plus, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { showToast } from "@/lib/toast";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

const CreateBankManagerAccountList = () => {
  const navigate = useNavigate();
  const [accounts, setAccounts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchAccounts();
  }, []);

  const fetchAccounts = async () => {
    try {
      const { data, error } = await supabase
        .from('bank_manager_accounts')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching bank manager accounts:', error);
        showToast.error('Failed to load bank manager accounts');
      } else {
        setAccounts(data || []);
      }
    } catch (error) {
      console.error('Error fetching bank manager accounts:', error);
      showToast.error('Failed to load bank manager accounts');
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleStatus = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('bank_manager_accounts')
        .update({ is_active: !currentStatus })
        .eq('id', id);

      if (error) {
        showToast.error('Failed to update account status');
        return;
      }

      showToast.success('Account status updated successfully');
      fetchAccounts();
    } catch (error) {
      console.error('Error updating account status:', error);
      showToast.error('An unexpected error occurred');
    }
  };

  return (
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
                  <Landmark className="h-6 w-6 text-blue-600" />
                  <h1 className="text-xl font-bold bg-gradient-to-r from-slate-800 to-blue-600 bg-clip-text text-transparent">
                    Bank Manager Accounts
                  </h1>
                </div>
              </div>
            </div>
          </header>

          {/* Main Content */}
          <main className="flex-1 overflow-auto p-6">
            <div className="max-w-6xl mx-auto">
              <Card className="bg-gradient-to-br from-white/95 to-blue-50/30 backdrop-blur-sm shadow-elegant border border-white/20">
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="flex items-center space-x-2">
                    <Landmark className="h-5 w-5 text-blue-600" />
                    <span className="bg-gradient-to-r from-slate-800 to-blue-600 bg-clip-text text-transparent">
                      All Bank Manager Accounts
                    </span>
                  </CardTitle>
                  <Button
                    onClick={() => navigate("/create-bank-manager-account")}
                    className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Create New
                  </Button>
                </CardHeader>
                
                <CardContent>
                  {isLoading ? (
                    <div className="flex justify-center items-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    </div>
                  ) : accounts.length === 0 ? (
                    <div className="text-center py-8 text-slate-600">
                      No bank manager accounts found. Create one to get started.
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Bank Name</TableHead>
                          <TableHead>Username</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {accounts.map((account) => (
                          <TableRow key={account.id}>
                            <TableCell className="font-medium">
                              {Array.isArray(account.bank_name) 
                                ? account.bank_name.join(", ") 
                                : account.bank_name}
                            </TableCell>
                            <TableCell>{account.username}</TableCell>
                            <TableCell>
                              <Badge 
                                variant={account.is_active ? "default" : "secondary"}
                                className={account.is_active ? "bg-green-600" : "bg-gray-500"}
                              >
                                {account.is_active ? "Active" : "Inactive"}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Button
                                size="sm"
                                variant={account.is_active ? "destructive" : "default"}
                                onClick={() => handleToggleStatus(account.id, account.is_active)}
                              >
                                {account.is_active ? "Deactivate" : "Activate"}
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default CreateBankManagerAccountList;
