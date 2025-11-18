'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Clock,
  MapPin,
  User,
  Package,
  Eye,
  CalendarCheck,
  Wrench,
  CheckCircle,
} from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, startOfWeek, endOfWeek, isToday, parseISO } from 'date-fns';
import Link from 'next/link';

interface Installation {
  id: string;
  order_id: string;
  order_number: string;
  customer_name: string;
  customer_phone: string;
  installation_address: string;
  scheduled_date: string | null;
  scheduled_time_slot: string | null;
  status: string;
  package_name: string;
  package_speed: string;
}

interface InstallationCalendarProps {
  installations: Installation[];
  onDateClick?: (date: Date, installations: Installation[]) => void;
}

export function InstallationCalendar({ installations, onDateClick }: InstallationCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [view, setView] = useState<'month' | 'week'>('month');

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calendarStart = startOfWeek(monthStart);
  const calendarEnd = endOfWeek(monthEnd);

  const calendarDays = eachDayOfInterval({
    start: calendarStart,
    end: calendarEnd,
  });

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Group installations by date
  const installationsByDate = installations.reduce((acc, installation) => {
    if (!installation.scheduled_date) return acc;

    try {
      const dateKey = format(parseISO(installation.scheduled_date), 'yyyy-MM-dd');
      if (!acc[dateKey]) {
        acc[dateKey] = [];
      }
      acc[dateKey].push(installation);
    } catch (error) {
      console.error('Error parsing date:', installation.scheduled_date, error);
    }
    return acc;
  }, {} as Record<string, Installation[]>);

  const getInstallationsForDate = (date: Date): Installation[] => {
    const dateKey = format(date, 'yyyy-MM-dd');
    return installationsByDate[dateKey] || [];
  };

  const handlePreviousMonth = () => {
    setCurrentDate(subMonths(currentDate, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(addMonths(currentDate, 1));
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
    const dayInstallations = getInstallationsForDate(date);
    if (onDateClick) {
      onDateClick(date, dayInstallations);
    }
  };

  const getStatusColor = (status: string): string => {
    const colors: Record<string, string> = {
      installation_scheduled: 'bg-purple-500',
      installation_in_progress: 'bg-orange-500',
      installation_completed: 'bg-green-500',
      active: 'bg-green-500',
    };
    return colors[status] || 'bg-gray-500';
  };

  const getStatusIcon = (status: string) => {
    const icons: Record<string, any> = {
      installation_scheduled: CalendarCheck,
      installation_in_progress: Wrench,
      installation_completed: CheckCircle,
      active: CheckCircle,
    };
    return icons[status] || Clock;
  };

  // Calculate month stats
  const monthInstallations = installations.filter(inst => {
    if (!inst.scheduled_date) return false;
    try {
      const instDate = parseISO(inst.scheduled_date);
      return isSameMonth(instDate, currentDate);
    } catch {
      return false;
    }
  });

  const monthStats = {
    total: monthInstallations.length,
    scheduled: monthInstallations.filter(i => i.status === 'installation_scheduled').length,
    inProgress: monthInstallations.filter(i => i.status === 'installation_in_progress').length,
    completed: monthInstallations.filter(i => ['installation_completed', 'active'].includes(i.status)).length,
  };

  return (
    <div className="space-y-4">
      {/* Calendar Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <CardTitle className="flex items-center gap-2">
                <CalendarIcon className="h-5 w-5" />
                {format(currentDate, 'MMMM yyyy')}
              </CardTitle>
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="bg-purple-100 text-purple-800">
                  {monthStats.scheduled} Scheduled
                </Badge>
                <Badge variant="secondary" className="bg-orange-100 text-orange-800">
                  {monthStats.inProgress} In Progress
                </Badge>
                <Badge variant="secondary" className="bg-green-100 text-green-800">
                  {monthStats.completed} Completed
                </Badge>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handleToday}>
                Today
              </Button>
              <div className="flex items-center gap-1">
                <Button variant="outline" size="sm" onClick={handlePreviousMonth}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={handleNextMonth}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Calendar Grid */}
      <Card>
        <CardContent className="pt-6">
          {/* Weekday Headers */}
          <div className="grid grid-cols-7 gap-2 mb-2">
            {weekDays.map((day) => (
              <div
                key={day}
                className="text-center text-sm font-semibold text-gray-600 py-2"
              >
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Days */}
          <div className="grid grid-cols-7 gap-2">
            {calendarDays.map((day) => {
              const dayInstallations = getInstallationsForDate(day);
              const isCurrentMonth = isSameMonth(day, currentDate);
              const isSelected = selectedDate && isSameDay(day, selectedDate);
              const isTodayDate = isToday(day);

              return (
                <div
                  key={day.toISOString()}
                  onClick={() => handleDateClick(day)}
                  className={`
                    min-h-[120px] border rounded-lg p-2 cursor-pointer transition-all
                    ${isCurrentMonth ? 'bg-white' : 'bg-gray-50'}
                    ${isSelected ? 'ring-2 ring-circleTel-orange border-circleTel-orange' : 'border-gray-200'}
                    ${isTodayDate ? 'bg-blue-50 border-blue-300' : ''}
                    hover:shadow-md hover:border-circleTel-orange
                  `}
                >
                  {/* Date Number */}
                  <div className="flex items-center justify-between mb-1">
                    <span
                      className={`
                        text-sm font-semibold
                        ${!isCurrentMonth ? 'text-gray-400' : 'text-gray-900'}
                        ${isTodayDate ? 'bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs' : ''}
                      `}
                    >
                      {format(day, 'd')}
                    </span>
                    {dayInstallations.length > 0 && (
                      <Badge
                        variant="secondary"
                        className="text-xs px-1.5 py-0 h-5 bg-circleTel-orange text-white"
                      >
                        {dayInstallations.length}
                      </Badge>
                    )}
                  </div>

                  {/* Installation Events */}
                  <div className="space-y-1">
                    {dayInstallations.slice(0, 3).map((installation) => {
                      const StatusIcon = getStatusIcon(installation.status);
                      return (
                        <div
                          key={installation.id}
                          className={`
                            ${getStatusColor(installation.status)}
                            text-white text-xs p-1 rounded flex items-start gap-1
                            hover:opacity-90 transition-opacity
                          `}
                          onClick={(e) => {
                            e.stopPropagation();
                          }}
                        >
                          <StatusIcon className="h-3 w-3 mt-0.5 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">
                              {installation.order_number}
                            </p>
                            <p className="text-[10px] truncate opacity-90">
                              {installation.customer_name}
                            </p>
                            {installation.scheduled_time_slot && (
                              <p className="text-[10px] opacity-80">
                                {installation.scheduled_time_slot}
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                    {dayInstallations.length > 3 && (
                      <div className="text-xs text-gray-500 text-center py-1">
                        +{dayInstallations.length - 3} more
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Selected Date Details */}
      {selectedDate && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarIcon className="h-5 w-5" />
              {format(selectedDate, 'EEEE, MMMM d, yyyy')}
              <Badge variant="secondary">
                {getInstallationsForDate(selectedDate).length} Installation(s)
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {getInstallationsForDate(selectedDate).length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <CalendarIcon className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                <p>No installations scheduled for this date</p>
              </div>
            ) : (
              <div className="space-y-3">
                {getInstallationsForDate(selectedDate).map((installation) => {
                  const StatusIcon = getStatusIcon(installation.status);
                  return (
                    <div
                      key={installation.id}
                      className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-semibold text-gray-900">
                              {installation.order_number}
                            </h4>
                            <Badge className={`${getStatusColor(installation.status)} text-white flex items-center gap-1`}>
                              <StatusIcon className="h-3 w-3" />
                              {installation.status.replace('installation_', '').replace('_', ' ')}
                            </Badge>
                          </div>
                          {installation.scheduled_time_slot && (
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <Clock className="h-4 w-4" />
                              {installation.scheduled_time_slot}
                            </div>
                          )}
                        </div>
                        <Link href={`/admin/orders/${installation.order_id}`}>
                          <Button variant="outline" size="sm">
                            <Eye className="h-4 w-4 mr-1" />
                            View
                          </Button>
                        </Link>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                        <div className="flex items-center gap-2 text-gray-700">
                          <User className="h-4 w-4 text-gray-400" />
                          <span>{installation.customer_name}</span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-700">
                          <Package className="h-4 w-4 text-gray-400" />
                          <span>{installation.package_name}</span>
                        </div>
                        <div className="flex items-start gap-2 text-gray-700 md:col-span-2">
                          <MapPin className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                          <span className="flex-1">{installation.installation_address}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Legend */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-purple-500 rounded"></div>
              <span className="text-gray-700">Scheduled</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-orange-500 rounded"></div>
              <span className="text-gray-700">In Progress</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-green-500 rounded"></div>
              <span className="text-gray-700">Completed</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-blue-600 rounded-full"></div>
              <span className="text-gray-700">Today</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
