import { useState, useEffect, useCallback } from 'react';

interface MedicineTemplate {
  id: string;
  name: string;
  medicines: any[];
  createdAt: number;
}

interface DiagnosisTemplate {
  id: string;
  name: string;
  diagnoses: { name: string; confidence?: string; description?: string }[];
  diagnosisType: string;
  createdAt: number;
}

interface PrescriptionTemplate {
  id: string;
  name: string;
  patientInfo: any;
  vitals: any;
  symptoms: string[];
  clinicalFindings: string;
  diagnoses: any[];
  diagnosisType: string;
  tests: any[];
  medicines: any[];
  createdAt: number;
}

interface SavedDiagnosis {
  name: string;
  usageCount: number;
  lastUsed: number;
}

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
  // Chamber details (optional)
  chamberName: string;
  chamberAddress: string;
  chamberTimings: string;
  chamberPhone: string;
  // Images
  signatureImage: string;
  headerImage: string;
  footerImage: string;
  logoImage: string;
}

const STORAGE_KEYS = {
  medicineTemplates: 'prescription_medicine_templates',
  diagnosisTemplates: 'prescription_diagnosis_templates',
  prescriptionTemplates: 'prescription_templates',
  savedDiagnoses: 'prescription_saved_diagnoses',
  doctorProfile: 'prescription_doctor_profile',
};

function generateId(): string {
  return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export function useTemplates() {
  const [medicineTemplates, setMedicineTemplates] = useState<MedicineTemplate[]>([]);
  const [diagnosisTemplates, setDiagnosisTemplates] = useState<DiagnosisTemplate[]>([]);
  const [prescriptionTemplates, setPrescriptionTemplates] = useState<PrescriptionTemplate[]>([]);
  const [savedDiagnoses, setSavedDiagnoses] = useState<SavedDiagnosis[]>([]);
  const [doctorProfile, setDoctorProfile] = useState<DoctorProfile>({
    name: '',
    qualifications: '',
    specialization: '',
    registrationNo: '',
    clinicName: '',
    clinicAddress: '',
    clinicCity: '',
    clinicState: '',
    clinicPincode: '',
    phone: '',
    email: '',
    website: '',
    chamberName: '',
    chamberAddress: '',
    chamberTimings: '',
    chamberPhone: '',
    signatureImage: '',
    headerImage: '',
    footerImage: '',
    logoImage: '',
  });

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const storedMedicine = localStorage.getItem(STORAGE_KEYS.medicineTemplates);
      const storedDiagnosis = localStorage.getItem(STORAGE_KEYS.diagnosisTemplates);
      const storedPrescription = localStorage.getItem(STORAGE_KEYS.prescriptionTemplates);
      const storedSavedDiagnoses = localStorage.getItem(STORAGE_KEYS.savedDiagnoses);
      const storedDoctorProfile = localStorage.getItem(STORAGE_KEYS.doctorProfile);

      if (storedMedicine) setMedicineTemplates(JSON.parse(storedMedicine));
      if (storedDiagnosis) setDiagnosisTemplates(JSON.parse(storedDiagnosis));
      if (storedPrescription) setPrescriptionTemplates(JSON.parse(storedPrescription));
      if (storedSavedDiagnoses) setSavedDiagnoses(JSON.parse(storedSavedDiagnoses));
      if (storedDoctorProfile) setDoctorProfile(JSON.parse(storedDoctorProfile));
    } catch (e) {
      console.error('Failed to load templates from localStorage:', e);
    }
  }, []);

  // Medicine Templates
  const saveMedicineTemplate = useCallback((name: string, medicines: any[]) => {
    const template: MedicineTemplate = {
      id: generateId(),
      name,
      medicines,
      createdAt: Date.now(),
    };
    setMedicineTemplates(prev => {
      const updated = [...prev, template];
      localStorage.setItem(STORAGE_KEYS.medicineTemplates, JSON.stringify(updated));
      return updated;
    });
    return template;
  }, []);

  const deleteMedicineTemplate = useCallback((id: string) => {
    setMedicineTemplates(prev => {
      const updated = prev.filter(t => t.id !== id);
      localStorage.setItem(STORAGE_KEYS.medicineTemplates, JSON.stringify(updated));
      return updated;
    });
  }, []);

  // Diagnosis Templates
  const saveDiagnosisTemplate = useCallback((name: string, diagnoses: any[], diagnosisType: string) => {
    const template: DiagnosisTemplate = {
      id: generateId(),
      name,
      diagnoses,
      diagnosisType,
      createdAt: Date.now(),
    };
    setDiagnosisTemplates(prev => {
      const updated = [...prev, template];
      localStorage.setItem(STORAGE_KEYS.diagnosisTemplates, JSON.stringify(updated));
      return updated;
    });
    return template;
  }, []);

  const deleteDiagnosisTemplate = useCallback((id: string) => {
    setDiagnosisTemplates(prev => {
      const updated = prev.filter(t => t.id !== id);
      localStorage.setItem(STORAGE_KEYS.diagnosisTemplates, JSON.stringify(updated));
      return updated;
    });
  }, []);

  // Prescription Templates
  const savePrescriptionTemplate = useCallback((name: string, data: Omit<PrescriptionTemplate, 'id' | 'name' | 'createdAt'>) => {
    const template: PrescriptionTemplate = {
      id: generateId(),
      name,
      ...data,
      createdAt: Date.now(),
    };
    setPrescriptionTemplates(prev => {
      const updated = [...prev, template];
      localStorage.setItem(STORAGE_KEYS.prescriptionTemplates, JSON.stringify(updated));
      return updated;
    });
    return template;
  }, []);

  const deletePrescriptionTemplate = useCallback((id: string) => {
    setPrescriptionTemplates(prev => {
      const updated = prev.filter(t => t.id !== id);
      localStorage.setItem(STORAGE_KEYS.prescriptionTemplates, JSON.stringify(updated));
      return updated;
    });
  }, []);

  // Saved Diagnoses for auto-suggestion
  const trackDiagnosisUsage = useCallback((diagnosisName: string) => {
    setSavedDiagnoses(prev => {
      const existing = prev.find(d => d.name.toLowerCase() === diagnosisName.toLowerCase());
      let updated: SavedDiagnosis[];
      if (existing) {
        updated = prev.map(d => 
          d.name.toLowerCase() === diagnosisName.toLowerCase()
            ? { ...d, usageCount: d.usageCount + 1, lastUsed: Date.now() }
            : d
        );
      } else {
        updated = [...prev, { name: diagnosisName, usageCount: 1, lastUsed: Date.now() }];
      }
      localStorage.setItem(STORAGE_KEYS.savedDiagnoses, JSON.stringify(updated));
      return updated;
    });
  }, []);

  const getSavedDiagnosisSuggestions = useCallback((query: string) => {
    if (!query || query.length < 2) return [];
    const lowerQuery = query.toLowerCase();
    return savedDiagnoses
      .filter(d => d.name.toLowerCase().includes(lowerQuery))
      .sort((a, b) => b.usageCount - a.usageCount)
      .slice(0, 5)
      .map(d => ({ name: d.name, source: 'saved' }));
  }, [savedDiagnoses]);

  // Doctor Profile
  const updateDoctorProfile = useCallback((updates: Partial<DoctorProfile>) => {
    setDoctorProfile(prev => {
      const updated = { ...prev, ...updates };
      localStorage.setItem(STORAGE_KEYS.doctorProfile, JSON.stringify(updated));
      return updated;
    });
  }, []);

  const clearImage = useCallback((field: 'signatureImage' | 'headerImage' | 'footerImage' | 'logoImage') => {
    setDoctorProfile(prev => {
      const updated = { ...prev, [field]: '' };
      localStorage.setItem(STORAGE_KEYS.doctorProfile, JSON.stringify(updated));
      return updated;
    });
  }, []);

  return {
    // Medicine templates
    medicineTemplates,
    saveMedicineTemplate,
    deleteMedicineTemplate,
    // Diagnosis templates
    diagnosisTemplates,
    saveDiagnosisTemplate,
    deleteDiagnosisTemplate,
    // Prescription templates
    prescriptionTemplates,
    savePrescriptionTemplate,
    deletePrescriptionTemplate,
    // Saved diagnoses
    savedDiagnoses,
    trackDiagnosisUsage,
    getSavedDiagnosisSuggestions,
    // Doctor profile
    doctorProfile,
    updateDoctorProfile,
    clearImage,
  };
}
