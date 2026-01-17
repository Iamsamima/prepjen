import React, { useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Heart, Thermometer, Activity, Ruler, Scale } from 'lucide-react';

interface VitalsData {
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

interface VitalsSectionProps {
  vitals: VitalsData;
  onChange: (vitals: VitalsData) => void;
}

export function VitalsSection({ vitals, onChange }: VitalsSectionProps) {
  // Calculate BMI when height or weight changes
  useEffect(() => {
    if (vitals.height && vitals.weight) {
      const heightM = parseFloat(vitals.height) / 100;
      const weightKg = parseFloat(vitals.weight);
      if (heightM > 0 && weightKg > 0) {
        const bmi = (weightKg / (heightM * heightM)).toFixed(1);
        if (bmi !== vitals.bmi) {
          onChange({ ...vitals, bmi });
        }
      }
    }
  }, [vitals.height, vitals.weight]);

  const handleChange = (field: keyof VitalsData, value: string) => {
    onChange({ ...vitals, [field]: value });
  };

  return (
    <div className="space-y-6 animate-slide-up">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 rounded-lg bg-primary/10">
          <Activity className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h3 className="text-lg font-semibold font-display text-foreground">Patient Vitals</h3>
          <p className="text-sm text-muted-foreground">Enter patient's vital signs</p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Age */}
        <div className="space-y-2">
          <Label htmlFor="age" className="text-sm font-medium">Age (years)</Label>
          <Input
            id="age"
            type="number"
            placeholder="25"
            value={vitals.age}
            onChange={(e) => handleChange('age', e.target.value)}
            className="h-11"
          />
        </div>

        {/* Gender */}
        <div className="space-y-2">
          <Label htmlFor="gender" className="text-sm font-medium">Gender</Label>
          <Select value={vitals.gender} onValueChange={(v) => handleChange('gender', v)}>
            <SelectTrigger className="h-11">
              <SelectValue placeholder="Select" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="male">Male</SelectItem>
              <SelectItem value="female">Female</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Blood Pressure */}
        <div className="space-y-2">
          <Label htmlFor="bp" className="text-sm font-medium flex items-center gap-2">
            <Heart className="h-4 w-4 text-destructive" />
            BP (mmHg)
          </Label>
          <Input
            id="bp"
            placeholder="120/80"
            value={vitals.bp}
            onChange={(e) => handleChange('bp', e.target.value)}
            className="h-11"
          />
        </div>

        {/* Pulse Rate */}
        <div className="space-y-2">
          <Label htmlFor="pr" className="text-sm font-medium">Pulse Rate</Label>
          <Input
            id="pr"
            type="number"
            placeholder="72"
            value={vitals.pr}
            onChange={(e) => handleChange('pr', e.target.value)}
            className="h-11"
          />
        </div>

        {/* SpO2 */}
        <div className="space-y-2">
          <Label htmlFor="spo2" className="text-sm font-medium">SpO2 (%)</Label>
          <Input
            id="spo2"
            type="number"
            placeholder="98"
            max={100}
            value={vitals.spo2}
            onChange={(e) => handleChange('spo2', e.target.value)}
            className="h-11"
          />
        </div>

        {/* Temperature */}
        <div className="space-y-2">
          <Label htmlFor="temp" className="text-sm font-medium flex items-center gap-2">
            <Thermometer className="h-4 w-4 text-warning" />
            Temp (°F)
          </Label>
          <Input
            id="temp"
            type="number"
            step="0.1"
            placeholder="98.6"
            value={vitals.temp}
            onChange={(e) => handleChange('temp', e.target.value)}
            className="h-11"
          />
        </div>

        {/* Height */}
        <div className="space-y-2">
          <Label htmlFor="height" className="text-sm font-medium flex items-center gap-2">
            <Ruler className="h-4 w-4 text-info" />
            Height (cm)
          </Label>
          <Input
            id="height"
            type="number"
            placeholder="170"
            value={vitals.height}
            onChange={(e) => handleChange('height', e.target.value)}
            className="h-11"
          />
        </div>

        {/* Weight */}
        <div className="space-y-2">
          <Label htmlFor="weight" className="text-sm font-medium flex items-center gap-2">
            <Scale className="h-4 w-4 text-info" />
            Weight (kg)
          </Label>
          <Input
            id="weight"
            type="number"
            placeholder="70"
            value={vitals.weight}
            onChange={(e) => handleChange('weight', e.target.value)}
            className="h-11"
          />
        </div>
      </div>

      {/* BMI Display */}
      {vitals.bmi && (
        <div className="mt-4 p-4 rounded-lg bg-secondary/50 border border-border">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-muted-foreground">Calculated BMI</span>
            <span className="text-lg font-bold text-primary">{vitals.bmi}</span>
          </div>
        </div>
      )}
    </div>
  );
}
