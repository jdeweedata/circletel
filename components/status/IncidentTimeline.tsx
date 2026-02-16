'use client'

import { AlertCircle, AlertTriangle, Info, Wrench, CheckCircle } from 'lucide-react'

type Severity = 'critical' | 'major' | 'minor' | 'maintenance'

interface IncidentUpdate {
  status: string
  message: string
  is_public: boolean
  created_at: string
}

interface Incident {
  id: string
  incident_number: string
  title: string
  severity: Severity
  status: string
  affected_providers: string[]
  affected_regions: string[]
  started_at: string
  updates: IncidentUpdate[]
}

interface IncidentTimelineProps {
  incidents: Incident[]
}

const severityConfig = {
  critical: {
    icon: AlertCircle,
    label: 'Critical',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
    textColor: 'text-red-700',
    badgeColor: 'bg-red-100 text-red-700',
  },
  major: {
    icon: AlertTriangle,
    label: 'Major',
    bgColor: 'bg-orange-50',
    borderColor: 'border-orange-200',
    textColor: 'text-orange-700',
    badgeColor: 'bg-orange-100 text-orange-700',
  },
  minor: {
    icon: Info,
    label: 'Minor',
    bgColor: 'bg-yellow-50',
    borderColor: 'border-yellow-200',
    textColor: 'text-yellow-700',
    badgeColor: 'bg-yellow-100 text-yellow-700',
  },
  maintenance: {
    icon: Wrench,
    label: 'Maintenance',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    textColor: 'text-blue-700',
    badgeColor: 'bg-blue-100 text-blue-700',
  },
}

const statusLabels: Record<string, string> = {
  investigating: 'Investigating',
  identified: 'Identified',
  monitoring: 'Monitoring',
  resolved: 'Resolved',
}

function formatDateTime(dateStr: string) {
  const date = new Date(dateStr)
  return date.toLocaleDateString('en-ZA', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function formatTime(dateStr: string) {
  const date = new Date(dateStr)
  return date.toLocaleTimeString('en-ZA', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

function IncidentCard({ incident }: { incident: Incident }) {
  const config = severityConfig[incident.severity]
  const Icon = config.icon

  return (
    <div
      className={`${config.bgColor} ${config.borderColor} border rounded-lg overflow-hidden`}
    >
      {/* Header */}
      <div className="p-4 border-b border-inherit">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <Icon className={`h-5 w-5 mt-0.5 ${config.textColor}`} />
            <div>
              <h3 className="font-semibold text-ui-text-primary">
                {incident.title}
              </h3>
              <p className="text-sm text-ui-text-muted mt-1">
                Started: {formatDateTime(incident.started_at)}
              </p>
            </div>
          </div>
          <div className="flex flex-col items-end gap-2">
            <span
              className={`px-2 py-0.5 rounded text-xs font-medium ${config.badgeColor}`}
            >
              {config.label}
            </span>
            <span className="text-xs font-mono text-ui-text-muted">
              {incident.incident_number}
            </span>
          </div>
        </div>

        {/* Affected areas */}
        <div className="flex flex-wrap gap-2 mt-3">
          {incident.affected_providers.map((provider) => (
            <span
              key={provider}
              className="px-2 py-0.5 bg-white/50 rounded text-xs text-ui-text-muted"
            >
              {provider}
            </span>
          ))}
          {incident.affected_regions.map((region) => (
            <span
              key={region}
              className="px-2 py-0.5 bg-white/50 rounded text-xs text-ui-text-muted"
            >
              {region}
            </span>
          ))}
        </div>
      </div>

      {/* Timeline */}
      {incident.updates.length > 0 && (
        <div className="p-4 bg-white/30">
          <h4 className="text-sm font-medium text-ui-text-muted mb-3">
            Updates
          </h4>
          <div className="space-y-3">
            {incident.updates.map((update, index) => (
              <div key={index} className="flex gap-3">
                <div className="flex flex-col items-center">
                  <div className="w-2 h-2 rounded-full bg-ui-text-muted mt-1.5" />
                  {index < incident.updates.length - 1 && (
                    <div className="w-0.5 flex-1 bg-ui-border mt-1" />
                  )}
                </div>
                <div className="flex-1 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-ui-text-muted uppercase">
                      {statusLabels[update.status] || update.status}
                    </span>
                    <span className="text-xs text-ui-text-muted">
                      {formatTime(update.created_at)}
                    </span>
                  </div>
                  <p className="text-sm text-ui-text-primary mt-1">
                    {update.message}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export function IncidentTimeline({ incidents }: IncidentTimelineProps) {
  if (incidents.length === 0) {
    return (
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-ui-text-primary mb-4">
          Active Incidents
        </h2>
        <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
          <CheckCircle className="h-8 w-8 text-green-500 mx-auto mb-2" />
          <p className="text-green-800 font-medium">No active incidents</p>
          <p className="text-green-600 text-sm mt-1">
            All systems are operating normally
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="mb-8">
      <h2 className="text-lg font-semibold text-ui-text-primary mb-4">
        Active Incidents ({incidents.length})
      </h2>
      <div className="space-y-4">
        {incidents.map((incident) => (
          <IncidentCard key={incident.id} incident={incident} />
        ))}
      </div>
    </div>
  )
}
