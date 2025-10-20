'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Activity,
  CheckCircle2,
  Clock,
  AlertCircle,
  TrendingUp,
  Users,
  Zap,
  BarChart3
} from 'lucide-react';

// ============================================================================
// Types
// ============================================================================

interface WorkflowStatus {
  id: string;
  name: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  currentStep: number;
  totalSteps: number;
  percentComplete: number;
  estimatedTimeRemaining: number; // minutes
  checkpointsCompleted: number;
  checkpointsTotal: number;
  qualityGatesPassed: number;
  qualityGatesTotal: number;
  primaryAgent: string;
  supportingAgents: string[];
  startTime: Date;
  endTime?: Date;
  steps: WorkflowStepStatus[];
}

interface WorkflowStepStatus {
  step: number;
  agent: string;
  type: 'sub-agent' | 'skill';
  task: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  startTime?: Date;
  endTime?: Date;
  duration?: number; // minutes
  parallelGroup?: string;
}

interface AgentUtilization {
  name: string;
  status: 'idle' | 'active';
  activeTasks: number;
  completedToday: number;
  averageTime: number; // minutes
  successRate: number; // percentage
}

interface RoutingMetrics {
  totalRouted: number;
  routingAccuracy: number;
  averageResponseTime: number; // seconds
  intentDetectionRate: number;
  layerDetectionRate: number;
}

// ============================================================================
// Mock Data (Replace with real data in production)
// ============================================================================

const mockWorkflows: WorkflowStatus[] = [
  {
    id: 'wf-001',
    name: 'Customer Referral Program',
    status: 'in_progress',
    currentStep: 3,
    totalSteps: 7,
    percentComplete: 45,
    estimatedTimeRemaining: 75,
    checkpointsCompleted: 1,
    checkpointsTotal: 5,
    qualityGatesPassed: 0,
    qualityGatesTotal: 4,
    primaryAgent: 'full-stack-dev',
    supportingAgents: ['product-manager-agent', 'testing-agent', 'documentation-agent'],
    startTime: new Date(Date.now() - 60 * 60 * 1000), // 1 hour ago
    steps: [
      { step: 1, agent: 'product-manager-agent', type: 'sub-agent', task: 'Generate user stories', status: 'completed', duration: 15 },
      { step: 2, agent: 'full-stack-dev', type: 'sub-agent', task: 'Implement feature', status: 'in_progress' },
      { step: 3, agent: 'testing-agent', type: 'sub-agent', task: 'Generate tests', status: 'pending', parallelGroup: 'quality' },
      { step: 4, agent: 'code-reviewer', type: 'skill', task: 'Review code', status: 'pending', parallelGroup: 'quality' },
      { step: 5, agent: 'documentation-agent', type: 'sub-agent', task: 'Generate docs', status: 'pending', parallelGroup: 'quality' },
      { step: 6, agent: 'deployment-check', type: 'skill', task: 'Validate deployment', status: 'pending' },
      { step: 7, agent: 'devops-agent', type: 'sub-agent', task: 'Deploy', status: 'pending' },
    ]
  },
  {
    id: 'wf-002',
    name: 'Invoice Download Feature',
    status: 'in_progress',
    currentStep: 2,
    totalSteps: 3,
    percentComplete: 66,
    estimatedTimeRemaining: 15,
    checkpointsCompleted: 2,
    checkpointsTotal: 3,
    qualityGatesPassed: 1,
    qualityGatesTotal: 2,
    primaryAgent: 'full-stack-dev',
    supportingAgents: ['testing-agent'],
    startTime: new Date(Date.now() - 30 * 60 * 1000), // 30 min ago
    steps: [
      { step: 1, agent: 'full-stack-dev', type: 'sub-agent', task: 'Implement invoice download', status: 'completed', duration: 45 },
      { step: 2, agent: 'testing-agent', type: 'sub-agent', task: 'Generate tests', status: 'in_progress' },
      { step: 3, agent: 'deployment-check', type: 'skill', task: 'Validate', status: 'pending' },
    ]
  },
];

const mockAgentUtilization: AgentUtilization[] = [
  { name: 'full-stack-dev', status: 'active', activeTasks: 2, completedToday: 5, averageTime: 65, successRate: 95 },
  { name: 'frontend-specialist', status: 'idle', activeTasks: 0, completedToday: 3, averageTime: 25, successRate: 100 },
  { name: 'backend-specialist', status: 'idle', activeTasks: 0, completedToday: 2, averageTime: 30, successRate: 100 },
  { name: 'integration-specialist', status: 'active', activeTasks: 1, completedToday: 1, averageTime: 55, successRate: 100 },
  { name: 'testing-agent', status: 'active', activeTasks: 2, completedToday: 7, averageTime: 20, successRate: 100 },
  { name: 'refactoring-agent', status: 'idle', activeTasks: 0, completedToday: 1, averageTime: 40, successRate: 100 },
  { name: 'bug-hunter-agent', status: 'idle', activeTasks: 0, completedToday: 2, averageTime: 35, successRate: 90 },
  { name: 'performance-optimizer', status: 'idle', activeTasks: 0, completedToday: 0, averageTime: 0, successRate: 0 },
];

const mockRoutingMetrics: RoutingMetrics = {
  totalRouted: 18,
  routingAccuracy: 100,
  averageResponseTime: 0.8,
  intentDetectionRate: 94,
  layerDetectionRate: 94,
};

// ============================================================================
// Components
// ============================================================================

const StatusBadge: React.FC<{ status: WorkflowStatus['status'] }> = ({ status }) => {
  const variants = {
    pending: 'secondary',
    in_progress: 'default',
    completed: 'default',
    failed: 'destructive',
  } as const;

  const icons = {
    pending: Clock,
    in_progress: Activity,
    completed: CheckCircle2,
    failed: AlertCircle,
  };

  const Icon = icons[status];

  return (
    <Badge variant={variants[status]} className="gap-1">
      <Icon className="h-3 w-3" />
      {status.replace('_', ' ')}
    </Badge>
  );
};

const WorkflowCard: React.FC<{ workflow: WorkflowStatus }> = ({ workflow }) => {
  const duration = workflow.endTime
    ? Math.round((workflow.endTime.getTime() - workflow.startTime.getTime()) / 60000)
    : Math.round((Date.now() - workflow.startTime.getTime()) / 60000);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg">{workflow.name}</CardTitle>
            <CardDescription className="mt-1">
              Primary: {workflow.primaryAgent}
            </CardDescription>
          </div>
          <StatusBadge status={workflow.status} />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Progress */}
        <div>
          <div className="flex items-center justify-between mb-2 text-sm">
            <span className="text-muted-foreground">Progress</span>
            <span className="font-medium">{workflow.percentComplete}%</span>
          </div>
          <Progress value={workflow.percentComplete} className="h-2" />
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground">Steps</p>
            <p className="font-medium">{workflow.currentStep} / {workflow.totalSteps}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Duration</p>
            <p className="font-medium">{duration} min</p>
          </div>
          <div>
            <p className="text-muted-foreground">Checkpoints</p>
            <p className="font-medium">{workflow.checkpointsCompleted} / {workflow.checkpointsTotal}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Quality Gates</p>
            <p className="font-medium">{workflow.qualityGatesPassed} / {workflow.qualityGatesTotal}</p>
          </div>
        </div>

        {/* Steps List */}
        <div className="space-y-2">
          <p className="text-sm font-medium">Workflow Steps</p>
          {workflow.steps.map((step) => (
            <div
              key={step.step}
              className="flex items-center gap-2 text-sm pl-4 border-l-2"
              style={{
                borderColor: step.status === 'completed' ? '#22c55e' :
                             step.status === 'in_progress' ? '#f59e0b' : '#e5e7eb'
              }}
            >
              <div className="flex-1">
                <span className={step.parallelGroup ? 'text-muted-foreground' : ''}>
                  {step.parallelGroup && '(parallel) '}
                  Step {step.step}: {step.agent}
                </span>
                <p className="text-xs text-muted-foreground">{step.task}</p>
              </div>
              <StatusBadge status={step.status} />
            </div>
          ))}
        </div>

        {/* Supporting Agents */}
        {workflow.supportingAgents.length > 0 && (
          <div>
            <p className="text-sm text-muted-foreground mb-2">Supporting Agents</p>
            <div className="flex flex-wrap gap-2">
              {workflow.supportingAgents.map((agent) => (
                <Badge key={agent} variant="outline" className="text-xs">
                  {agent}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Time Remaining */}
        {workflow.status === 'in_progress' && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span>~{workflow.estimatedTimeRemaining} min remaining</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

const AgentUtilizationCard: React.FC<{ agent: AgentUtilization }> = ({ agent }) => {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">{agent.name}</CardTitle>
          <Badge variant={agent.status === 'active' ? 'default' : 'secondary'}>
            {agent.status}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground">Active Tasks</p>
            <p className="text-2xl font-bold">{agent.activeTasks}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Completed Today</p>
            <p className="text-2xl font-bold">{agent.completedToday}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Avg Time</p>
            <p className="font-medium">{agent.averageTime} min</p>
          </div>
          <div>
            <p className="text-muted-foreground">Success Rate</p>
            <p className="font-medium">{agent.successRate}%</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// ============================================================================
// Main Dashboard Component
// ============================================================================

export const OrchestratorDashboard: React.FC = () => {
  const [workflows, setWorkflows] = useState<WorkflowStatus[]>(mockWorkflows);
  const [agents, setAgents] = useState<AgentUtilization[]>(mockAgentUtilization);
  const [metrics, setMetrics] = useState<RoutingMetrics>(mockRoutingMetrics);

  // Simulate real-time updates (replace with actual data fetching)
  useEffect(() => {
    const interval = setInterval(() => {
      setWorkflows(prev => prev.map(w => {
        if (w.status === 'in_progress') {
          const newPercent = Math.min(w.percentComplete + 1, 100);
          return {
            ...w,
            percentComplete: newPercent,
            estimatedTimeRemaining: Math.max(w.estimatedTimeRemaining - 1, 0),
          };
        }
        return w;
      }));
    }, 5000); // Update every 5 seconds

    return () => clearInterval(interval);
  }, []);

  const activeWorkflows = workflows.filter(w => w.status === 'in_progress');
  const completedWorkflows = workflows.filter(w => w.status === 'completed');
  const activeAgents = agents.filter(a => a.status === 'active');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Orchestrator Dashboard</h1>
        <p className="text-muted-foreground mt-2">
          Real-time monitoring of AI agent workflows and performance metrics
        </p>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Active Workflows</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeWorkflows.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {workflows.length} total workflows
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Routing Accuracy</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.routingAccuracy}%</div>
            <p className="text-xs text-muted-foreground mt-1">
              {metrics.totalRouted} tasks routed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Active Agents</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeAgents.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {agents.length} total agents
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Avg Response Time</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.averageResponseTime}s</div>
            <p className="text-xs text-muted-foreground mt-1">
              Target: &lt;2s
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="workflows" className="space-y-4">
        <TabsList>
          <TabsTrigger value="workflows">Active Workflows</TabsTrigger>
          <TabsTrigger value="agents">Agent Utilization</TabsTrigger>
          <TabsTrigger value="metrics">Performance Metrics</TabsTrigger>
        </TabsList>

        {/* Active Workflows Tab */}
        <TabsContent value="workflows" className="space-y-4">
          {activeWorkflows.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No active workflows</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {activeWorkflows.map((workflow) => (
                <WorkflowCard key={workflow.id} workflow={workflow} />
              ))}
            </div>
          )}

          {completedWorkflows.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-4">Recently Completed</h3>
              <div className="grid gap-4 md:grid-cols-2">
                {completedWorkflows.slice(0, 4).map((workflow) => (
                  <WorkflowCard key={workflow.id} workflow={workflow} />
                ))}
              </div>
            </div>
          )}
        </TabsContent>

        {/* Agent Utilization Tab */}
        <TabsContent value="agents" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {agents.map((agent) => (
              <AgentUtilizationCard key={agent.name} agent={agent} />
            ))}
          </div>
        </TabsContent>

        {/* Performance Metrics Tab */}
        <TabsContent value="metrics" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Routing Performance</CardTitle>
                <CardDescription>Orchestrator decision quality metrics</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-muted-foreground">Routing Accuracy</span>
                    <span className="text-sm font-medium">{metrics.routingAccuracy}%</span>
                  </div>
                  <Progress value={metrics.routingAccuracy} className="h-2" />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-muted-foreground">Intent Detection</span>
                    <span className="text-sm font-medium">{metrics.intentDetectionRate}%</span>
                  </div>
                  <Progress value={metrics.intentDetectionRate} className="h-2" />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-muted-foreground">Layer Detection</span>
                    <span className="text-sm font-medium">{metrics.layerDetectionRate}%</span>
                  </div>
                  <Progress value={metrics.layerDetectionRate} className="h-2" />
                </div>

                <div className="pt-4 border-t">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Total Tasks Routed</span>
                    <span className="text-2xl font-bold">{metrics.totalRouted}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Quality Gates</CardTitle>
                <CardDescription>Automated quality enforcement</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <span className="text-sm">TypeScript Validation</span>
                  </div>
                  <Badge variant="default">100%</Badge>
                </div>

                <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <span className="text-sm">Tests Passing</span>
                  </div>
                  <Badge variant="default">98%</Badge>
                </div>

                <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <span className="text-sm">RBAC Permissions</span>
                  </div>
                  <Badge variant="default">100%</Badge>
                </div>

                <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-yellow-600" />
                    <span className="text-sm">Documentation</span>
                  </div>
                  <Badge variant="secondary">90%</Badge>
                </div>

                <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <span className="text-sm">Deployment Checks</span>
                  </div>
                  <Badge variant="default">100%</Badge>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Agent Performance Summary
              </CardTitle>
              <CardDescription>Completed tasks by agent today</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {agents
                  .sort((a, b) => b.completedToday - a.completedToday)
                  .map((agent) => (
                    <div key={agent.name}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm">{agent.name}</span>
                        <span className="text-sm font-medium">{agent.completedToday} tasks</span>
                      </div>
                      <Progress
                        value={(agent.completedToday / Math.max(...agents.map(a => a.completedToday))) * 100}
                        className="h-2"
                      />
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default OrchestratorDashboard;
