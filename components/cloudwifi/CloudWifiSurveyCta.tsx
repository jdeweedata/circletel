"use client";

import React from "react";

import {
  useCloudWifiSurvey,
  type CloudWifiSurveyDraft,
} from "@/components/cloudwifi/CloudWifiSurveyProvider";
import { Button, type ButtonProps } from "@/components/ui/button";

export interface CloudWifiSurveyCtaProps extends Omit<ButtonProps, "asChild"> {
  prefill?: Partial<CloudWifiSurveyDraft["venue"]>;
  planInterest?: string;
}

export function CloudWifiSurveyCta({
  prefill,
  planInterest,
  children,
  onClick,
  type = "button",
  ...buttonProps
}: CloudWifiSurveyCtaProps) {
  const { requestSurvey } = useCloudWifiSurvey();

  return (
    <Button
      {...buttonProps}
      data-cloudwifi-survey-opener="true"
      type={type}
      onClick={(event) => {
        onClick?.(event);
        if (!event.defaultPrevented)
          requestSurvey(prefill, event.currentTarget, planInterest);
      }}
    >
      {children}
    </Button>
  );
}
