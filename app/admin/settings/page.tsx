import { Metadata } from 'next';
import Link from 'next/link';
import { Settings, Bell, Shield, Mail, Database, Code } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export const metadata: Metadata = {
  title: 'Settings - CircleTel Admin',
  description: 'Configure system settings'
};

const settingsCategories = [
  {
    title: 'Notifications',
    description: 'Email templates and notification logs',
    icon: Bell,
    href: '/admin/settings/notifications',
    available: true
  },
  {
    title: 'Security',
    description: 'Authentication, API keys, and access control',
    icon: Shield,
    href: '/admin/settings/security',
    available: false
  },
  {
    title: 'Email',
    description: 'SMTP configuration and email delivery',
    icon: Mail,
    href: '/admin/settings/email',
    available: false
  },
  {
    title: 'Database',
    description: 'Database connections and migrations',
    icon: Database,
    href: '/admin/settings/database',
    available: false
  },
  {
    title: 'Integrations',
    description: 'Third-party service configurations',
    icon: Code,
    href: '/admin/integrations',
    available: true
  }
];

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
        <p className="mt-2 text-gray-600">
          Configure system-wide settings and preferences
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {settingsCategories.map((category) => {
          const Icon = category.icon;
          const Component = category.available ? Link : 'div';

          return (
            <Component
              key={category.title}
              href={category.available ? category.href : undefined}
              className={category.available ? 'block' : 'block opacity-50 cursor-not-allowed'}
            >
              <Card className={category.available ? 'hover:shadow-lg transition-shadow' : ''}>
                <CardHeader>
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-circleTel-orange/10 rounded-lg">
                      <Icon className="h-6 w-6 text-circleTel-orange" />
                    </div>
                    <div className="flex-1">
                      <CardTitle className="text-lg">{category.title}</CardTitle>
                      {!category.available && (
                        <span className="text-xs text-gray-500 font-normal">Coming Soon</span>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription>{category.description}</CardDescription>
                </CardContent>
              </Card>
            </Component>
          );
        })}
      </div>
    </div>
  );
}
