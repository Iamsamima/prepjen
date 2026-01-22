import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { User, Phone, Mail, MapPin, FileText } from 'lucide-react';

interface PatientInfo {
  name: string;
  phone: string;
  email: string;
  address: string;
  medicalHistory: string;
}

interface PatientInfoSectionProps {
  patientInfo: PatientInfo;
  onChange: (info: PatientInfo) => void;
}

export function PatientInfoSection({ patientInfo, onChange }: PatientInfoSectionProps) {
  const handleChange = (field: keyof PatientInfo, value: string) => {
    onChange({ ...patientInfo, [field]: value });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-4">
        <User className="h-5 w-5 text-primary" />
        <h2 className="text-xl font-semibold">Patient Information</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="name" className="flex items-center gap-2">
            <User className="h-4 w-4 text-muted-foreground" />
            Full Name
          </Label>
          <Input
            id="name"
            placeholder="Enter patient's full name"
            value={patientInfo.name}
            onChange={(e) => handleChange('name', e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="phone" className="flex items-center gap-2">
            <Phone className="h-4 w-4 text-muted-foreground" />
            Phone Number
          </Label>
          <Input
            id="phone"
            type="tel"
            placeholder="Enter phone number"
            value={patientInfo.phone}
            onChange={(e) => handleChange('phone', e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="email" className="flex items-center gap-2">
            <Mail className="h-4 w-4 text-muted-foreground" />
            Email Address
          </Label>
          <Input
            id="email"
            type="email"
            placeholder="Enter email address"
            value={patientInfo.email}
            onChange={(e) => handleChange('email', e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="address" className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-muted-foreground" />
            Address
          </Label>
          <Input
            id="address"
            placeholder="Enter address"
            value={patientInfo.address}
            onChange={(e) => handleChange('address', e.target.value)}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="medicalHistory" className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-muted-foreground" />
          Medical History
        </Label>
        <Textarea
          id="medicalHistory"
          placeholder="Enter relevant medical history, allergies, chronic conditions, previous surgeries, etc."
          value={patientInfo.medicalHistory}
          onChange={(e) => handleChange('medicalHistory', e.target.value)}
          rows={4}
          className="resize-none"
        />
      </div>
    </div>
  );
}
