import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function CMSSettings() {
  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">CMS Settings</h1>
        <p className="text-muted-foreground">
          Configure AI models and user permissions.
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Configuration</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Settings form coming soon...</p>
        </CardContent>
      </Card>
    </div>
  );
}
