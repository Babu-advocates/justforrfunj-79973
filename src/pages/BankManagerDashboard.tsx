import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { BankManagerSidebar } from "@/components/BankManagerSidebar";
import { showToast } from "@/lib/toast";
import { 
  FileText, 
  Clock, 
  AlertTriangle,
  Calendar,
  BarChart3,
  LogOut,
  Filter,
  CheckCircle,
  XCircle,
  Loader2
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { differenceInDays, format, subMonths, subDays, startOfMonth, startOfQuarter, startOfYear, endOfYear } from "date-fns";

interface Application {
  application_id: string;
  application_type: string;
  bank_name: string | null;
  loan_type: string | null;
  status: string | null;
  created_at: string;
  updated_at: string;
  applicant_name?: string;
  first_name?: string;
  [key: string]: any;
}

const BankManagerDashboard = () => {
  const navigate = useNavigate();
  const [selectedPeriod, setSelectedPeriod] = useState("overall");
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
  const [selectedMonth, setSelectedMonth] = useState("all");
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [bankNames, setBankNames] = useState<string[]>([]);

  useEffect(() => {
    window.scrollTo(0, 0);
    fetchBankManagerInfo();
  }, []);

  useEffect(() => {
    if (bankNames.length > 0) {
      fetchApplications();
    }
  }, [bankNames]);

  useEffect(() => {
    if (bankNames.length === 0) return;

    const channel = supabase
      .channel('applications-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'applications'
        },
        () => {
          fetchApplications();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [bankNames]);

  const fetchBankManagerInfo = async () => {
    const username = localStorage.getItem("bankManagerUsername");
    console.log("Bank Manager Username from localStorage:", username);
    
    if (!username) {
      showToast.error("Please log in again");
      navigate("/bank-login");
      return;
    }

    const { data, error } = await supabase
      .from("bank_manager_accounts")
      .select("bank_name")
      .eq("username", username)
      .single();

    console.log("Bank Manager Data:", data);
    console.log("Bank Manager Error:", error);

    if (error) {
      console.error("Error fetching bank manager info:", error);
      showToast.error("Failed to load bank information");
      return;
    }

    if (data) {
      const banks = Array.isArray(data.bank_name) ? data.bank_name : [data.bank_name];
      console.log("Setting bank names to:", banks);
      setBankNames(banks);
    }
  };

  const fetchApplications = async () => {
    setLoading(true);
    console.log("Fetching applications for banks:", bankNames);
    
    if (bankNames.length === 0) {
      setLoading(false);
      return;
    }
    
    const { data, error } = await supabase
      .from("applications")
      .select("*")
      .in("bank_name", bankNames)
      .order("created_at", { ascending: false });

    console.log("Applications fetched:", data);
    console.log("Applications count:", data?.length);
    console.log("Applications error:", error);

    if (error) {
      console.error("Error fetching applications:", error);
      showToast.error("Failed to load applications");
      setLoading(false);
      return;
    }

    setApplications(data || []);
    setLoading(false);
  };

  const handleLogout = () => {
    localStorage.removeItem("bankManagerLogin");
    localStorage.removeItem("bankManagerId");
    localStorage.removeItem("bankManagerUsername");
    showToast.success("Successfully logged out!");
    navigate("/bank-login");
  };

  // Generate year options (from 5 years back to 2099)
  const getYearOptions = () => {
    const currentYear = new Date().getFullYear();
    const startYear = currentYear - 5;
    const endYear = 2099;
    const years = [];
    
    for (let year = endYear; year >= startYear; year--) {
      years.push(year);
    }
    
    return years;
  };

  // Month options
  const monthOptions = [
    { value: "all", label: "All Months" },
    { value: "0", label: "January" },
    { value: "1", label: "February" },
    { value: "2", label: "March" },
    { value: "3", label: "April" },
    { value: "4", label: "May" },
    { value: "5", label: "June" },
    { value: "6", label: "July" },
    { value: "7", label: "August" },
    { value: "8", label: "September" },
    { value: "9", label: "October" },
    { value: "10", label: "November" },
    { value: "11", label: "December" },
  ];

  // Filter applications based on selected period
  const getFilteredApplications = () => {
    const year = parseInt(selectedYear);
    
    // Filter by month if specific month is selected
    if (selectedMonth !== "all") {
      const month = parseInt(selectedMonth);
      const monthStart = new Date(year, month, 1);
      const monthEnd = new Date(year, month + 1, 0, 23, 59, 59);
      
      return applications.filter(app => {
        const appDate = new Date(app.created_at);
        return appDate >= monthStart && appDate <= monthEnd;
      });
    }
    
    // Otherwise filter by year and period
    const yearStart = startOfYear(new Date(year, 0, 1));
    const yearEnd = endOfYear(new Date(year, 11, 31));
    
    // First filter by year
    const yearApplications = applications.filter(app => {
      const appDate = new Date(app.created_at);
      return appDate >= yearStart && appDate <= yearEnd;
    });

    // Then filter by period within the year
    const now = new Date();
    let startDate: Date;

    switch (selectedPeriod) {
      case "3months":
        // Last 3 months from current date
        startDate = subMonths(now, 3);
        return yearApplications.filter(app => new Date(app.created_at) >= startDate);
      case "6months":
        // Last 6 months from current date
        startDate = subMonths(now, 6);
        return yearApplications.filter(app => new Date(app.created_at) >= startDate);
      case "overall":
      default:
        return yearApplications;
    }
  };

  const filteredApplications = getFilteredApplications();
  
  console.log("Selected period:", selectedPeriod);
  console.log("Total applications:", applications.length);
  console.log("Filtered applications:", filteredApplications.length);

  // Calculate analytics from real data using same logic as Document Tracking
  const documentAnalytics = {
    totalDocuments: {
      "3months": applications.filter(app => new Date(app.created_at) >= subMonths(new Date(), 3)).length,
      "6months": applications.filter(app => new Date(app.created_at) >= subMonths(new Date(), 6)).length,
      overall: getFilteredApplications().length
    },
    pendingOpinions: filteredApplications.filter(app => 
      app.status === 'submitted' || app.status === 'to_be_assigned'
    ).length,
    completedOpinions: filteredApplications.filter(app => 
      app.status === 'completed'
    ).length,
    inReview: filteredApplications.filter(app => 
      app.status === 'assigned' || app.status === 'in_review' || app.status === 'waiting_for_approval'
    ).length,
    averageTurnaround: filteredApplications.length > 0 
      ? filteredApplications.reduce((sum, app) => 
          sum + differenceInDays(new Date(app.updated_at), new Date(app.created_at)), 0
        ) / filteredApplications.length 
      : 0,
    delayedCases: filteredApplications.filter(app => {
      const days = differenceInDays(new Date(), new Date(app.created_at));
      return days > 7 && (app.status === 'submitted' || app.status === 'to_be_assigned' || app.status === 'assigned' || app.status === 'in_review');
    }).length
  };

  // Get trend data based on selected period
  const getStatusTrendData = () => {
    const year = parseInt(selectedYear);
    
    // If specific month is selected, show weekly data for that month
    if (selectedMonth !== "all") {
      const month = parseInt(selectedMonth);
      const monthStart = new Date(year, month, 1);
      const monthEnd = new Date(year, month + 1, 0);
      const daysInMonth = monthEnd.getDate();
      const weeksInMonth = Math.ceil(daysInMonth / 7);
      
      return Array.from({ length: weeksInMonth }, (_, i) => {
        const weekStart = new Date(year, month, i * 7 + 1);
        const weekEnd = new Date(year, month, Math.min((i + 1) * 7, daysInMonth), 23, 59, 59);
        
        const weekApps = applications.filter(app => {
          const appDate = new Date(app.created_at);
          return appDate >= weekStart && appDate <= weekEnd;
        });

        return {
          month: `Week ${i + 1}`,
          pending: weekApps.filter(app => 
            app.status === 'submitted' || app.status === 'to_be_assigned'
          ).length,
          inReview: weekApps.filter(app => 
            app.status === 'assigned' || app.status === 'in_review' || app.status === 'waiting_for_approval'
          ).length,
          completed: weekApps.filter(app => app.status === 'completed').length
        };
      });
    }
    
    if (selectedPeriod === "overall") {
      // Show all 12 months for the selected year
      return Array.from({ length: 12 }, (_, i) => {
        const monthDate = new Date(year, i, 1);
        const monthStart = startOfMonth(monthDate);
        const nextMonth = new Date(year, i + 1, 1);
        const monthApps = applications.filter(app => {
          const appDate = new Date(app.created_at);
          return appDate >= monthStart && appDate < nextMonth;
        });

        return {
          month: format(monthDate, 'MMM'),
          pending: monthApps.filter(app => 
            app.status === 'submitted' || app.status === 'to_be_assigned'
          ).length,
          inReview: monthApps.filter(app => 
            app.status === 'assigned' || app.status === 'in_review' || app.status === 'waiting_for_approval'
          ).length,
          completed: monthApps.filter(app => app.status === 'completed').length
        };
      });
    } else if (selectedPeriod === "6months") {
      // Show last 6 months
      return Array.from({ length: 6 }, (_, i) => {
        const monthDate = subMonths(new Date(), 5 - i);
        const monthStart = startOfMonth(monthDate);
        const nextMonth = subMonths(monthStart, -1);
        const monthApps = applications.filter(app => {
          const appDate = new Date(app.created_at);
          return appDate >= monthStart && appDate < nextMonth;
        });

        return {
          month: format(monthDate, 'MMM'),
          pending: monthApps.filter(app => 
            app.status === 'submitted' || app.status === 'to_be_assigned'
          ).length,
          inReview: monthApps.filter(app => 
            app.status === 'assigned' || app.status === 'in_review' || app.status === 'waiting_for_approval'
          ).length,
          completed: monthApps.filter(app => app.status === 'completed').length
        };
      });
    } else {
      // Show last 3 months
      return Array.from({ length: 3 }, (_, i) => {
        const monthDate = subMonths(new Date(), 2 - i);
        const monthStart = startOfMonth(monthDate);
        const nextMonth = subMonths(monthStart, -1);
        const monthApps = applications.filter(app => {
          const appDate = new Date(app.created_at);
          return appDate >= monthStart && appDate < nextMonth;
        });

        return {
          month: format(monthDate, 'MMM'),
          pending: monthApps.filter(app => 
            app.status === 'submitted' || app.status === 'to_be_assigned'
          ).length,
          inReview: monthApps.filter(app => 
            app.status === 'assigned' || app.status === 'in_review' || app.status === 'waiting_for_approval'
          ).length,
          completed: monthApps.filter(app => app.status === 'completed').length
        };
      });
    }
  };

  const statusTrendData = getStatusTrendData();

  // Get delayed cases
  const delayedCasesData = filteredApplications
    .filter(app => {
      const days = differenceInDays(new Date(), new Date(app.created_at));
      return days > 7 && (app.status === 'submitted' || app.status === 'to_be_assigned' || app.status === 'assigned' || app.status === 'in_review');
    })
    .sort((a, b) => {
      const daysA = differenceInDays(new Date(), new Date(a.created_at));
      const daysB = differenceInDays(new Date(), new Date(b.created_at));
      return daysB - daysA;
    })
    .slice(0, 10)
    .map(app => ({
      caseId: app.application_id,
      documentType: app.application_type || "N/A",
      submissionDate: format(new Date(app.created_at), 'yyyy-MM-dd'),
      daysDelayed: differenceInDays(new Date(), new Date(app.created_at)),
      applicant: app.applicant_name || app.first_name || "N/A"
    }));

  const getDelayColor = (days: number) => {
    if (days >= 15) return "text-red-600 bg-red-50";
    if (days >= 10) return "text-yellow-600 bg-yellow-50";
    return "text-green-600 bg-green-50";
  };

  const COLORS = ['#1e40af', '#dc2626', '#16a34a'];

  if (loading) {
    return (
      <SidebarProvider>
        <div className="min-h-screen flex w-full bg-gray-50">
          <BankManagerSidebar />
          <main className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <Loader2 className="h-12 w-12 animate-spin mx-auto text-blue-600" />
              <p className="mt-4 text-gray-600">Loading dashboard...</p>
            </div>
          </main>
        </div>
      </SidebarProvider>
    );
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-gray-50">
        <BankManagerSidebar />
        
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <SidebarTrigger className="text-muted-foreground hover:text-foreground" />
              <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                Bank Manager
              </Badge>
            </div>
            
            <div className="flex items-center space-x-3">
              <Select value={selectedYear} onValueChange={setSelectedYear}>
                <SelectTrigger className="w-32">
                  <Calendar className="h-4 w-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {getYearOptions().map((year) => (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select 
                value={selectedMonth} 
                onValueChange={(value) => {
                  setSelectedMonth(value);
                  if (value !== "all") {
                    setSelectedPeriod("overall"); // Reset period when month is selected
                  }
                }}
              >
                <SelectTrigger className="w-40">
                  <Calendar className="h-4 w-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {monthOptions.map((month) => (
                    <SelectItem key={month.value} value={month.value}>
                      {month.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              {selectedMonth === "all" && (
                <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                  <SelectTrigger className="w-40">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="3months">3 Months</SelectItem>
                    <SelectItem value="6months">6 Months</SelectItem>
                    <SelectItem value="overall">Year</SelectItem>
                  </SelectContent>
                </Select>
              )}
              
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    size="sm"
                    className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white border-red-600"
                  >
                    <LogOut className="h-4 w-4" />
                    Logout
                  </Button>
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
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
              <Card className="bg-white border-l-4 border-l-blue-500">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">Total Documents</CardTitle>
                  <FileText className="h-5 w-5 text-blue-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-gray-900">
                    {documentAnalytics.totalDocuments[selectedPeriod as keyof typeof documentAnalytics.totalDocuments]}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Total applications submitted
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-white border-l-4 border-l-yellow-500">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">Pending</CardTitle>
                  <Clock className="h-4 w-4 text-yellow-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-yellow-600">{documentAnalytics.pendingOpinions}</div>
                  <p className="text-xs text-gray-500 mt-1">To be assigned</p>
                </CardContent>
              </Card>

              <Card className="bg-white border-l-4 border-l-blue-500">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">In Review</CardTitle>
                  <div className="flex items-center space-x-2">
                    <Clock className="h-4 w-4 text-blue-500" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-blue-600">{documentAnalytics.inReview}</div>
                  <p className="text-xs text-gray-500 mt-1">Being reviewed</p>
                </CardContent>
              </Card>

              <Card className="bg-white border-l-4 border-l-green-500">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">Completed</CardTitle>
                  <CheckCircle className="h-4 w-4 text-green-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-green-600">{documentAnalytics.completedOpinions}</div>
                  <p className="text-xs text-gray-500 mt-1">Finalized</p>
                </CardContent>
              </Card>

              <Card className="bg-white border-l-4 border-l-red-500">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">Delayed Cases</CardTitle>
                  <AlertTriangle className="h-5 w-5 text-red-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-red-600">{documentAnalytics.delayedCases}</div>
                  <p className="text-xs text-gray-500 mt-1">
                    Pending for more than 7 days
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 gap-6">
              {/* Bar Chart */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Document Status Trend
                  </CardTitle>
                  <CardDescription>
                    {selectedPeriod === "month" ? "Last 4 weeks breakdown" : 
                     selectedPeriod === "quarter" ? "Last 3 months breakdown" : 
                     "Last 6 months breakdown"}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={statusTrendData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="pending" fill="#fbbf24" name="Pending" />
                      <Bar dataKey="inReview" fill="#3b82f6" name="In Review" />
                      <Bar dataKey="completed" fill="#16a34a" name="Completed" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            {/* Delayed Cases Table */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-red-500" />
                  Top Delayed Cases
                </CardTitle>
                <CardDescription>Cases requiring immediate attention</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  {delayedCasesData.length > 0 ? (
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-gray-200">
                          <th className="text-left py-3 px-4 font-medium text-gray-600">Case ID</th>
                          <th className="text-left py-3 px-4 font-medium text-gray-600">Document Type</th>
                          <th className="text-left py-3 px-4 font-medium text-gray-600">Applicant</th>
                          <th className="text-left py-3 px-4 font-medium text-gray-600">Submission Date</th>
                          <th className="text-left py-3 px-4 font-medium text-gray-600">Days Delayed</th>
                        </tr>
                      </thead>
                      <tbody>
                        {delayedCasesData.map((caseItem) => (
                          <tr key={caseItem.caseId} className="border-b border-gray-100 hover:bg-gray-50">
                            <td className="py-3 px-4 font-medium text-blue-600">{caseItem.caseId}</td>
                            <td className="py-3 px-4 text-gray-700">{caseItem.documentType}</td>
                            <td className="py-3 px-4 text-gray-700">{caseItem.applicant}</td>
                            <td className="py-3 px-4 text-gray-600">{caseItem.submissionDate}</td>
                            <td className="py-3 px-4">
                              <Badge className={getDelayColor(caseItem.daysDelayed)}>
                                {caseItem.daysDelayed} days
                              </Badge>
                            </td>
                          </tr>
                        ))}
                  </tbody>
                </table>
              ) : (
                <div className="py-8 text-center text-gray-500">
                  <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-500" />
                  <p>No delayed cases - All applications are on track!</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
        </div>
      </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default BankManagerDashboard;