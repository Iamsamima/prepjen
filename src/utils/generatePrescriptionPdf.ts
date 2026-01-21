import jsPDF from 'jspdf';

interface Vitals {
  bp: string;
  pr: string;
  spo2: string;
  temp: string;
  height: string;
  weight: string;
  bmi: string;
  age: string;
  gender: string;
}

interface Diagnosis {
  name: string;
  confidence?: string;
  description?: string;
}

interface Medicine {
  name: string;
  type: string;
  dose: string;
  route: string;
  frequency: string;
  duration: string;
  instructions: string;
}

interface PrescriptionData {
  vitals: Vitals;
  symptoms: string[];
  clinicalFindings: string;
  diagnoses: Diagnosis[];
  diagnosisType: string;
  medicines: Medicine[];
  doctorName?: string;
  clinicName?: string;
}

export function generatePrescriptionPdf(data: PrescriptionData): void {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;
  let y = 20;

  // Helper functions
  const addTitle = (text: string) => {
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(59, 130, 246);
    doc.text(text, margin, y);
    y += 8;
  };

  const addSectionHeader = (text: string) => {
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 41, 59);
    doc.text(text, margin, y);
    y += 6;
  };

  const addText = (text: string, indent = 0) => {
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(71, 85, 105);
    const lines = doc.splitTextToSize(text, pageWidth - margin * 2 - indent);
    doc.text(lines, margin + indent, y);
    y += lines.length * 5;
  };

  const addLine = () => {
    doc.setDrawColor(226, 232, 240);
    doc.line(margin, y, pageWidth - margin, y);
    y += 6;
  };

  const checkPageBreak = (needed: number) => {
    if (y + needed > doc.internal.pageSize.getHeight() - 20) {
      doc.addPage();
      y = 20;
    }
  };

  // Header
  doc.setFillColor(59, 130, 246);
  doc.rect(0, 0, pageWidth, 40, 'F');
  
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.text('PRESCRIPTION', pageWidth / 2, 18, { align: 'center' });
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Date: ${new Date().toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  })}`, pageWidth / 2, 30, { align: 'center' });

  y = 55;

  // Patient Vitals Section
  checkPageBreak(50);
  addSectionHeader('PATIENT VITALS');
  y += 2;
  
  const vitalsGrid = [
    [`Blood Pressure: ${data.vitals.bp || 'N/A'}`, `Pulse Rate: ${data.vitals.pr || 'N/A'} bpm`],
    [`SpO2: ${data.vitals.spo2 || 'N/A'}%`, `Temperature: ${data.vitals.temp || 'N/A'}°F`],
    [`Height: ${data.vitals.height || 'N/A'} cm`, `Weight: ${data.vitals.weight || 'N/A'} kg`],
    [`BMI: ${data.vitals.bmi || 'N/A'}`, `Age: ${data.vitals.age || 'N/A'} years`],
    [`Gender: ${data.vitals.gender || 'N/A'}`, ''],
  ];

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  
  vitalsGrid.forEach(row => {
    doc.text(row[0], margin, y);
    if (row[1]) doc.text(row[1], pageWidth / 2, y);
    y += 6;
  });
  
  y += 4;
  addLine();

  // Symptoms Section
  if (data.symptoms.length > 0) {
    checkPageBreak(30);
    addSectionHeader('PRESENTING SYMPTOMS');
    y += 2;
    data.symptoms.forEach((symptom, index) => {
      addText(`• ${symptom}`, 5);
    });
    y += 4;
    addLine();
  }

  // Clinical Findings
  if (data.clinicalFindings) {
    checkPageBreak(30);
    addSectionHeader('CLINICAL FINDINGS');
    y += 2;
    addText(data.clinicalFindings);
    y += 4;
    addLine();
  }

  // Diagnosis Section
  if (data.diagnoses.length > 0) {
    checkPageBreak(40);
    addSectionHeader(`DIAGNOSIS (${data.diagnosisType.toUpperCase()})`);
    y += 2;
    data.diagnoses.forEach((diagnosis, index) => {
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(30, 41, 59);
      addText(`${index + 1}. ${diagnosis.name}`, 5);
      if (diagnosis.confidence) {
        doc.setFont('helvetica', 'italic');
        doc.setTextColor(100, 116, 139);
        addText(`Confidence: ${diagnosis.confidence}`, 10);
      }
      if (diagnosis.description) {
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(71, 85, 105);
        addText(diagnosis.description, 10);
      }
      y += 2;
    });
    y += 2;
    addLine();
  }

  // Medicines Section
  if (data.medicines.length > 0 && data.medicines.some(m => m.name)) {
    checkPageBreak(50);
    addSectionHeader('PRESCRIBED MEDICATIONS');
    y += 4;

    const filteredMedicines = data.medicines.filter(m => m.name);
    
    filteredMedicines.forEach((medicine, index) => {
      checkPageBreak(35);
      
      // Medicine name with background
      doc.setFillColor(241, 245, 249);
      doc.roundedRect(margin, y - 4, pageWidth - margin * 2, 10, 2, 2, 'F');
      
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(30, 41, 59);
      doc.text(`${index + 1}. ${medicine.name} (${medicine.type || 'Tablet'})`, margin + 5, y + 2);
      y += 12;

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(71, 85, 105);
      
      if (medicine.dose) {
        doc.text(`Dose: ${medicine.dose}`, margin + 10, y);
        y += 5;
      }
      if (medicine.route) {
        doc.text(`Route: ${medicine.route}`, margin + 10, y);
        y += 5;
      }
      if (medicine.frequency) {
        doc.text(`Frequency: ${medicine.frequency}`, margin + 10, y);
        y += 5;
      }
      if (medicine.duration) {
        doc.text(`Duration: ${medicine.duration}`, margin + 10, y);
        y += 5;
      }
      if (medicine.instructions) {
        doc.text(`Instructions: ${medicine.instructions}`, margin + 10, y);
        y += 5;
      }
      y += 5;
    });
  }

  // Footer
  const footerY = doc.internal.pageSize.getHeight() - 30;
  doc.setDrawColor(226, 232, 240);
  doc.line(margin, footerY, pageWidth - margin, footerY);
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(100, 116, 139);
  doc.text('This prescription was generated using AI Prescription Builder', pageWidth / 2, footerY + 10, { align: 'center' });
  
  doc.setFontSize(8);
  doc.text('Please consult your healthcare provider for any questions.', pageWidth / 2, footerY + 18, { align: 'center' });

  // Save the PDF
  const fileName = `prescription_${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(fileName);
}
