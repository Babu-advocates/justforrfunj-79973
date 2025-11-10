import { useState, useEffect } from "react";
import { SidebarProvider } from "@/components/ui/sidebar";
import { BankManagerSidebar } from "@/components/BankManagerSidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { supabase } from "@/integrations/supabase/client";
import { showToast } from "@/lib/toast";
import { differenceInDays, format, isWithinInterval, startOfYear, endOfYear } from "date-fns";
import { Search, Download, FileText, TrendingUp, TrendingDown, Clock, CheckCircle, XCircle, AlertTriangle, Loader2, CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
interface Application {
  application_id: string;
  application_type: string;
  bank_name: string | null;
  loan_amount: number | null;
  loan_type: string | null;
  status: string | null;
  created_at: string;
  updated_at: string;
  [key: string]: any; // Allow additional properties from the database
}
interface SummaryStats {
  totalApplications: number;
  approvedApplications: number;
  rejectedApplications: number;
  pendingApplications: number;
  totalDisbursed: number;
  averageProcessingTime: number;
  approvalRate: number;
}
const ReportsAnalytics = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterLoanType, setFilterLoanType] = useState("all");
  const [selectedYear, setSelectedYear] = useState<string>("2025");
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [bankNames, setBankNames] = useState<string[]>([]);
  const [loanTypes, setLoanTypes] = useState<string[]>([]);
  const [summaryStats, setSummaryStats] = useState<SummaryStats>({
    totalApplications: 0,
    approvedApplications: 0,
    rejectedApplications: 0,
    pendingApplications: 0,
    totalDisbursed: 0,
    averageProcessingTime: 0,
    approvalRate: 0
  });
  useEffect(() => {
    fetchBankManagerInfo();
  }, []);
  useEffect(() => {
    if (bankNames.length > 0) {
      fetchApplications();
    }
  }, [bankNames]);
  useEffect(() => {
    if (applications.length > 0) {
      calculateStats();
      extractLoanTypes();
    }
  }, [applications]);

  // Removed auto-filling of dates - user wants them empty initially
  useEffect(() => {
    if (bankNames.length === 0) return;
    const channel = supabase.channel('applications-changes').on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'applications'
    }, () => {
      fetchApplications();
    }).subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [bankNames]);
  const fetchBankManagerInfo = async () => {
    const username = localStorage.getItem("bankManagerUsername");
    if (!username) {
      showToast.error("Please log in again");
      return;
    }
    const {
      data,
      error
    } = await supabase.from("bank_manager_accounts").select("bank_name").eq("username", username).single();
    if (error) {
      console.error("Error fetching bank manager info:", error);
      showToast.error("Failed to load bank information");
      return;
    }
    if (data) {
      const banks = Array.isArray(data.bank_name) ? data.bank_name : [data.bank_name];
      setBankNames(banks);
    }
  };
  const fetchApplications = async () => {
    setLoading(true);
    if (bankNames.length === 0) {
      setLoading(false);
      return;
    }
    const {
      data,
      error
    } = await supabase.from("applications").select("*").in("bank_name", bankNames).order("created_at", {
      ascending: false
    });
    if (error) {
      console.error("Error fetching applications:", error);
      showToast.error("Failed to load applications");
      setLoading(false);
      return;
    }
    setApplications(data || []);
    setLoading(false);
  };
  const calculateStats = () => {
    const total = applications.length;
    const approved = applications.filter(app => app.status?.toLowerCase() === "approved").length;
    const rejected = applications.filter(app => app.status?.toLowerCase() === "rejected").length;
    const pending = applications.filter(app => app.status?.toLowerCase() === "pending" || app.status?.toLowerCase() === "under review").length;
    const totalDisbursed = applications.filter(app => app.status?.toLowerCase() === "approved" && app.loan_amount).reduce((sum, app) => sum + (app.loan_amount || 0), 0);
    const processingTimes = applications.map(app => differenceInDays(new Date(app.updated_at), new Date(app.created_at)));
    const avgProcessingTime = processingTimes.length > 0 ? processingTimes.reduce((a, b) => a + b, 0) / processingTimes.length : 0;
    const approvalRate = total > 0 ? approved / total * 100 : 0;
    setSummaryStats({
      totalApplications: total,
      approvedApplications: approved,
      rejectedApplications: rejected,
      pendingApplications: pending,
      totalDisbursed,
      averageProcessingTime: avgProcessingTime,
      approvalRate
    });
  };
  const extractLoanTypes = () => {
    const uniqueTypes = Array.from(new Set(applications.map(app => app.loan_type).filter(type => type !== null && type !== undefined && type !== ''))).sort();
    setLoanTypes(uniqueTypes);
  };
  const filteredReports = applications.filter(app => {
    const applicantName = app.applicant_name || app.first_name || "";
    const matchesSearch = app.application_id.toLowerCase().includes(searchTerm.toLowerCase()) || applicantName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === "all" || app.status?.toLowerCase() === filterStatus.toLowerCase();
    const matchesLoanType = filterLoanType === "all" || app.loan_type === filterLoanType;
    
    // Date filtering
    const appDate = new Date(app.created_at);
    const yearStart = startOfYear(new Date(parseInt(selectedYear), 0, 1));
    const yearEnd = endOfYear(new Date(parseInt(selectedYear), 0, 1));
    
    let matchesDate = isWithinInterval(appDate, { start: yearStart, end: yearEnd });
    
    // If start and end dates are selected, use them
    if (startDate && endDate) {
      matchesDate = isWithinInterval(appDate, { start: startDate, end: endDate });
    } else if (startDate) {
      matchesDate = appDate >= startDate && appDate <= yearEnd;
    } else if (endDate) {
      matchesDate = appDate >= yearStart && appDate <= endDate;
    }
    
    return matchesSearch && matchesStatus && matchesLoanType && matchesDate;
  });
  const getStatusBadge = (status: string | null) => {
    if (!status) return null;
    const statusConfig: Record<string, {
      color: string;
      icon: any;
    }> = {
      "approved": {
        color: "bg-green-100 text-green-800 border-green-200",
        icon: CheckCircle
      },
      "rejected": {
        color: "bg-red-100 text-red-800 border-red-200",
        icon: XCircle
      },
      "under review": {
        color: "bg-yellow-100 text-yellow-800 border-yellow-200",
        icon: Clock
      },
      "pending": {
        color: "bg-blue-100 text-blue-800 border-blue-200",
        icon: AlertTriangle
      }
    };
    const config = statusConfig[status.toLowerCase()];
    if (!config) return <Badge variant="outline">{status}</Badge>;
    const Icon = config.icon;
    return <Badge variant="outline" className={config.color}>
        <Icon className="h-3 w-3 mr-1" />
        {status}
      </Badge>;
  };
  const generateDetailedPDF = (applications: Application[], filename: string) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;

    // Title
    doc.setFontSize(18);
    doc.text("Case Reports - Detailed Application Information", pageWidth / 2, 15, {
      align: "center"
    });
    doc.setFontSize(10);
    doc.text(`Generated on: ${format(new Date(), "dd MMM yyyy, hh:mm a")}`, pageWidth / 2, 22, {
      align: "center"
    });
    let yPosition = 30;
    applications.forEach((app, index) => {
      // Start each application on a new page (except the first one)
      if (index > 0) {
        doc.addPage();
        yPosition = 20;
      }

      // Application header
      doc.setFillColor(240, 240, 240);
      doc.rect(10, yPosition, pageWidth - 20, 8, "F");
      doc.setFontSize(12);
      doc.setFont(undefined, "bold");
      doc.text(`Application #${index + 1}: ${app.application_id}`, 12, yPosition + 5);
      yPosition += 12;

      // Prepare all application details
      const allFields: [string, string][] = [];

      // Add all fields from the application object (excluding uploaded files)
      Object.keys(app).forEach(key => {
        // Skip uploaded file fields
        if (key.includes('uploaded_') || key.includes('_file') || key.includes('_url') || key.includes('document')) {
          return;
        }
        
        if (key === 'created_at' || key === 'updated_at') {
          allFields.push([key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()), format(new Date(app[key]), "dd MMM yyyy, hh:mm a")]);
        } else if (app[key] !== null && app[key] !== undefined && app[key] !== '') {
          const value = typeof app[key] === 'object' ? JSON.stringify(app[key]) : String(app[key]);
          allFields.push([key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()), value]);
        }
      });

      // Add processing time
      const processingDays = differenceInDays(new Date(app.updated_at), new Date(app.created_at));
      allFields.push(['Processing Time', `${processingDays} days`]);

      // Create table for this application
      autoTable(doc, {
        startY: yPosition,
        head: [['Field', 'Value']],
        body: allFields,
        theme: 'grid',
        headStyles: {
          fillColor: [66, 139, 202],
          fontSize: 10,
          fontStyle: 'bold'
        },
        bodyStyles: {
          fontSize: 9
        },
        columnStyles: {
          0: {
            cellWidth: 60,
            fontStyle: 'bold'
          },
          1: {
            cellWidth: 120
          }
        },
        margin: {
          left: 10,
          right: 10
        },
        didDrawPage: function (data) {
          // Footer with page number
          doc.setFontSize(8);
          doc.text(`Page ${doc.getCurrentPageInfo().pageNumber}`, pageWidth / 2, doc.internal.pageSize.height - 10, {
            align: 'center'
          });
        }
      });
      // Update yPosition after table (not needed since each app gets new page, but keep for consistency)
      yPosition = (doc as any).lastAutoTable.finalY + 8;
    });
    doc.save(filename);
    showToast.success(`PDF downloaded with ${applications.length} application(s)`);
  };
  const handleDownloadReport = (fileFormat: string) => {
    const filename = `case_reports_${new Date().toISOString().split('T')[0]}.pdf`;
    if (fileFormat === 'pdf') {
      generateDetailedPDF(filteredReports, filename);
      return;
    }

    // CSV fallback - exclude uploaded file fields
    const csvFilename = `case_reports_${new Date().toISOString().split('T')[0]}.csv`;
    const element = document.createElement("a");
    
    // Get all non-upload field headers from first application
    const sampleApp = filteredReports[0];
    const headers = ['Application ID'];
    if (sampleApp) {
      Object.keys(sampleApp).forEach(key => {
        if (!key.includes('uploaded_') && !key.includes('_file') && !key.includes('_url') && !key.includes('document') && key !== 'application_id') {
          headers.push(key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()));
        }
      });
    }
    
    const csvRows = [headers.join(',')];
    filteredReports.forEach(app => {
      const row = [app.application_id || 'N/A'];
      Object.keys(app).forEach(key => {
        if (!key.includes('uploaded_') && !key.includes('_file') && !key.includes('_url') && !key.includes('document') && key !== 'application_id') {
          const value = app[key] !== null && app[key] !== undefined ? app[key] : 'N/A';
          row.push(`"${String(value).replace(/"/g, '""')}"`);
        }
      });
      csvRows.push(row.join(','));
    });
    
    const fileContent = csvRows.join('\n');
    const file = new Blob([fileContent], {
      type: 'text/csv'
    });
    element.href = URL.createObjectURL(file);
    element.download = csvFilename;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    showToast.success(`Report downloaded as CSV`);
  };
  const handleDownloadSingleReport = (report: Application) => {
    const filename = `${report.application_id}_report.pdf`;
    generateDetailedPDF([report], filename);
  };
  if (loading) {
    return <SidebarProvider>
        <div className="min-h-screen flex w-full bg-gray-50">
          <BankManagerSidebar />
          <main className="flex-1 flex items-center justify-center bg-gray-50">
            <div className="text-center">
              <Loader2 className="h-12 w-12 animate-spin mx-auto text-blue-600" />
              <p className="mt-4 text-gray-600">Loading reports...</p>
            </div>
          </main>
        </div>
      </SidebarProvider>;
  }
  return <SidebarProvider>
      <div className="min-h-screen flex w-full bg-gray-50">
        <BankManagerSidebar />
        
        <main className="flex-1 p-6 bg-gray-50">
          <div className="max-w-7xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Reports & Analytics</h1>
                <p className="text-gray-600 mt-1">Comprehensive case reports and analytics dashboard</p>
              </div>
              <div className="flex gap-2">
                <Button onClick={() => handleDownloadReport('csv')} className="flex items-center gap-2">
                  <Download className="h-4 w-4" />
                  Download CSV
                </Button>
                <Button onClick={() => handleDownloadReport('pdf')} variant="outline" className="flex items-center gap-2">
                  <Download className="h-4 w-4" />
                  Download PDF
                </Button>
              </div>
            </div>

            <Tabs defaultValue="summary" className="space-y-6">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="summary">Summary Dashboard</TabsTrigger>
                <TabsTrigger value="reports">Case Reports</TabsTrigger>
                <TabsTrigger value="analytics">Analytics</TabsTrigger>
              </TabsList>

              <TabsContent value="summary" className="space-y-6">
                {/* Summary Stats */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Total Applications</CardTitle>
                      <FileText className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{summaryStats.totalApplications}</div>
                      <p className="text-xs text-muted-foreground">All time applications</p>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Approval Rate</CardTitle>
                      <TrendingUp className="h-4 w-4 text-green-500" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{summaryStats.approvalRate.toFixed(1)}%</div>
                      <p className="text-xs text-muted-foreground">{summaryStats.approvedApplications} approved</p>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Total Disbursed</CardTitle>
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">₹{(summaryStats.totalDisbursed / 10000000).toFixed(2)}Cr</div>
                      <p className="text-xs text-muted-foreground">Approved loan amount</p>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Avg Processing Time</CardTitle>
                      <Clock className="h-4 w-4 text-blue-500" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{summaryStats.averageProcessingTime.toFixed(1)} days</div>
                      <p className="text-xs text-muted-foreground">Average turnaround time</p>
                    </CardContent>
                  </Card>
                </div>

                {/* Status Breakdown */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Application Status Breakdown</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          Approved
                        </span>
                        <span className="font-semibold">{summaryStats.approvedApplications}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="flex items-center gap-2">
                          <XCircle className="h-4 w-4 text-red-500" />
                          Rejected
                        </span>
                        <span className="font-semibold">{summaryStats.rejectedApplications}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-yellow-500" />
                          Pending
                        </span>
                        <span className="font-semibold">{summaryStats.pendingApplications}</span>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Recent Activity</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {applications.slice(0, 3).length > 0 ? <div className="space-y-3">
                          {applications.slice(0, 3).map(app => <div key={app.application_id} className="text-sm">
                              <span className="font-medium">{app.application_id}</span> - {app.status}
                              <span className="text-gray-500 block">
                                {format(new Date(app.updated_at), "MMM dd, yyyy")}
                              </span>
                            </div>)}
                        </div> : <p className="text-sm text-gray-500">No recent activity</p>}
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="reports" className="space-y-6">
                {/* Filters */}
                <Card>
                  <CardHeader>
                    <CardTitle>Filter Reports</CardTitle>
                    <CardDescription>Filter case reports by various criteria</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="relative">
                          <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                          <Input placeholder="Search applications..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-10" />
                        </div>
                        
                        <Select value={filterStatus} onValueChange={setFilterStatus}>
                          <SelectTrigger>
                            <SelectValue placeholder="Status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Status</SelectItem>
                            <SelectItem value="approved">Approved</SelectItem>
                            <SelectItem value="rejected">Rejected</SelectItem>
                            <SelectItem value="under review">Under Review</SelectItem>
                            <SelectItem value="pending">Pending</SelectItem>
                          </SelectContent>
                        </Select>

                        <Select value={filterLoanType} onValueChange={setFilterLoanType}>
                          <SelectTrigger>
                            <SelectValue placeholder="Loan Type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Types</SelectItem>
                            {loanTypes.map(type => <SelectItem key={type} value={type}>
                                {type}
                              </SelectItem>)}
                          </SelectContent>
                        </Select>

                        <Select value={selectedYear} onValueChange={setSelectedYear}>
                          <SelectTrigger>
                            <SelectValue placeholder="Year" />
                          </SelectTrigger>
                          <SelectContent>
                            {Array.from({ length: 2099 - 2000 + 1 }, (_, i) => 2000 + i).map(year => (
                              <SelectItem key={year} value={year.toString()}>
                                {year}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !startDate && "text-muted-foreground")}>
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {startDate ? format(startDate, "PPP") : "Start Date"}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar 
                              mode="single" 
                              selected={startDate} 
                              onSelect={setStartDate} 
                              defaultMonth={new Date(parseInt(selectedYear), 0)} 
                              initialFocus 
                              className="pointer-events-auto" 
                            />
                          </PopoverContent>
                        </Popover>

                        <Popover>
                          <PopoverTrigger asChild>
                            <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !endDate && "text-muted-foreground")}>
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {endDate ? format(endDate, "PPP") : "End Date"}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar 
                              mode="single" 
                              selected={endDate} 
                              onSelect={setEndDate} 
                              defaultMonth={new Date(parseInt(selectedYear), 11)} 
                              initialFocus 
                              className="pointer-events-auto" 
                            />
                          </PopoverContent>
                        </Popover>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Reports Table */}
                <Card>
                  <CardHeader>
                    <div className="flex justify-between items-center">
                      <div>
                        <CardTitle>Case Reports</CardTitle>
                        <CardDescription>Showing {filteredReports.length} of {applications.length} reports</CardDescription>
                      </div>
                      
                    </div>
                  </CardHeader>
                  <CardContent>
                    {filteredReports.length > 0 ? <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Application No.</TableHead>
                            <TableHead>Applicant</TableHead>
                            <TableHead>Loan Amount</TableHead>
                            <TableHead>Loan Type</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Processing Time</TableHead>
                            <TableHead>Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredReports.map(report => <TableRow key={report.application_id}>
                              <TableCell className="font-medium">{report.application_id}</TableCell>
                              <TableCell>{report.applicant_name || report.first_name || "N/A"}</TableCell>
                              <TableCell>₹{report.loan_amount?.toLocaleString() || "N/A"}</TableCell>
                              <TableCell>{report.loan_type || "N/A"}</TableCell>
                              <TableCell>{getStatusBadge(report.status)}</TableCell>
                              <TableCell>
                                {differenceInDays(new Date(report.updated_at), new Date(report.created_at))} days
                              </TableCell>
                              <TableCell>
                                <Button variant="outline" size="sm" onClick={() => handleDownloadSingleReport(report)}>
                                  <Download className="h-3 w-3 mr-1" />
                                  Download
                                </Button>
                              </TableCell>
                            </TableRow>)}
                        </TableBody>
                      </Table> : <div className="text-center py-8 text-gray-500">
                        No applications found matching your filters
                      </div>}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="analytics" className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Performance Metrics</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span>Average Processing Time</span>
                        <span className="font-semibold">{summaryStats.averageProcessingTime.toFixed(1)} days</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span>Approval Rate</span>
                        <span className="font-semibold">{summaryStats.approvalRate.toFixed(1)}%</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span>Total Applications</span>
                        <span className="font-semibold">{summaryStats.totalApplications}</span>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Application Distribution</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span>Approved Applications</span>
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          <span className="font-semibold text-green-600">{summaryStats.approvedApplications}</span>
                        </div>
                      </div>
                      <div className="flex justify-between items-center">
                        <span>Rejected Applications</span>
                        <div className="flex items-center gap-2">
                          <XCircle className="h-4 w-4 text-red-500" />
                          <span className="font-semibold text-red-600">{summaryStats.rejectedApplications}</span>
                        </div>
                      </div>
                      <div className="flex justify-between items-center">
                        <span>Pending Applications</span>
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-yellow-500" />
                          <span className="font-semibold text-yellow-600">{summaryStats.pendingApplications}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>
    </SidebarProvider>;
};
export default ReportsAnalytics;