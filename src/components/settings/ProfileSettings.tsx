import React from 'react';
import { DoctorSettingsSection } from '@/components/prescription/DoctorSettingsSection';
import { useTemplates } from '@/hooks/useTemplates';

export function ProfileSettings() {
  const { doctorProfile, updateDoctorProfile, clearImage } = useTemplates();

  return (
    <DoctorSettingsSection
      profile={doctorProfile}
      onUpdateProfile={updateDoctorProfile}
      onClearImage={clearImage}
    />
  );
}
