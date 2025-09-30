'use client';

import { useState } from 'react';
import { useZohoCRM, useZohoMail, useZohoCalendar } from '@/hooks/use-zoho-mcp';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import {
  Mail,
  Calendar,
  UserPlus,
  Loader2,
  Send,
  CalendarPlus,
  Users
} from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

export function ZohoQuickActions() {
  const [emailData, setEmailData] = useState({
    to: '',
    subject: '',
    content: '',
  });

  const [eventData, setEventData] = useState({
    title: '',
    startDateTime: '',
    endDateTime: '',
    location: '',
    description: '',
  });

  const [leadData, setLeadData] = useState({
    email: '',
    firstName: '',
    lastName: '',
    company: '',
  });

  const { createLead } = useZohoCRM();
  const { sendEmail } = useZohoMail();
  const { createEvent } = useZohoCalendar();

  const handleSendEmail = async () => {
    if (!emailData.to || !emailData.subject || !emailData.content) return;

    try {
      await sendEmail.mutateAsync({
        to: [emailData.to],
        subject: emailData.subject,
        content: emailData.content,
        contentType: 'html',
      });

      setEmailData({ to: '', subject: '', content: '' });
    } catch (error) {
      console.error('Failed to send email:', error);
    }
  };

  const handleCreateEvent = async () => {
    if (!eventData.title || !eventData.startDateTime || !eventData.endDateTime) return;

    try {
      await createEvent.mutateAsync({
        title: eventData.title,
        startDateTime: eventData.startDateTime,
        endDateTime: eventData.endDateTime,
        location: eventData.location,
        description: eventData.description,
      });

      setEventData({
        title: '',
        startDateTime: '',
        endDateTime: '',
        location: '',
        description: '',
      });
    } catch (error) {
      console.error('Failed to create event:', error);
    }
  };

  const handleCreateLead = async () => {
    if (!leadData.email || !leadData.firstName || !leadData.lastName) return;

    try {
      await createLead.mutateAsync({
        email: leadData.email,
        firstName: leadData.firstName,
        lastName: leadData.lastName,
        company: leadData.company,
        layout: 'standard',
      });

      setLeadData({ email: '', firstName: '', lastName: '', company: '' });
    } catch (error) {
      console.error('Failed to create lead:', error);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Zoho Quick Actions</CardTitle>
        <CardDescription>
          Perform common Zoho operations quickly
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="email" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="email" className="flex items-center gap-2">
              <Mail className="h-4 w-4" />
              Email
            </TabsTrigger>
            <TabsTrigger value="calendar" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Calendar
            </TabsTrigger>
            <TabsTrigger value="lead" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Lead
            </TabsTrigger>
          </TabsList>

          <TabsContent value="email" className="space-y-4">
            <div className="space-y-4">
              <div>
                <Label htmlFor="email-to">To</Label>
                <Input
                  id="email-to"
                  type="email"
                  placeholder="recipient@example.com"
                  value={emailData.to}
                  onChange={(e) => setEmailData({ ...emailData, to: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor="email-subject">Subject</Label>
                <Input
                  id="email-subject"
                  placeholder="Email subject"
                  value={emailData.subject}
                  onChange={(e) => setEmailData({ ...emailData, subject: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor="email-content">Message</Label>
                <Textarea
                  id="email-content"
                  placeholder="Email content..."
                  rows={4}
                  value={emailData.content}
                  onChange={(e) => setEmailData({ ...emailData, content: e.target.value })}
                />
              </div>

              {sendEmail.error && (
                <Alert variant="destructive">
                  <AlertDescription>
                    Failed to send email. Please try again.
                  </AlertDescription>
                </Alert>
              )}

              <Button
                onClick={handleSendEmail}
                disabled={sendEmail.isPending || !emailData.to || !emailData.subject || !emailData.content}
                className="w-full"
              >
                {sendEmail.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    Send Email
                  </>
                )}
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="calendar" className="space-y-4">
            <div className="space-y-4">
              <div>
                <Label htmlFor="event-title">Event Title</Label>
                <Input
                  id="event-title"
                  placeholder="Meeting title"
                  value={eventData.title}
                  onChange={(e) => setEventData({ ...eventData, title: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="event-start">Start Time</Label>
                  <Input
                    id="event-start"
                    type="datetime-local"
                    value={eventData.startDateTime}
                    onChange={(e) => setEventData({ ...eventData, startDateTime: e.target.value })}
                  />
                </div>

                <div>
                  <Label htmlFor="event-end">End Time</Label>
                  <Input
                    id="event-end"
                    type="datetime-local"
                    value={eventData.endDateTime}
                    onChange={(e) => setEventData({ ...eventData, endDateTime: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="event-location">Location</Label>
                <Input
                  id="event-location"
                  placeholder="Meeting location or video link"
                  value={eventData.location}
                  onChange={(e) => setEventData({ ...eventData, location: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor="event-description">Description</Label>
                <Textarea
                  id="event-description"
                  placeholder="Event description..."
                  rows={3}
                  value={eventData.description}
                  onChange={(e) => setEventData({ ...eventData, description: e.target.value })}
                />
              </div>

              {createEvent.error && (
                <Alert variant="destructive">
                  <AlertDescription>
                    Failed to create event. Please try again.
                  </AlertDescription>
                </Alert>
              )}

              <Button
                onClick={handleCreateEvent}
                disabled={createEvent.isPending || !eventData.title || !eventData.startDateTime || !eventData.endDateTime}
                className="w-full"
              >
                {createEvent.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <CalendarPlus className="mr-2 h-4 w-4" />
                    Create Event
                  </>
                )}
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="lead" className="space-y-4">
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="lead-firstname">First Name</Label>
                  <Input
                    id="lead-firstname"
                    placeholder="John"
                    value={leadData.firstName}
                    onChange={(e) => setLeadData({ ...leadData, firstName: e.target.value })}
                  />
                </div>

                <div>
                  <Label htmlFor="lead-lastname">Last Name</Label>
                  <Input
                    id="lead-lastname"
                    placeholder="Doe"
                    value={leadData.lastName}
                    onChange={(e) => setLeadData({ ...leadData, lastName: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="lead-email">Email</Label>
                <Input
                  id="lead-email"
                  type="email"
                  placeholder="john.doe@example.com"
                  value={leadData.email}
                  onChange={(e) => setLeadData({ ...leadData, email: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor="lead-company">Company</Label>
                <Input
                  id="lead-company"
                  placeholder="Acme Corp"
                  value={leadData.company}
                  onChange={(e) => setLeadData({ ...leadData, company: e.target.value })}
                />
              </div>

              {createLead.error && (
                <Alert variant="destructive">
                  <AlertDescription>
                    Failed to create lead. Please try again.
                  </AlertDescription>
                </Alert>
              )}

              <Button
                onClick={handleCreateLead}
                disabled={createLead.isPending || !leadData.email || !leadData.firstName || !leadData.lastName}
                className="w-full"
              >
                {createLead.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <UserPlus className="mr-2 h-4 w-4" />
                    Create Lead
                  </>
                )}
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}