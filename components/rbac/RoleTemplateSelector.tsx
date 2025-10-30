/**
 * Role Template Selector Component
 *
 * Allows users to select from available role templates when requesting access
 */

'use client'

import { useState } from 'react'
import { RoleTemplate, ROLE_TEMPLATES, DEPARTMENTS } from '@/lib/rbac/role-templates'
import { Card, CardContent, CardDescription, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import {
  Shield,
  Crown,
  Package,
  Target,
  TrendingUp,
  Headphones,
  FileEdit,
  Book,
  Search,
  Cpu,
  Sparkles,
  Briefcase,
  Users,
  Map,
  Settings,
  DollarSign,
  BarChart,
  Workflow,
  UserCheck,
  Handshake,
  Megaphone,
  MessageCircle,
  Server,
  Eye,
  Calculator,
  Receipt,
  Truck,
  ClipboardList
} from 'lucide-react'

const ICON_MAP: Record<string, React.ComponentType<{className?: string}>> = {
  Shield,
  Crown,
  Package,
  Target,
  TrendingUp,
  Headphones,
  FileEdit,
  Book,
  Cpu,
  Sparkles,
  Briefcase,
  Users,
  Map,
  Settings,
  DollarSign,
  BarChart,
  Workflow,
  UserCheck,
  Handshake,
  Megaphone,
  MessageCircle,
  Server,
  Eye,
  Calculator,
  Receipt,
  Truck,
  ClipboardList
}

interface RoleTemplateSelectorProps {
  value: string
  onChange: (templateId: string) => void
  showAllTemplates?: boolean // If true, shows all templates; if false, only default ones
}

export function RoleTemplateSelector({
  value,
  onChange,
  showAllTemplates = false,
}: RoleTemplateSelectorProps) {
  const [selectedDepartment, setSelectedDepartment] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')

  // Filter templates
  const filteredTemplates = Object.values(ROLE_TEMPLATES).filter(template => {
    // Filter by default flag if needed
    if (!showAllTemplates && !template.isDefault) {
      return false
    }

    // Filter by department
    if (selectedDepartment !== 'all' && template.department !== selectedDepartment) {
      return false
    }

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      return (
        template.name.toLowerCase().includes(query) ||
        template.description.toLowerCase().includes(query) ||
        template.department.toLowerCase().includes(query)
      )
    }

    return true
  })

  const getLevelBadgeColor = (level: RoleTemplate['level']) => {
    switch (level) {
      case 'executive':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300'
      case 'management':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300'
      case 'staff':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
      case 'support':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getIcon = (iconName: string | undefined) => {
    if (!iconName) return Shield
    return ICON_MAP[iconName] || Shield
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search roles..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="All Departments" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Departments</SelectItem>
            {DEPARTMENTS.map(dept => (
              <SelectItem key={dept} value={dept}>{dept}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Role Templates Grid */}
      <RadioGroup value={value} onValueChange={onChange}>
        <div className="grid gap-4 md:grid-cols-2">
          {filteredTemplates.map(template => {
            const Icon = getIcon(template.icon)
            const isSelected = value === template.id

            return (
              <Label
                key={template.id}
                htmlFor={template.id}
                className="cursor-pointer"
              >
                <Card
                  className={`transition-all ${
                    isSelected
                      ? 'ring-2 ring-circleTel-orange border-circleTel-orange'
                      : 'hover:shadow-md'
                  }`}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg bg-${template.color}-100`}>
                          <Icon className={`h-5 w-5 text-${template.color}-600`} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <RadioGroupItem
                              value={template.id}
                              id={template.id}
                              className="sr-only"
                            />
                            <h3 className="font-semibold text-base">{template.name}</h3>
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline" className="text-xs">
                              {template.department}
                            </Badge>
                            <Badge className={`text-xs ${getLevelBadgeColor(template.level)}`}>
                              {template.level}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-sm">
                      {template.description}
                    </CardDescription>
                    <div className="mt-3 text-xs text-gray-500">
                      {template.permissions.length} permissions
                    </div>
                  </CardContent>
                </Card>
              </Label>
            )
          })}
        </div>
      </RadioGroup>

      {filteredTemplates.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <p>No role templates found matching your criteria.</p>
          <p className="text-sm mt-2">Try adjusting your filters or search query.</p>
        </div>
      )}

      {!showAllTemplates && (
        <div className="text-sm text-gray-500 text-center">
          Showing default roles. Contact an administrator for custom role assignments.
        </div>
      )}
    </div>
  )
}
