import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/ui/password-input";
import { Landmark, Calendar, Shield, Edit, Trash2, Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { showToast } from "@/lib/toast";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Switch } from "@/components/ui/switch";

const BankEmployeeAccountsContent = () => {
  const navigate = useNavigate();
  const [bankAccounts, setBankAccounts] = useState<any[]>([]);
  const [isLoadingAccounts, setIsLoadingAccounts] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<any>(null);
  const [editUsername, setEditUsername] = useState("");
  const [editPassword, setEditPassword] = useState("");
  const [editBankName, setEditBankName] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [accountToDelete, setAccountToDelete] = useState<any>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deactivateDialogOpen, setDeactivateDialogOpen] = useState(false);
  const [accountToDeactivate, setAccountToDeactivate] = useState<any>(null);

  const fetchBankAccounts = async () => {
    setIsLoadingAccounts(true);
    try {
      const { data, error } = await supabase
        .from('bank_accounts')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching bank accounts:', error);
        showToast.error("Failed to load bank accounts");
      } else {
        setBankAccounts(data || []);
      }
    } catch (error) {
      console.error('Error fetching bank accounts:', error);
      showToast.error("Failed to load bank accounts");
    } finally {
      setIsLoadingAccounts(false);
    }
  };

  useEffect(() => {
    fetchBankAccounts();
    
    const channel = supabase
      .channel('bank-accounts-changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'bank_accounts' }, 
        () => {
          fetchBankAccounts();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleEdit = (account: any) => {
    setEditingAccount(account);
    setEditUsername(account.username);
    setEditPassword(account.password);
    setEditBankName(account.bank_name);
    setEditDialogOpen(true);
  };

  const handleCancelEdit = () => {
    setEditDialogOpen(false);
    setEditingAccount(null);
    setEditUsername("");
    setEditPassword("");
    setEditBankName("");
  };

  const handleUpdateAccount = async () => {
    if (!editingAccount) return;
    
    if (!editUsername.trim() || !editPassword.trim() || !editBankName.trim()) {
      showToast.error("Please fill in all fields");
      return;
    }

    setIsUpdating(true);

    try {
      const { error } = await supabase
        .from('bank_accounts')
        .update({
          username: editUsername.trim(),
          password: editPassword,
          bank_name: editBankName.trim(),
        })
        .eq('id', editingAccount.id);

      if (error) {
        console.error('Supabase error:', error);
        if (error.code === '23505') {
          showToast.error("Username already exists. Please choose a different username.");
        } else {
          showToast.error(`Failed to update account: ${error.message}`);
        }
        return;
      }

      showToast.success("Bank account updated successfully!");
      handleCancelEdit();
      fetchBankAccounts();
    } catch (error) {
      console.error('Error updating account:', error);
      showToast.error("An unexpected error occurred. Please try again.");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteClick = (account: any) => {
    setAccountToDelete(account);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!accountToDelete) return;

    setIsDeleting(true);

    try {
      const { error } = await supabase
        .from('bank_accounts')
        .delete()
        .eq('id', accountToDelete.id);

      if (error) {
        console.error('Supabase error:', error);
        showToast.error(`Failed to delete account: ${error.message}`);
        return;
      }

      showToast.success("Bank account deleted successfully!");
      setDeleteDialogOpen(false);
      setAccountToDelete(null);
      fetchBankAccounts();
    } catch (error) {
      console.error('Error deleting account:', error);
      showToast.error("An unexpected error occurred. Please try again.");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleStatusToggle = async (account: any) => {
    // If currently active (deactivating), show confirmation
    if (account.is_active) {
      setAccountToDeactivate(account);
      setDeactivateDialogOpen(true);
      return;
    }

    // If currently inactive (activating), proceed directly
    await performStatusToggle(account.id, account.is_active);
  };

  const performStatusToggle = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('bank_accounts')
        .update({ is_active: !currentStatus })
        .eq('id', id);

      if (error) {
        console.error('Supabase error:', error);
        showToast.error(`Failed to update status: ${error.message}`);
        return;
      }

      showToast.success(`Account ${!currentStatus ? 'activated' : 'deactivated'} successfully!`);
      setDeactivateDialogOpen(false);
      setAccountToDeactivate(null);
    } catch (error) {
      console.error('Error updating status:', error);
      showToast.error("An unexpected error occurred. Please try again.");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-slate-800">All Bank Employee Accounts</h3>
          <p className="text-sm text-slate-600 mt-1">
            {bankAccounts.length} account{bankAccounts.length !== 1 ? 's' : ''} total
          </p>
        </div>
        <Button
          onClick={() => navigate("/admin/create-bank-account")}
          className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white"
        >
          <Plus className="h-4 w-4 mr-2" />
          Create New Account
        </Button>
      </div>

      {isLoadingAccounts ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
          <span className="ml-4 text-slate-600">Loading accounts...</span>
        </div>
      ) : bankAccounts.length > 0 ? (
        <div className="rounded-lg border border-slate-200 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50">
                <TableHead className="font-semibold">
                  <div className="flex items-center space-x-2">
                    <Landmark className="h-4 w-4" />
                    <span>Bank Name</span>
                  </div>
                </TableHead>
                <TableHead className="font-semibold">
                  <div className="flex items-center space-x-2">
                    <Shield className="h-4 w-4" />
                    <span>Username</span>
                  </div>
                </TableHead>
                <TableHead className="font-semibold">
                  <div className="flex items-center space-x-2">
                    <Shield className="h-4 w-4" />
                    <span>Password</span>
                  </div>
                </TableHead>
                <TableHead className="font-semibold">
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4" />
                    <span>Date Created</span>
                  </div>
                </TableHead>
                <TableHead className="font-semibold">Status</TableHead>
                <TableHead className="font-semibold text-center">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {bankAccounts.map((account, index) => (
                <TableRow 
                  key={account.id}
                  className={`hover:bg-slate-50/80 transition-colors ${
                    index % 2 === 0 ? 'bg-white' : 'bg-slate-50/30'
                  }`}
                >
                  <TableCell className="font-bold text-slate-800">
                    {account.bank_name}
                  </TableCell>
                  <TableCell className="font-medium text-slate-700">
                    {account.username}
                  </TableCell>
                  <TableCell className="font-mono text-slate-600">
                    ••••••••
                  </TableCell>
                  <TableCell className="text-slate-600">
                    <div className="flex items-center space-x-2">
                      <Calendar className="h-4 w-4 text-blue-500" />
                      <span className="text-sm">
                        {new Date(account.created_at).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={account.is_active}
                        onCheckedChange={() => handleStatusToggle(account)}
                      />
                      <span className="text-sm text-muted-foreground">
                        {account.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        onClick={() => handleEdit(account)}
                        variant="outline"
                        size="sm"
                        className="border-blue-300 text-blue-600 hover:bg-blue-50"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        onClick={() => handleDeleteClick(account)}
                        variant="outline"
                        size="sm"
                        className="border-red-300 text-red-600 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <div className="text-center py-12 bg-slate-50 rounded-lg border-2 border-dashed border-slate-200">
          <Landmark className="h-12 w-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-600 font-medium">No bank accounts found</p>
          <p className="text-sm text-slate-500 mt-1">Create your first account to get started</p>
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Bank Account</DialogTitle>
            <DialogDescription>
              Update the bank account details below
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-bank-name">Bank Name</Label>
              <Input
                id="edit-bank-name"
                value={editBankName}
                onChange={(e) => setEditBankName(e.target.value)}
                placeholder="Enter bank name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-username">Username</Label>
              <Input
                id="edit-username"
                value={editUsername}
                onChange={(e) => setEditUsername(e.target.value)}
                placeholder="Enter username"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-password">Password</Label>
              <PasswordInput
                id="edit-password"
                value={editPassword}
                onChange={(e) => setEditPassword(e.target.value)}
                placeholder="Enter password"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleCancelEdit} disabled={isUpdating}>
              Cancel
            </Button>
            <Button onClick={handleUpdateAccount} disabled={isUpdating}>
              {isUpdating ? "Updating..." : "Update Account"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the bank account for "{accountToDelete?.bank_name}".
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Deactivate Confirmation Dialog */}
      <AlertDialog open={deactivateDialogOpen} onOpenChange={setDeactivateDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Deactivate Account?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to deactivate the bank employee account for "{accountToDeactivate?.bank_name}"?
              The user will not be able to log in until reactivated.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => performStatusToggle(accountToDeactivate?.id, accountToDeactivate?.is_active)}
              className="bg-orange-600 hover:bg-orange-700"
            >
              Deactivate
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default BankEmployeeAccountsContent;
