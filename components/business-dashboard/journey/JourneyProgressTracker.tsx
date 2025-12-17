'use client';

/**
 * Journey Progress Tracker Component
 *
 * A reusable component that displays the 6-step B2B customer journey progress.
 * Can be used in both customer dashboard and admin portal.
 *
 * @module components/business-dashboard/journey/JourneyProgressTracker
 */

import React from 'react';
import { cn } from '@/lib/utils';
import { CheckCircle2, Circle, AlertCircle, Clock, LucideIcon } from 'lucide-react';
import {
  B2B_JOURNEY_STAGES,
  JourneyStageId,
  JourneyStageStatus,
  JourneyProgress,
  getStageById,
} from '@/lib/business/journey-config';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';

// ============================================================================
// Types
// ============================================================================

interface JourneyProgressTrackerProps {
  progress: JourneyProgress;
  variant?: 'horizontal' | 'vertical' | 'compact';
  showLabels?: boolean;
  showDescriptions?: boolean;
  onStageClick?: (stageId: JourneyStageId) => void;
  className?: string;
}

interface StageIndicatorProps {
  stage: (typeof B2B_JOURNEY_STAGES)[0];
  status: JourneyStageStatus;
  isCurrent: boolean;
  isClickable?: boolean;
  onClick?: () => void;
  showLabel?: boolean;
  showDescription?: boolean;
  variant: 'horizontal' | 'vertical' | 'compact';
}

// ============================================================================
// Helper Functions
// ============================================================================

function getStatusIcon(status: JourneyStageStatus): LucideIcon {
  switch (status) {
    case 'completed':
      return CheckCircle2;
    case 'in_progress':
      return Clock;
    case 'blocked':
      return AlertCircle;
    default:
      return Circle;
  }
}

function getStatusStyles(status: JourneyStageStatus, isCurrent: boolean): string {
  if (status === 'completed') {
    return 'bg-green-500 text-white border-green-500';
  }
  if (status === 'blocked') {
    return 'bg-red-500 text-white border-red-500';
  }
  if (status === 'in_progress' || isCurrent) {
    return 'bg-circleTel-orange text-white border-circleTel-orange animate-pulse';
  }
  return 'bg-gray-100 text-gray-400 border-gray-300';
}

function getConnectorStyles(status: JourneyStageStatus): string {
  if (status === 'completed') {
    return 'bg-green-500';
  }
  return 'bg-gray-200';
}

// ============================================================================
// Stage Indicator Component
// ============================================================================

function StageIndicator({
  stage,
  status,
  isCurrent,
  isClickable = false,
  onClick,
  showLabel = true,
  showDescription = false,
  variant,
}: StageIndicatorProps) {
  const StatusIcon = getStatusIcon(status);
  const StageIcon = stage.icon;

  const indicatorSize = variant === 'compact' ? 'w-8 h-8' : 'w-12 h-12';
  const iconSize = variant === 'compact' ? 16 : 20;

  const content = (
    <div
      className={cn(
        'flex flex-col items-center',
        variant === 'horizontal' && 'w-full',
        variant === 'vertical' && 'flex-row gap-4',
        isClickable && 'cursor-pointer'
      )}
      onClick={isClickable ? onClick : undefined}
    >
      {/* Step indicator circle */}
      <div
        className={cn(
          'relative flex items-center justify-center rounded-full border-2 transition-all duration-300',
          indicatorSize,
          getStatusStyles(status, isCurrent),
          isClickable && 'hover:scale-110'
        )}
      >
        {status === 'completed' ? (
          <CheckCircle2 size={iconSize} />
        ) : status === 'blocked' ? (
          <AlertCircle size={iconSize} />
        ) : status === 'in_progress' ? (
          <StageIcon size={iconSize} />
        ) : (
          <span className="text-sm font-semibold">{stage.step}</span>
        )}

        {/* Current stage pulse ring */}
        {isCurrent && status !== 'blocked' && (
          <div className="absolute inset-0 rounded-full border-2 border-circleTel-orange animate-ping opacity-50" />
        )}
      </div>

      {/* Labels */}
      {showLabel && variant !== 'compact' && (
        <div
          className={cn(
            'text-center',
            variant === 'horizontal' && 'mt-3',
            variant === 'vertical' && 'flex-1'
          )}
        >
          <p
            className={cn(
              'font-semibold text-sm',
              status === 'completed' && 'text-green-700',
              status === 'blocked' && 'text-red-700',
              isCurrent && status !== 'blocked' && 'text-circleTel-orange',
              status === 'pending' && 'text-gray-400'
            )}
          >
            {stage.title}
          </p>
          {showDescription && (
            <p className="text-xs text-gray-500 mt-1 max-w-[120px]">
              {stage.description}
            </p>
          )}
        </div>
      )}
    </div>
  );

  // Wrap with tooltip for compact variant
  if (variant === 'compact') {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>{content}</TooltipTrigger>
          <TooltipContent>
            <p className="font-semibold">{stage.title}</p>
            <p className="text-xs text-gray-500">{stage.description}</p>
            <Badge
              variant={
                status === 'completed'
                  ? 'default'
                  : status === 'blocked'
                  ? 'destructive'
                  : 'secondary'
              }
              className="mt-1"
            >
              {status.replace('_', ' ')}
            </Badge>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return content;
}

// ============================================================================
// Main Component
// ============================================================================

export function JourneyProgressTracker({
  progress,
  variant = 'horizontal',
  showLabels = true,
  showDescriptions = false,
  onStageClick,
  className,
}: JourneyProgressTrackerProps) {
  // Build status map from progress
  const stageStatusMap = new Map<JourneyStageId, JourneyStageStatus>();
  progress.stages.forEach((s) => {
    stageStatusMap.set(s.stageId, s.status);
  });

  // Horizontal layout (default - shows all 6 steps in a row)
  if (variant === 'horizontal') {
    return (
      <div className={cn('w-full', className)}>
        {/* Progress bar background */}
        <div className="relative">
          <div className="flex items-start justify-between">
            {B2B_JOURNEY_STAGES.map((stage, index) => {
              const status = stageStatusMap.get(stage.id) || 'pending';
              const isCurrent = stage.id === progress.currentStage;

              return (
                <React.Fragment key={stage.id}>
                  {/* Stage indicator */}
                  <div className="flex flex-col items-center flex-1">
                    <StageIndicator
                      stage={stage}
                      status={status}
                      isCurrent={isCurrent}
                      isClickable={!!onStageClick}
                      onClick={() => onStageClick?.(stage.id)}
                      showLabel={showLabels}
                      showDescription={showDescriptions}
                      variant={variant}
                    />
                  </div>

                  {/* Connector line (except after last) */}
                  {index < B2B_JOURNEY_STAGES.length - 1 && (
                    <div className="flex-1 flex items-center px-2 pt-5">
                      <div
                        className={cn(
                          'h-1 w-full rounded-full transition-all duration-500',
                          getConnectorStyles(status)
                        )}
                      />
                    </div>
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>

        {/* Overall progress */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            <span className="font-semibold text-circleTel-darkNeutral">
              {progress.progressPercentage}%
            </span>{' '}
            complete •{' '}
            <span className="font-medium">
              Step {progress.currentStep} of 6
            </span>
          </p>
        </div>
      </div>
    );
  }

  // Vertical layout (for sidebar or mobile)
  if (variant === 'vertical') {
    return (
      <div className={cn('space-y-4', className)}>
        {B2B_JOURNEY_STAGES.map((stage, index) => {
          const status = stageStatusMap.get(stage.id) || 'pending';
          const isCurrent = stage.id === progress.currentStage;

          return (
            <div key={stage.id} className="relative">
              {/* Connector line (except after last) */}
              {index < B2B_JOURNEY_STAGES.length - 1 && (
                <div
                  className={cn(
                    'absolute left-6 top-12 w-0.5 h-8 -translate-x-1/2',
                    getConnectorStyles(status)
                  )}
                />
              )}

              <StageIndicator
                stage={stage}
                status={status}
                isCurrent={isCurrent}
                isClickable={!!onStageClick}
                onClick={() => onStageClick?.(stage.id)}
                showLabel={showLabels}
                showDescription={showDescriptions}
                variant={variant}
              />
            </div>
          );
        })}
      </div>
    );
  }

  // Compact layout (just circles)
  return (
    <div className={cn('flex items-center gap-2', className)}>
      {B2B_JOURNEY_STAGES.map((stage, index) => {
        const status = stageStatusMap.get(stage.id) || 'pending';
        const isCurrent = stage.id === progress.currentStage;

        return (
          <React.Fragment key={stage.id}>
            <StageIndicator
              stage={stage}
              status={status}
              isCurrent={isCurrent}
              isClickable={!!onStageClick}
              onClick={() => onStageClick?.(stage.id)}
              showLabel={false}
              showDescription={false}
              variant={variant}
            />
            {index < B2B_JOURNEY_STAGES.length - 1 && (
              <div
                className={cn(
                  'w-4 h-0.5 rounded-full',
                  getConnectorStyles(status)
                )}
              />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

// ============================================================================
// Export additional components
// ============================================================================

export { StageIndicator };
