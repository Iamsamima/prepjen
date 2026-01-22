import React, { useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { User, Building, Phone, Mail, FileImage, Trash2, Upload, Image } from 'lucide-react';
import { toast } from 'sonner';

interface DoctorProfile {
  name: string;
  qualifications: string;
  registrationNo: string;
  clinicName: string;
  clinicAddress: string;
  phone: string;
  email: string;
  signatureImage: string;
  headerImage: string;
  footerImage: string;
}

interface DoctorSettingsSectionProps {
  profile: DoctorProfile;
  onUpdateProfile: (updates: Partial<DoctorProfile>) => void;
  onClearImage: (field: 'signatureImage' | 'headerImage' | 'footerImage') => void;
}

export function DoctorSettingsSection({
  profile,
  onUpdateProfile,
  onClearImage,
}: DoctorSettingsSectionProps) {
  const signatureInputRef = useRef<HTMLInputElement>(null);
  const headerInputRef = useRef<HTMLInputElement>(null);
  const footerInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (
    field: 'signatureImage' | 'headerImage' | 'footerImage',
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast.error('Image size should be less than 2MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const base64 = e.target?.result as string;
      onUpdateProfile({ [field]: base64 });
      toast.success('Image uploaded successfully');
    };
    reader.readAsDataURL(file);
  };

  const handleChange = (field: keyof DoctorProfile, value: string) => {
    onUpdateProfile({ [field]: value });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-4">
        <User className="h-5 w-5 text-primary" />
        <h2 className="text-xl font-semibold">Doctor Profile & Settings</h2>
      </div>

      {/* Doctor Details */}
      <Card>
        <CardContent className="p-4 space-y-4">
          <h3 className="font-medium flex items-center gap-2">
            <User className="h-4 w-4 text-muted-foreground" />
            Doctor Details
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="doctorName">Doctor Name</Label>
              <Input
                id="doctorName"
                placeholder="Dr. John Doe"
                value={profile.name}
                onChange={(e) => handleChange('name', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="qualifications">Qualifications</Label>
              <Input
                id="qualifications"
                placeholder="MBBS, MD"
                value={profile.qualifications}
                onChange={(e) => handleChange('qualifications', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="registrationNo">Registration No.</Label>
              <Input
                id="registrationNo"
                placeholder="MCI-12345"
                value={profile.registrationNo}
                onChange={(e) => handleChange('registrationNo', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="doctorPhone">Phone</Label>
              <Input
                id="doctorPhone"
                type="tel"
                placeholder="+91 98765 43210"
                value={profile.phone}
                onChange={(e) => handleChange('phone', e.target.value)}
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="doctorEmail">Email</Label>
              <Input
                id="doctorEmail"
                type="email"
                placeholder="doctor@example.com"
                value={profile.email}
                onChange={(e) => handleChange('email', e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Clinic Details */}
      <Card>
        <CardContent className="p-4 space-y-4">
          <h3 className="font-medium flex items-center gap-2">
            <Building className="h-4 w-4 text-muted-foreground" />
            Clinic Details
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="clinicName">Clinic Name</Label>
              <Input
                id="clinicName"
                placeholder="City Health Clinic"
                value={profile.clinicName}
                onChange={(e) => handleChange('clinicName', e.target.value)}
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="clinicAddress">Clinic Address</Label>
              <Input
                id="clinicAddress"
                placeholder="123 Medical Street, City, State - 123456"
                value={profile.clinicAddress}
                onChange={(e) => handleChange('clinicAddress', e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Signature */}
      <Card>
        <CardContent className="p-4 space-y-4">
          <h3 className="font-medium flex items-center gap-2">
            <FileImage className="h-4 w-4 text-muted-foreground" />
            Digital Signature
          </h3>
          <div className="flex items-center gap-4">
            {profile.signatureImage ? (
              <div className="relative border rounded-lg p-2 bg-white">
                <img
                  src={profile.signatureImage}
                  alt="Signature"
                  className="h-16 max-w-[200px] object-contain"
                />
                <Button
                  variant="destructive"
                  size="icon"
                  className="absolute -top-2 -right-2 h-6 w-6"
                  onClick={() => onClearImage('signatureImage')}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            ) : (
              <div
                onClick={() => signatureInputRef.current?.click()}
                className="h-20 w-48 border-2 border-dashed rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-primary hover:bg-primary/5 transition-colors"
              >
                <Upload className="h-5 w-5 text-muted-foreground mb-1" />
                <span className="text-xs text-muted-foreground">Upload Signature</span>
              </div>
            )}
            <input
              ref={signatureInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => handleImageUpload('signatureImage', e)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Header & Footer */}
      <Card>
        <CardContent className="p-4 space-y-4">
          <h3 className="font-medium flex items-center gap-2">
            <Image className="h-4 w-4 text-muted-foreground" />
            Prescription Header & Footer
          </h3>
          
          <div className="space-y-4">
            {/* Header */}
            <div className="space-y-2">
              <Label>Header Image</Label>
              <div className="flex items-center gap-4">
                {profile.headerImage ? (
                  <div className="relative border rounded-lg p-2 bg-white flex-1">
                    <img
                      src={profile.headerImage}
                      alt="Header"
                      className="h-20 w-full object-contain"
                    />
                    <Button
                      variant="destructive"
                      size="icon"
                      className="absolute -top-2 -right-2 h-6 w-6"
                      onClick={() => onClearImage('headerImage')}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                ) : (
                  <div
                    onClick={() => headerInputRef.current?.click()}
                    className="h-20 flex-1 border-2 border-dashed rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-primary hover:bg-primary/5 transition-colors"
                  >
                    <Upload className="h-5 w-5 text-muted-foreground mb-1" />
                    <span className="text-xs text-muted-foreground">Upload Header (letterhead)</span>
                  </div>
                )}
                <input
                  ref={headerInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => handleImageUpload('headerImage', e)}
                />
              </div>
            </div>

            {/* Footer */}
            <div className="space-y-2">
              <Label>Footer Image</Label>
              <div className="flex items-center gap-4">
                {profile.footerImage ? (
                  <div className="relative border rounded-lg p-2 bg-white flex-1">
                    <img
                      src={profile.footerImage}
                      alt="Footer"
                      className="h-16 w-full object-contain"
                    />
                    <Button
                      variant="destructive"
                      size="icon"
                      className="absolute -top-2 -right-2 h-6 w-6"
                      onClick={() => onClearImage('footerImage')}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                ) : (
                  <div
                    onClick={() => footerInputRef.current?.click()}
                    className="h-16 flex-1 border-2 border-dashed rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-primary hover:bg-primary/5 transition-colors"
                  >
                    <Upload className="h-5 w-5 text-muted-foreground mb-1" />
                    <span className="text-xs text-muted-foreground">Upload Footer</span>
                  </div>
                )}
                <input
                  ref={footerInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => handleImageUpload('footerImage', e)}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
