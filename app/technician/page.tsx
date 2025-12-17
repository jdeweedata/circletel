'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  MapPin, 
  Clock, 
  Phone, 
  Navigation, 
  CheckCircle2, 
  PlayCircle,
  PauseCircle,
  LogOut,
  RefreshCw,
  User,
  Briefcase,
  AlertCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  TechnicianDashboardData,
  FieldJob,
  JOB_STATUS_LABELS,
  JOB_STATUS_COLORS,
  JOB_TYPE_LABELS,
  PRIORITY_COLORS,
  LOCATION_UPDATE_INTERVAL,
} from '@/lib/types/technician-tracking';

export default function TechnicianDashboard() {
  const router = useRouter();
  const [data, setData] = useState<TechnicianDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [locationEnabled, setLocationEnabled] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);

  // Fetch dashboard data
  const fetchData = useCallback(async () => {
    try {
      const response = await fetch('/api/technician');
      if (!response.ok) {
        if (response.status === 401) {
          router.push('/auth/login?next=/technician');
          return;
        }
        if (response.status === 404) {
          setError('Technician profile not found. Please contact admin.');
          return;
        }
        throw new Error('Failed to fetch data');
      }
      const result = await response.json();
      setData(result);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  }, [router]);

  // Send location update
  const sendLocationUpdate = useCallback(async (eventType: string = 'periodic') => {
    if (!navigator.geolocation) return;

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          await fetch('/api/technician', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              location: {
                latitude: position.coords.latitude,
                longitude: position.coords.longitude,
                accuracy: position.coords.accuracy,
                altitude: position.coords.altitude,
                heading: position.coords.heading,
                speed: position.coords.speed,
              },
              event_type: eventType,
            }),
          });
        } catch (err) {
          console.error('Failed to send location:', err);
        }
      },
      (err) => {
        console.error('Geolocation error:', err);
        if (err.code === err.PERMISSION_DENIED) {
          setLocationEnabled(false);
          toast.error('Location access denied. Please enable location services.');
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  }, []);

  // Request location permission
  const requestLocationPermission = useCallback(async () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      () => {
        setLocationEnabled(true);
        toast.success('Location tracking enabled');
        sendLocationUpdate('check_in');
      },
      (err) => {
        if (err.code === err.PERMISSION_DENIED) {
          toast.error('Location permission denied. Please enable in browser settings.');
        } else {
          toast.error('Failed to get location');
        }
      },
      { enableHighAccuracy: true }
    );
  }, [sendLocationUpdate]);

  // Update job status
  const updateJobStatus = async (jobId: string, newStatus: string) => {
    setUpdatingStatus(jobId);
    try {
      // Get current location
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
        });
      });

      const response = await fetch(`/api/technician/jobs/${jobId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: newStatus,
          location: {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          },
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update status');
      }

      toast.success(`Job status updated to ${JOB_STATUS_LABELS[newStatus as keyof typeof JOB_STATUS_LABELS]}`);
      fetchData();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update job');
    } finally {
      setUpdatingStatus(null);
    }
  };

  // Initial load
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Set up location tracking interval
  useEffect(() => {
    if (!locationEnabled) return;

    const interval = setInterval(() => {
      sendLocationUpdate('periodic');
    }, LOCATION_UPDATE_INTERVAL);

    return () => clearInterval(interval);
  }, [locationEnabled, sendLocationUpdate]);

  // Check location permission on mount
  useEffect(() => {
    if (navigator.permissions) {
      navigator.permissions.query({ name: 'geolocation' }).then((result) => {
        setLocationEnabled(result.state === 'granted');
      });
    }
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin text-circleTel-orange mx-auto mb-2" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-lg font-semibold mb-2">Error</h2>
            <p className="text-gray-600 mb-4">{error}</p>
            <Button onClick={() => router.push('/auth/login')}>
              Go to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!data) return null;

  const { technician, assigned_jobs, current_job, completed_today } = data;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-circleTel-orange text-white p-4 sticky top-0 z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
              <User className="h-5 w-5" />
            </div>
            <div>
              <h1 className="font-semibold">{technician.first_name} {technician.last_name}</h1>
              <p className="text-sm text-white/80">{technician.employee_id || 'Technician'}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/20"
              onClick={fetchData}
            >
              <RefreshCw className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      <main className="p-4 space-y-4 pb-20">
        {/* Location Status */}
        {!locationEnabled && (
          <Card className="border-yellow-200 bg-yellow-50">
            <CardContent className="py-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-yellow-600" />
                  <span className="text-sm text-yellow-800">Location tracking disabled</span>
                </div>
                <Button size="sm" onClick={requestLocationPermission}>
                  Enable
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3">
          <Card>
            <CardContent className="py-4 text-center">
              <Briefcase className="h-6 w-6 text-circleTel-orange mx-auto mb-1" />
              <p className="text-2xl font-bold">{assigned_jobs.length}</p>
              <p className="text-xs text-gray-500">Pending Jobs</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="py-4 text-center">
              <CheckCircle2 className="h-6 w-6 text-green-500 mx-auto mb-1" />
              <p className="text-2xl font-bold">{completed_today}</p>
              <p className="text-xs text-gray-500">Completed Today</p>
            </CardContent>
          </Card>
        </div>

        {/* Current Job */}
        {current_job && (
          <Card className="border-circleTel-orange border-2">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Current Job</CardTitle>
                <Badge className={JOB_STATUS_COLORS[current_job.status]}>
                  {JOB_STATUS_LABELS[current_job.status]}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="font-medium">{current_job.title}</p>
                <p className="text-sm text-gray-500">{JOB_TYPE_LABELS[current_job.job_type]}</p>
              </div>
              
              <div className="flex items-start gap-2 text-sm">
                <MapPin className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                <span>{current_job.address}</span>
              </div>
              
              {current_job.customer_name && (
                <div className="flex items-center gap-2 text-sm">
                  <User className="h-4 w-4 text-gray-400" />
                  <span>{current_job.customer_name}</span>
                </div>
              )}
              
              {current_job.customer_phone && (
                <a 
                  href={`tel:${current_job.customer_phone}`}
                  className="flex items-center gap-2 text-sm text-circleTel-orange"
                >
                  <Phone className="h-4 w-4" />
                  <span>{current_job.customer_phone}</span>
                </a>
              )}

              {/* Action Buttons */}
              <div className="flex gap-2 pt-2">
                {current_job.status === 'en_route' && (
                  <Button 
                    className="flex-1"
                    onClick={() => updateJobStatus(current_job.id, 'arrived')}
                    disabled={updatingStatus === current_job.id}
                  >
                    <MapPin className="h-4 w-4 mr-2" />
                    Arrived
                  </Button>
                )}
                {current_job.status === 'arrived' && (
                  <Button 
                    className="flex-1"
                    onClick={() => updateJobStatus(current_job.id, 'in_progress')}
                    disabled={updatingStatus === current_job.id}
                  >
                    <PlayCircle className="h-4 w-4 mr-2" />
                    Start Work
                  </Button>
                )}
                {current_job.status === 'in_progress' && (
                  <Button 
                    className="flex-1 bg-green-600 hover:bg-green-700"
                    onClick={() => router.push(`/technician/jobs/${current_job.id}/complete`)}
                    disabled={updatingStatus === current_job.id}
                  >
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Complete
                  </Button>
                )}
                {current_job.latitude && current_job.longitude && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      window.open(
                        `https://www.google.com/maps/dir/?api=1&destination=${current_job.latitude},${current_job.longitude}`,
                        '_blank'
                      );
                    }}
                  >
                    <Navigation className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Assigned Jobs */}
        <div>
          <h2 className="font-semibold mb-3">Assigned Jobs ({assigned_jobs.length})</h2>
          {assigned_jobs.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-gray-500">
                <Briefcase className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No jobs assigned</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {assigned_jobs
                .filter(job => job.id !== current_job?.id)
                .map((job) => (
                  <JobCard 
                    key={job.id} 
                    job={job} 
                    onStartJob={() => updateJobStatus(job.id, 'en_route')}
                    isUpdating={updatingStatus === job.id}
                  />
                ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

// Job Card Component
function JobCard({ 
  job, 
  onStartJob, 
  isUpdating 
}: { 
  job: FieldJob; 
  onStartJob: () => void;
  isUpdating: boolean;
}) {
  return (
    <Card>
      <CardContent className="py-4">
        <div className="flex items-start justify-between mb-2">
          <div>
            <p className="font-medium">{job.title}</p>
            <p className="text-sm text-gray-500">{JOB_TYPE_LABELS[job.job_type]}</p>
          </div>
          <div className="flex flex-col items-end gap-1">
            <Badge className={JOB_STATUS_COLORS[job.status]}>
              {JOB_STATUS_LABELS[job.status]}
            </Badge>
            <Badge variant="outline" className={PRIORITY_COLORS[job.priority]}>
              {job.priority}
            </Badge>
          </div>
        </div>
        
        <div className="space-y-1 text-sm text-gray-600 mb-3">
          <div className="flex items-start gap-2">
            <MapPin className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
            <span className="line-clamp-2">{job.address}</span>
          </div>
          {job.scheduled_time_start && (
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-gray-400" />
              <span>{job.scheduled_time_start}</span>
            </div>
          )}
        </div>

        <div className="flex gap-2">
          {job.status === 'assigned' && (
            <Button 
              size="sm" 
              className="flex-1"
              onClick={onStartJob}
              disabled={isUpdating}
            >
              <Navigation className="h-4 w-4 mr-2" />
              Start Journey
            </Button>
          )}
          {job.customer_phone && (
            <Button
              size="sm"
              variant="outline"
              asChild
            >
              <a href={`tel:${job.customer_phone}`}>
                <Phone className="h-4 w-4" />
              </a>
            </Button>
          )}
          {job.latitude && job.longitude && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                window.open(
                  `https://www.google.com/maps/dir/?api=1&destination=${job.latitude},${job.longitude}`,
                  '_blank'
                );
              }}
            >
              <MapPin className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
