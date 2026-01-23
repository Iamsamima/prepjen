import React, { useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { User, Building, Phone, Mail, FileImage, Trash2, Upload, Image, Clock, Globe, MapPin, Stethoscope } from 'lucide-react';
import { toast } from 'sonner';

interface DoctorProfile {
  name: string;
  qualifications: string;
  specialization: string;
  registrationNo: string;
  clinicName: string;
  clinicAddress: string;
  clinicCity: string;
  clinicState: string;
  clinicPincode: string;
  phone: string;
  email: string;
  website: string;
  chamberName: string;
  chamberAddress: string;
  chamberTimings: string;
  chamberPhone: string;
  signatureImage: string;
  headerImage: string;
  footerImage: string;
  logoImage: string;
}

interface DoctorSettingsSectionProps {
  profile: DoctorProfile;
  onUpdateProfile: (updates: Partial<DoctorProfile>) => void;
  onClearImage: (field: 'signatureImage' | 'headerImage' | 'footerImage' | 'logoImage') => void;
}

export function DoctorSettingsSection({
  profile,
  onUpdateProfile,
  onClearImage,
}: DoctorSettingsSectionProps) {
  const signatureInputRef = useRef<HTMLInputElement>(null);
  const headerInputRef = useRef<HTMLInputElement>(null);
  const footerInputRef = useRef<HTMLInputElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (
    field: 'signatureImage' | 'headerImage' | 'footerImage' | 'logoImage',
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

  const ImageUploadBox = ({
    label,
    image,
    field,
    inputRef,
    height = 'h-20',
  }: {
    label: string;
    image: string;
    field: 'signatureImage' | 'headerImage' | 'footerImage' | 'logoImage';
    inputRef: React.RefObject<HTMLInputElement>;
    height?: string;
  }) => (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="flex items-center gap-4">
        {image ? (
          <div className="relative border rounded-lg p-2 bg-white flex-1">
            <img
              src={image}
              alt={label}
              className={`${height} w-full object-contain`}
            />
            <Button
              variant="destructive"
              size="icon"
              className="absolute -top-2 -right-2 h-6 w-6"
              onClick={() => onClearImage(field)}
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        ) : (
          <div
            onClick={() => inputRef.current?.click()}
            className={`${height} flex-1 border-2 border-dashed rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-primary hover:bg-primary/5 transition-colors`}
          >
            <Upload className="h-5 w-5 text-muted-foreground mb-1" />
            <span className="text-xs text-muted-foreground">Upload {label}</span>
          </div>
        )}
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => handleImageUpload(field, e)}
        />
      </div>
    </div>
  );

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
            <Stethoscope className="h-4 w-4 text-muted-foreground" />
            Doctor Details
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="doctorName">Doctor Name *</Label>
              <Input
                id="doctorName"
                placeholder="Dr. John Doe"
                value={profile.name}
                onChange={(e) => handleChange('name', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="qualifications">Qualifications *</Label>
              <Input
                id="qualifications"
                placeholder="MBBS, MD, FRCP"
                value={profile.qualifications}
                onChange={(e) => handleChange('qualifications', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="specialization">Specialization</Label>
              <Input
                id="specialization"
                placeholder="General Medicine, Cardiology"
                value={profile.specialization}
                onChange={(e) => handleChange('specialization', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="registrationNo">Registration No. *</Label>
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
            <div className="space-y-2">
              <Label htmlFor="doctorEmail">Email</Label>
              <Input
                id="doctorEmail"
                type="email"
                placeholder="doctor@example.com"
                value={profile.email}
                onChange={(e) => handleChange('email', e.target.value)}
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="website">Website</Label>
              <Input
                id="website"
                type="url"
                placeholder="https://www.drclinic.com"
                value={profile.website}
                onChange={(e) => handleChange('website', e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Clinic/Hospital Details */}
      <Card>
        <CardContent className="p-4 space-y-4">
          <h3 className="font-medium flex items-center gap-2">
            <Building className="h-4 w-4 text-muted-foreground" />
            Clinic / Hospital Details
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="clinicName">Clinic/Hospital Name</Label>
              <Input
                id="clinicName"
                placeholder="City Health Clinic / Apollo Hospital"
                value={profile.clinicName}
                onChange={(e) => handleChange('clinicName', e.target.value)}
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="clinicAddress">Address</Label>
              <Textarea
                id="clinicAddress"
                placeholder="123 Medical Street, Near City Mall"
                value={profile.clinicAddress}
                onChange={(e) => handleChange('clinicAddress', e.target.value)}
                rows={2}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="clinicCity">City</Label>
              <Input
                id="clinicCity"
                placeholder="Mumbai"
                value={profile.clinicCity}
                onChange={(e) => handleChange('clinicCity', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="clinicState">State</Label>
              <Input
                id="clinicState"
                placeholder="Maharashtra"
                value={profile.clinicState}
                onChange={(e) => handleChange('clinicState', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="clinicPincode">Pincode</Label>
              <Input
                id="clinicPincode"
                placeholder="400001"
                value={profile.clinicPincode}
                onChange={(e) => handleChange('clinicPincode', e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Chamber Details (Optional) */}
      <Card>
        <CardContent className="p-4 space-y-4">
          <h3 className="font-medium flex items-center gap-2">
            <MapPin className="h-4 w-4 text-muted-foreground" />
            Chamber Details (Optional)
          </h3>
          <p className="text-sm text-muted-foreground">Add if you have a separate consultation chamber</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="chamberName">Chamber Name</Label>
              <Input
                id="chamberName"
                placeholder="Dr. Doe's Clinic"
                value={profile.chamberName}
                onChange={(e) => handleChange('chamberName', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="chamberPhone">Chamber Phone</Label>
              <Input
                id="chamberPhone"
                type="tel"
                placeholder="+91 98765 12345"
                value={profile.chamberPhone}
                onChange={(e) => handleChange('chamberPhone', e.target.value)}
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="chamberAddress">Chamber Address</Label>
              <Textarea
                id="chamberAddress"
                placeholder="456 Private Road, Downtown"
                value={profile.chamberAddress}
                onChange={(e) => handleChange('chamberAddress', e.target.value)}
                rows={2}
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="chamberTimings">Consultation Timings</Label>
              <Input
                id="chamberTimings"
                placeholder="Mon-Sat: 5:00 PM - 8:00 PM"
                value={profile.chamberTimings}
                onChange={(e) => handleChange('chamberTimings', e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Logo & Signature */}
      <Card>
        <CardContent className="p-4 space-y-4">
          <h3 className="font-medium flex items-center gap-2">
            <FileImage className="h-4 w-4 text-muted-foreground" />
            Logo & Signature
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <ImageUploadBox
              label="Clinic Logo"
              image={profile.logoImage}
              field="logoImage"
              inputRef={logoInputRef}
              height="h-16"
            />
            <ImageUploadBox
              label="Digital Signature"
              image={profile.signatureImage}
              field="signatureImage"
              inputRef={signatureInputRef}
              height="h-16"
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
          <p className="text-sm text-muted-foreground">
            Upload custom letterhead images. If not uploaded, a professional default will be used.
          </p>
          <div className="space-y-4">
            <ImageUploadBox
              label="Header Image (Letterhead Top)"
              image={profile.headerImage}
              field="headerImage"
              inputRef={headerInputRef}
              height="h-20"
            />
            <ImageUploadBox
              label="Footer Image (Letterhead Bottom)"
              image={profile.footerImage}
              field="footerImage"
              inputRef={footerInputRef}
              height="h-16"
            />
          </div>
        </CardContent>
      </Card>

      {/* Preview Info */}
      <Card className="bg-muted/50">
        <CardContent className="p-4">
          <h3 className="font-medium mb-2">📄 Prescription Features</h3>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>✓ Professional header & footer on every page</li>
            <li>✓ RX symbol for medications</li>
            <li>✓ Unique barcode for each prescription</li>
            <li>✓ QR code with clinic address (scannable)</li>
            <li>✓ Digital signature</li>
            <li>✓ Doctor & clinic details</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
