import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/ui/password-input";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Plus, Edit, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { showToast } from "@/lib/toast";
import { Switch } from "@/components/ui/switch";

const BankManagerAccountsContent = () => {
  const navigate = useNavigate();
  const [accounts, setAccounts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<any>(null);
  const [editUsername, setEditUsername] = useState("");
  const [editPassword, setEditPassword] = useState("");
  const [editBankNames, setEditBankNames] = useState<string[]>([]);
  const [isUpdating, setIsUpdating] = useState(false);
  const [availableBankNames, setAvailableBankNames] = useState<string[]>([]);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [accountToDelete, setAccountToDelete] = useState<any>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deactivateDialogOpen, setDeactivateDialogOpen] = useState(false);
  const [accountToDeactivate, setAccountToDeactivate] = useState<any>(null);

  useEffect(() => {
    fetchAccounts();
    fetchBankNames();
    
    // Set up real-time subscription
    const channel = supabase
      .channel('bank_manager_accounts_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'bank_manager_accounts'
        },
        () => {
          fetchAccounts();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
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

  const fetchBankNames = async () => {
    const { data, error } = await supabase
      .from('bank_accounts')
      .select('bank_name');
    
    if (error) {
      console.error('Error fetching bank names:', error);
      return;
    }

    const uniqueBankNames = [...new Set(data.map(item => item.bank_name))];
    setAvailableBankNames(uniqueBankNames);
  };

  const handleEdit = (account: any) => {
    setEditingAccount(account);
    setEditUsername(account.username);
    setEditPassword(account.password);
    setEditBankNames(Array.isArray(account.bank_name) ? account.bank_name : [account.bank_name]);
    setEditDialogOpen(true);
  };

  const handleCancelEdit = () => {
    setEditDialogOpen(false);
    setEditingAccount(null);
    setEditUsername("");
    setEditPassword("");
    setEditBankNames([]);
  };

  const toggleEditBankSelection = (bankName: string) => {
    setEditBankNames(prev => 
      prev.includes(bankName)
        ? prev.filter(name => name !== bankName)
        : [...prev, bankName]
    );
  };

  const handleUpdateAccount = async () => {
    if (!editingAccount) return;
    
    if (!editUsername.trim() || !editPassword.trim() || editBankNames.length === 0) {
      showToast.error("Please fill in all fields and select at least one bank");
      return;
    }

    setIsUpdating(true);

    try {
      const { error } = await supabase
        .from('bank_manager_accounts')
        .update({
          username: editUsername.trim(),
          password: editPassword,
          bank_name: editBankNames,
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

      showToast.success("Bank manager account updated successfully!");
      handleCancelEdit();
      fetchAccounts();
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
        .from('bank_manager_accounts')
        .delete()
        .eq('id', accountToDelete.id);

      if (error) {
        console.error('Supabase error:', error);
        showToast.error(`Failed to delete account: ${error.message}`);
        return;
      }

      showToast.success("Bank manager account deleted successfully!");
      setDeleteDialogOpen(false);
      setAccountToDelete(null);
      fetchAccounts();
    } catch (error) {
      console.error('Error deleting account:', error);
      showToast.error("An unexpected error occurred. Please try again.");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleToggleStatus = async (account: any) => {
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
        .from('bank_manager_accounts')
        .update({ is_active: !currentStatus })
        .eq('id', id);

      if (error) {
        console.error('Supabase error details:', error);
        showToast.error(`Failed to update: ${error.message || 'Unknown error'}`);
        return;
      }

      showToast.success(`Account ${!currentStatus ? 'activated' : 'deactivated'} successfully`);
      setDeactivateDialogOpen(false);
      setAccountToDeactivate(null);
      fetchAccounts(); // Refresh the list
    } catch (error) {
      console.error('Error updating account status:', error);
      showToast.error('An unexpected error occurred');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-slate-800">All Bank Manager Accounts</h3>
          <p className="text-sm text-slate-600 mt-1">
            {accounts.length} account{accounts.length !== 1 ? 's' : ''} total
          </p>
        </div>
        <Button
          onClick={() => navigate("/create-bank-manager-account")}
          className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
        >
          <Plus className="h-4 w-4 mr-2" />
          Create New
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : accounts.length === 0 ? (
        <div className="text-center py-8 text-slate-600 bg-slate-50 rounded-lg border-2 border-dashed border-slate-200">
          No bank manager accounts found. Create one to get started.
        </div>
      ) : (
        <div className="rounded-lg border border-slate-200 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50">
                <TableHead className="font-semibold">Bank Name</TableHead>
                <TableHead className="font-semibold">Username</TableHead>
                <TableHead className="font-semibold">Status</TableHead>
                <TableHead className="font-semibold text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {accounts.map((account) => (
                <TableRow key={account.id} className="hover:bg-slate-50/50 transition-colors">
                  <TableCell className="font-medium">
                    {Array.isArray(account.bank_name) 
                      ? account.bank_name.join(", ") 
                      : account.bank_name}
                  </TableCell>
                  <TableCell>{account.username}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={account.is_active}
                        onCheckedChange={() => handleToggleStatus(account)}
                      />
                      <span className="text-sm text-muted-foreground">
                        {account.is_active ? "Active" : "Inactive"}
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
      )}

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Bank Manager Account</DialogTitle>
            <DialogDescription>
              Update the bank manager account details below
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-3">
              <Label>Select Bank Names *</Label>
              <div className="grid grid-cols-2 gap-3 p-4 border border-border rounded-md bg-background/50 max-h-60 overflow-y-auto">
                {availableBankNames.map((name) => (
                  <div key={name} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id={`edit-bank-${name}`}
                      checked={editBankNames.includes(name)}
                      onChange={() => toggleEditBankSelection(name)}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <label
                      htmlFor={`edit-bank-${name}`}
                      className="text-sm text-slate-700 cursor-pointer"
                    >
                      {name}
                    </label>
                  </div>
                ))}
              </div>
              {editBankNames.length > 0 && (
                <p className="text-xs text-muted-foreground">
                  Selected: {editBankNames.join(", ")}
                </p>
              )}
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
              This will permanently delete the bank manager account for "{Array.isArray(accountToDelete?.bank_name) ? accountToDelete?.bank_name.join(", ") : accountToDelete?.bank_name}".
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
              Are you sure you want to deactivate the bank manager account for "{accountToDeactivate?.bank_name}"?
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

export default BankManagerAccountsContent;
