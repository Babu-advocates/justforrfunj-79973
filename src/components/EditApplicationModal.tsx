import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { FloatingInput } from "@/components/ui/floating-input";
import { FloatingTextarea } from "@/components/ui/floating-textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { uploadToR2 } from "@/lib/r2Storage";
import { useToast } from "@/hooks/use-toast";
import { getDistrictNames, getTaluksByDistrict } from "@/data/tamilnaduData";
import { Save, X, Upload, FileText, Trash2 } from "lucide-react";

interface EditApplicationModalProps {
  isOpen: boolean;
  onClose: () => void;
  application: any;
  onApplicationUpdate: () => void;
}

export const EditApplicationModal = ({ isOpen, onClose, application, onApplicationUpdate }: EditApplicationModalProps) => {
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  const [loanTypes, setLoanTypes] = useState<string[]>([]);
  const [taluks, setTaluks] = useState<string[]>([]);
  const [uploadedFiles, setUploadedFiles] = useState<any[]>([]);
  const [newFiles, setNewFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [formData, setFormData] = useState({
    borrower_name: "",
    customer_id: "",
    address: "",
    phone: "",
    email: "",
    district: "",
    taluk: "",
    village: "",
    application_type: "",
    bank_application_no: "",
    nature_of_property: "",
    location_of_property: "",
    survey_number: "",
    extent_of_property: "",
    plot_no: "",
    layout_name: "",
    loan_type: "",
    loan_amount: "",
    account_number: "",
    salesman_name: "",
    salesman_contact: "",
    salesman_email: "",
  });

  useEffect(() => {
    if (application) {
      setFormData({
        borrower_name: application.borrower_name || "",
        customer_id: application.customer_id || "",
        address: application.address || "",
        phone: application.phone || "",
        email: application.email || "",
        district: application.district || "",
        taluk: application.taluk || "",
        village: application.village || "",
        application_type: application.application_type || "",
        bank_application_no: application.bank_application_no || "",
        nature_of_property: application.nature_of_property || "",
        location_of_property: application.location_of_property || "",
        survey_number: application.survey_number || "",
        extent_of_property: application.extent_of_property || "",
        plot_no: application.plot_no || "",
        layout_name: application.layout_name || "",
        loan_type: application.loan_type || "",
        loan_amount: application.loan_amount?.toString() || "",
        account_number: application.account_number || "",
        salesman_name: application.salesman_name || "",
        salesman_contact: application.salesman_contact || "",
        salesman_email: application.salesman_email || "",
      });

      if (application.district) {
        setTaluks(getTaluksByDistrict(application.district));
      }

      // Load existing files
      if (application.uploaded_files) {
        setUploadedFiles(Array.isArray(application.uploaded_files) ? application.uploaded_files : []);
      } else {
        setUploadedFiles([]);
      }
      
      // IMPORTANT: Clear any pending new files when opening a different application
      setNewFiles([]);
    }
  }, [application]);

  useEffect(() => {
    fetchLoanTypes();
  }, []);

  const fetchLoanTypes = async () => {
    try {
      const { data, error } = await supabase
        .from('loan_types')
        .select('name')
        .order('name');

      if (error) throw error;
      setLoanTypes(data?.map(lt => lt.name) || []);
    } catch (error) {
      console.error('Error fetching loan types:', error);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));

    if (field === 'district') {
      const districtTaluks = getTaluksByDistrict(value);
      setTaluks(districtTaluks);
      setFormData(prev => ({ ...prev, taluk: '' }));
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);
      setNewFiles(prev => [...prev, ...filesArray]);
    }
  };

  const removeNewFile = (index: number) => {
    setNewFiles(prev => prev.filter((_, i) => i !== index));
  };

  const removeExistingFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const uploadFilesToSupabase = async () => {
    if (newFiles.length === 0) return uploadedFiles;

    setIsUploading(true);
    const allFiles = [...uploadedFiles];

    try {
      for (const file of newFiles) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${application.application_id}_${Date.now()}.${fileExt}`;
        const filePath = `application-documents/${fileName}`;

        const uploadResult = await uploadToR2('babuadvocate', filePath, file);

        if (!uploadResult.success) throw new Error('Upload failed');

        allFiles.push({
          name: file.name,
          url: uploadResult.publicUrl,
          type: file.type,
          size: file.size,
          uploadedAt: new Date().toISOString()
        });
      }

      return allFiles;
    } catch (error) {
      console.error('Error uploading files:', error);
      throw error;
    } finally {
      setIsUploading(false);
    }
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);

      // Upload new files if any
      const finalFiles = await uploadFilesToSupabase();

      const { error } = await supabase
        .from('applications')
        .update({
          borrower_name: formData.borrower_name,
          customer_id: formData.customer_id,
          address: formData.address,
          phone: formData.phone,
          email: formData.email,
          district: formData.district,
          taluk: formData.taluk,
          village: formData.village,
          application_type: formData.application_type,
          bank_application_no: formData.bank_application_no,
          nature_of_property: formData.nature_of_property,
          location_of_property: formData.location_of_property,
          survey_number: formData.survey_number,
          extent_of_property: formData.extent_of_property,
          plot_no: formData.plot_no,
          layout_name: formData.layout_name,
          loan_type: formData.loan_type,
          loan_amount: parseFloat(formData.loan_amount) || 0,
          account_number: formData.account_number,
          salesman_name: formData.salesman_name,
          salesman_contact: formData.salesman_contact,
          salesman_email: formData.salesman_email,
          uploaded_files: finalFiles,
          updated_at: new Date().toISOString(),
        })
        .eq('id', application.id);

      if (error) {
        console.error('Error updating application:', error);
        toast({
          title: "Error",
          description: "Failed to update application",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Success",
        description: "Application updated successfully",
      });

      // Clear state after successful save
      setNewFiles([]);
      setUploadedFiles([]);
      
      onApplicationUpdate();
      onClose();
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (!application) return null;

  const handleClose = () => {
    // Clear state when modal is closed without saving
    setNewFiles([]);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Application - {application.application_id}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Applicant Details */}
          <Card>
            <CardHeader>
              <CardTitle>Applicant Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FloatingInput
                  label="Applicant Full Name"
                  value={formData.borrower_name}
                  onChange={(e) => handleInputChange('borrower_name', e.target.value)}
                />
                <FloatingInput
                  label="Customer ID"
                  value={formData.customer_id}
                  onChange={(e) => handleInputChange('customer_id', e.target.value)}
                />
                <FloatingInput
                  label="Phone"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                />
                <FloatingInput
                  label="Email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                />
              </div>
              <FloatingTextarea
                label="Address"
                value={formData.address}
                onChange={(e) => handleInputChange('address', e.target.value)}
                rows={3}
              />
            </CardContent>
          </Card>

          {/* Location Details */}
          <Card>
            <CardHeader>
              <CardTitle>Location Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">District</label>
                  <Select value={formData.district} onValueChange={(value) => handleInputChange('district', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select district" />
                    </SelectTrigger>
                    <SelectContent>
                      {getDistrictNames().map((district) => (
                        <SelectItem key={district} value={district}>{district}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Taluk</label>
                  <Select value={formData.taluk} onValueChange={(value) => handleInputChange('taluk', value)} disabled={!formData.district}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select taluk" />
                    </SelectTrigger>
                    <SelectContent>
                      {taluks.map((taluk) => (
                        <SelectItem key={taluk} value={taluk}>{taluk}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <FloatingInput
                  label="Village"
                  value={formData.village}
                  onChange={(e) => handleInputChange('village', e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Property Details */}
          <Card>
            <CardHeader>
              <CardTitle>Property Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FloatingInput
                  label="Bank Application No"
                  value={formData.bank_application_no}
                  onChange={(e) => handleInputChange('bank_application_no', e.target.value)}
                />
                <FloatingInput
                  label="Nature of Property"
                  value={formData.nature_of_property}
                  onChange={(e) => handleInputChange('nature_of_property', e.target.value)}
                />
                <FloatingInput
                  label="Location of Property"
                  value={formData.location_of_property}
                  onChange={(e) => handleInputChange('location_of_property', e.target.value)}
                />
                <FloatingInput
                  label="Survey Number"
                  value={formData.survey_number}
                  onChange={(e) => handleInputChange('survey_number', e.target.value)}
                />
                <FloatingInput
                  label="Extent of Property"
                  value={formData.extent_of_property}
                  onChange={(e) => handleInputChange('extent_of_property', e.target.value)}
                />
                <FloatingInput
                  label="Plot No"
                  value={formData.plot_no}
                  onChange={(e) => handleInputChange('plot_no', e.target.value)}
                />
                <FloatingInput
                  label="Layout Name"
                  value={formData.layout_name}
                  onChange={(e) => handleInputChange('layout_name', e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Loan Details */}
          <Card>
            <CardHeader>
              <CardTitle>Loan Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Loan Type</label>
                  <Select value={formData.loan_type} onValueChange={(value) => handleInputChange('loan_type', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select loan type" />
                    </SelectTrigger>
                    <SelectContent>
                      {loanTypes.map((type) => (
                        <SelectItem key={type} value={type}>{type}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <FloatingInput
                  label="Loan Amount"
                  type="number"
                  value={formData.loan_amount}
                  onChange={(e) => handleInputChange('loan_amount', e.target.value)}
                />
                <FloatingInput
                  label="Account Number"
                  value={formData.account_number}
                  onChange={(e) => handleInputChange('account_number', e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Salesman Details */}
          <Card>
            <CardHeader>
              <CardTitle>Salesman Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FloatingInput
                  label="Salesman Name"
                  value={formData.salesman_name}
                  onChange={(e) => handleInputChange('salesman_name', e.target.value)}
                />
                <FloatingInput
                  label="Salesman Contact"
                  value={formData.salesman_contact}
                  onChange={(e) => handleInputChange('salesman_contact', e.target.value)}
                />
                <FloatingInput
                  label="Salesman Email"
                  value={formData.salesman_email}
                  onChange={(e) => handleInputChange('salesman_email', e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Documents Section */}
          <Card>
            <CardHeader>
              <CardTitle>Documents</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Existing Files */}
              {uploadedFiles.length > 0 && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Existing Documents</label>
                  <div className="space-y-2">
                    {uploadedFiles.map((file, index) => (
                      <div key={index} className="flex items-center justify-between p-3 border rounded-lg bg-muted/50">
                        <div className="flex items-center gap-3">
                          <FileText className="h-5 w-5 text-primary" />
                          <div>
                            <p className="text-sm font-medium">{file.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {file.uploadedAt ? new Date(file.uploadedAt).toLocaleDateString() : 'Previously uploaded'}
                            </p>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeExistingFile(index)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* New Files */}
              {newFiles.length > 0 && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">New Documents to Upload</label>
                  <div className="space-y-2">
                    {newFiles.map((file, index) => (
                      <div key={index} className="flex items-center justify-between p-3 border rounded-lg bg-primary/5">
                        <div className="flex items-center gap-3">
                          <Upload className="h-5 w-5 text-primary" />
                          <div>
                            <p className="text-sm font-medium">{file.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {(file.size / 1024 / 1024).toFixed(2)} MB
                            </p>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeNewFile(index)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Upload Button */}
              <div>
                <input
                  type="file"
                  multiple
                  id="file-upload"
                  className="hidden"
                  onChange={handleFileChange}
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                />
                <label htmlFor="file-upload">
                  <Button type="button" variant="outline" className="w-full" asChild>
                    <span>
                      <Upload className="h-4 w-4 mr-2" />
                      Add Documents
                    </span>
                  </Button>
                </label>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={handleClose} disabled={isSaving}>
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isSaving || isUploading}>
              <Save className="h-4 w-4 mr-2" />
              {isSaving ? 'Saving...' : isUploading ? 'Uploading...' : 'Save Changes'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
