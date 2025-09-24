import React from 'react';
import { UseFormReturn } from 'react-hook-form';
import { Mail, Bell, Users, CheckCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { FormSection } from '../../common/FormSection';
import { UnjaniAuditFormData } from './types';

interface NotificationPreferencesProps {
  form: UseFormReturn<UnjaniAuditFormData>;
  notifyTeam: boolean;
  setNotifyTeam: (value: boolean) => void;
  notifyClient: boolean;
  setNotifyClient: (value: boolean) => void;
  customEmails: string;
  setCustomEmails: (value: string) => void;
}

export function NotificationPreferences({
  form,
  notifyTeam,
  setNotifyTeam,
  notifyClient,
  setNotifyClient,
  customEmails,
  setCustomEmails
}: NotificationPreferencesProps) {
  const { watch } = form;
  const contactEmail = watch('contactEmail');

  return (
    <FormSection
      title="6. Email Notifications"
      subtitle="Configure who should receive notifications about this audit submission"
      icon={<Mail className="w-6 h-6" />}
    >
      <div className="space-y-6">

        {/* Notification Preview */}
        <Alert>
          <Bell className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-2">
              <p className="font-medium">Email notifications will be sent upon successful submission:</p>
              <ul className="text-sm space-y-1 ml-4">
                {notifyTeam && (
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-3 w-3 text-green-600" />
                    <span><strong>Team notification</strong> - Internal audit processing team</span>
                  </li>
                )}
                {customEmails && (
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-3 w-3 text-green-600" />
                    <span><strong>Additional recipients</strong> - {customEmails.split(',').length} email(s)</span>
                  </li>
                )}
                {!notifyTeam && !customEmails && (
                  <li className="text-amber-600 flex items-center gap-2">
                    <Bell className="h-3 w-3" />
                    <span><em>No email notifications configured</em></span>
                  </li>
                )}
              </ul>
            </div>
          </AlertDescription>
        </Alert>

        {/* Team Notification Toggle */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-4">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Users className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <h3 id="team-notification-label" className="font-semibold text-gray-900">Team Notification</h3>
                <p className="text-sm text-gray-600 mt-1">
                  Notify the CircleTel Unjani rollout team about this audit submission.
                  Includes technical details, priority assessment, and next steps.
                </p>
              </div>
            </div>
            <label className="flex items-center cursor-pointer">
              <span className="sr-only">Enable team notification</span>
              <input
                type="checkbox"
                checked={notifyTeam}
                onChange={(e) => setNotifyTeam(e.target.checked)}
                className="sr-only"
                aria-labelledby="team-notification-label"
              />
              <div className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                notifyTeam ? 'bg-blue-600' : 'bg-gray-200'
              }`}>
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  notifyTeam ? 'translate-x-6' : 'translate-x-1'
                }`} />
              </div>
            </label>
          </div>
        </div>


        {/* Custom Recipients */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="space-y-4">
            <div className="flex items-start gap-4">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Mail className="h-5 w-5 text-purple-600" />
              </div>
              <div className="flex-1">
                <h3 id="additional-recipients-label" className="font-semibold text-gray-900">Additional Recipients</h3>
                <p className="text-sm text-gray-600 mt-1">
                  Send notifications to additional email addresses (optional).
                  Separate multiple emails with commas.
                </p>
              </div>
            </div>

            <div className="ml-14">
              <label htmlFor="custom-emails" className="sr-only">Additional email recipients</label>
              <textarea
                id="custom-emails"
                value={customEmails}
                onChange={(e) => setCustomEmails(e.target.value)}
                placeholder="manager@clinic.co.za, supervisor@unjani.co.za"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                rows={2}
                aria-labelledby="additional-recipients-label"
              />
              <p className="text-xs text-gray-500 mt-1">
                These recipients will receive the same technical notification as the team
              </p>
            </div>
          </div>
        </div>

        {/* Email Service Notice */}
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <Mail className="h-5 w-5 text-amber-600 mt-0.5" />
            <div className="text-sm">
              <p className="text-amber-800 font-medium">Email Service Information</p>
              <p className="text-amber-700 mt-1">
                Email notifications are sent automatically upon successful form submission.
                If you don't receive emails within 5 minutes, please contact our support team.
              </p>
              <p className="text-amber-700 mt-2">
                <strong>Support:</strong> unjani@circletel.co.za
              </p>
            </div>
          </div>
        </div>

      </div>
    </FormSection>
  );
}