import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Building2, Users, FileText } from 'lucide-react';

import { FormLayout } from '../../common/FormLayout';
import { ProgressBar } from '../../common/ProgressBar';
import { FormSection } from '../../common/FormSection';
import { InputField, SelectField, TextareaField, RadioGroup } from '../../common/FormFields';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';

import {
  UnjaniAuditFormData,
  unjaniAuditFormSchema,
  calculateMigrationPriority,
  REQUIRED_FIELDS,
  CLINIC_OPTIONS,
  PROVINCE_OPTIONS,
  PROVIDER_OPTIONS,
  CONNECTION_TYPE_OPTIONS,
  CONTRACT_STATUS_OPTIONS,
  CONTRACT_TYPE_OPTIONS
} from './types';

import { calculateProgress } from '../../utils/validation';
import { useFormPersistence } from '../../utils/storage';
import { submitUnjaniForm } from '@/services/supabase';

export function UnjaniContractAuditForm() {
  const [progress, setProgress] = useState(0);
  const [priority, setPriority] = useState<{ priority: 'high' | 'medium' | 'low'; reason: string } | null>(null);
  const [contractEndDate, setContractEndDate] = useState<string>('');


  const { saveDraft, loadDraft, deleteDraft } = useFormPersistence('unjani', 'contract_audit');

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
    reset
  } = useForm<UnjaniAuditFormData>({
    resolver: zodResolver(unjaniAuditFormSchema),
    defaultValues: {
      auditDate: new Date().toISOString().split('T')[0]
    }
  });

  // Watch specific fields to avoid infinite loops
  const contractStart = watch('contractStart');
  const contractType = watch('contractType');
  const contractStatus = watch('contractStatus');
  const monthlyFee = watch('monthlyFee');

  // Get all form values efficiently
  const watchedValues = watch();

  // Memoize form persistence functions
  const memoizedSaveDraft = useCallback((data: Record<string, unknown>, progressValue: number) => {
    saveDraft(data, progressValue);
  }, [saveDraft]);

  // Load draft on component mount only
  useEffect(() => {
    const draft = loadDraft();
    if (draft && Object.keys(draft.data).length > 0) {
      Object.entries(draft.data).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          setValue(key as keyof UnjaniAuditFormData, value);
        }
      });
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Memoize progress calculation
  const currentProgress = useMemo(() => {
    return calculateProgress(watchedValues, REQUIRED_FIELDS);
  }, [watchedValues]);

  // Memoize priority calculation
  const currentPriority = useMemo(() => {
    return calculateMigrationPriority({
      contractType,
      contractStatus,
      monthlyFee
    });
  }, [contractType, contractStatus, monthlyFee]);

  // Update progress and priority when calculated values change
  useEffect(() => {
    setProgress(currentProgress);
    setPriority(currentPriority);

    // Debounce auto-save to avoid excessive calls
    const timeoutId = setTimeout(() => {
      memoizedSaveDraft(watchedValues, currentProgress);
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [currentProgress, currentPriority, watchedValues, memoizedSaveDraft]);

  // Calculate contract end date when relevant fields change
  useEffect(() => {
    if (contractStart && contractType && contractType !== 'month-to-month') {
      const startDate = new Date(contractStart);
      let months = 0;

      if (contractType === '12-months') months = 12;
      else if (contractType === '24-months') months = 24;

      if (months > 0) {
        const endDate = new Date(startDate);
        endDate.setMonth(endDate.getMonth() + months);
        const formattedEndDate = endDate.toISOString().split('T')[0];
        setContractEndDate(formattedEndDate);
        setValue('contractEnd', formattedEndDate);
      }
    }
  }, [contractStart, contractType, setValue]);

  const onSubmit = async (data: UnjaniAuditFormData) => {
    try {
      // Submit to Supabase
      const result = await submitUnjaniForm(data, {
        migrationPriority: priority?.priority,
        priorityReason: priority?.reason,
        submittedAt: new Date().toISOString()
      });

      if (result.success) {
        alert(`${result.message}\n\nPriority: ${priority?.priority?.toUpperCase()}\nContract Status: ${data.contractStatus}\n\nData has been saved to the database for rollout planning.`);

        // Clear draft
        deleteDraft();

        // Reset form if user wants to start new audit
        if (confirm('Would you like to start a new audit?')) {
          reset();
          setProgress(0);
          setPriority(null);
        }
      } else {
        // Handle submission error
        console.error('Submission failed:', result.error);
        alert(`Error submitting form: ${result.error}\n\nPlease try again or contact support if the problem persists.`);
      }
    } catch (error) {
      console.error('Error submitting form:', error);
      alert('Unexpected error submitting form. Please try again.');
    }
  };


  return (
    <FormLayout
      title="Unjani Clinic Network Contract Audit Form"
      subtitle="CircleTel & ThinkWiFi Solution Rollout Planning"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <ProgressBar progress={progress} />

        {/* Section 1: Clinic Information */}
        <FormSection
          title="1. Clinic Identification"
          icon={<Building2 className="w-6 h-6" />}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <SelectField
              label="Clinic Name"
              required
              options={CLINIC_OPTIONS}
              error={errors.clinicName?.message}
              {...register('clinicName')}
            />

            <SelectField
              label="Province"
              required
              options={PROVINCE_OPTIONS}
              error={errors.province?.message}
              {...register('province')}
            />

            <InputField
              label="Clinic Code/ID"
              placeholder="e.g., UCN-GP-001"
              error={errors.clinicCode?.message}
              {...register('clinicCode')}
            />

            <InputField
              label="Audit Date"
              type="date"
              required
              error={errors.auditDate?.message}
              {...register('auditDate')}
            />
          </div>
        </FormSection>

        {/* Section 2: Current Service Provider */}
        <FormSection
          title="2. Current Service Provider Information"
          icon={<Users className="w-6 h-6" />}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <SelectField
              label="Current Service Provider"
              required
              options={PROVIDER_OPTIONS}
              error={errors.currentProvider?.message}
              {...register('currentProvider')}
            />

            <SelectField
              label="Connection Type"
              required
              options={CONNECTION_TYPE_OPTIONS}
              error={errors.connectionType?.message}
              {...register('connectionType')}
            />

            <InputField
              label="Current Speed (Mbps)"
              type="number"
              placeholder="e.g., 50"
              error={errors.currentSpeed?.message}
              {...register('currentSpeed')}
            />

            <InputField
              label="Current Monthly Fee (R)"
              type="number"
              placeholder="e.g., 599"
              required
              error={errors.monthlyFee?.message}
              {...register('monthlyFee')}
            />
          </div>
        </FormSection>

        {/* Section 3: Contract Details */}
        <FormSection
          title="3. Contract Details"
          subtitle="Critical information for determining migration readiness and rollout priority"
          icon={<FileText className="w-6 h-6" />}
        >
          <div className="space-y-6">
            <RadioGroup
              label="Contract Type"
              name="contractType"
              options={CONTRACT_TYPE_OPTIONS}
              value={watchedValues.contractType}
              onChange={(value) => setValue('contractType', value as string)}
              required
              error={errors.contractType?.message}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <SelectField
                label="Contract Status"
                required
                options={CONTRACT_STATUS_OPTIONS}
                error={errors.contractStatus?.message}
                {...register('contractStatus')}
              />

              <div className="grid grid-cols-2 gap-4">
                <InputField
                  label="Contract Start Date"
                  type="date"
                  required
                  error={errors.contractStart?.message}
                  {...register('contractStart')}
                />
                <InputField
                  label="Contract End Date"
                  type="date"
                  value={contractEndDate}
                  readOnly
                  className="bg-gray-100"
                />
              </div>
            </div>

            {/* Contract Status Analysis */}
            {watchedValues.contractType && (
              <Alert>
                <AlertDescription>
                  {watchedValues.contractType === 'month-to-month' ? (
                    <span className="text-green-700">
                      <strong>✓ Ready for immediate migration</strong><br />
                      No contract restrictions apply. This site can be migrated immediately.
                    </span>
                  ) : (
                    <span className="text-yellow-700">
                      <strong>⚠ Fixed-term contract</strong><br />
                      Please verify contract end date and any early termination fees before scheduling migration.
                    </span>
                  )}
                </AlertDescription>
              </Alert>
            )}
          </div>
        </FormSection>



        {/* Action Buttons */}
        <div className="flex justify-center">
          <Button
            type="submit"
            className="bg-gradient-to-r from-circleTel-orange to-orange-600 hover:from-orange-600 hover:to-orange-700 px-8 py-3"
          >
            Submit Audit
          </Button>
        </div>
      </form>
    </FormLayout>
  );
}