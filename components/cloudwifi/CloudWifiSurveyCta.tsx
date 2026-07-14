"use client";

import React from "react";

import {
  useCloudWifiSurvey,
  type CloudWifiSurveyDraft,
} from "@/components/cloudwifi/CloudWifiSurveyProvider";
import { Button, type ButtonProps } from "@/components/ui/button";

export interface CloudWifiSurveyCtaProps extends ButtonProps {
  prefill?: Partial<CloudWifiSurveyDraft["venue"]>;
}

export function CloudWifiSurveyCta({
  prefill,
  children,
  onClick,
  type = "button",
  ...buttonProps
}: CloudWifiSurveyCtaProps) {
  const { requestSurvey } = useCloudWifiSurvey();

  return (
    <Button
      {...buttonProps}
      type={type}
      onClick={(event) => {
        onClick?.(event);
        if (!event.defaultPrevented) requestSurvey(prefill);
      }}
    >
      {children}
    </Button>
  );
}
