import { stageDefinition, type StageKey } from '@/lib/portal/onboarding-stage';
import { getTenantConfig } from '@/lib/tenant';

function brandName(): string {
  return getTenantConfig().branding.companyName;
}

function nextSteps(name: string): Record<StageKey, string> {
  return {
    nominated: `${name} is checking coverage at the clinic address.`,
    introduced: 'Waiting for the clinic to complete setup.',
    details_confirmed: `${name} is assigning kit and a technician. The scheduler will confirm a visit slot with the clinic contact.`,
    changes_requested: `The clinic needs to correct the details ${name} asked for.`,
    visit_booked: `Installation visit booked. Tell the on-site contact to expect ${name}.`,
    installing: `${name} is surveying and installing. Confirm the visit date with ${name} if you have not been given one.`,
    live: 'Service is live. First month from go-live is free.',
  };
}

export function npcNextStep(stage: StageKey): string {
  return nextSteps(brandName())[stage];
}

export function npcGuideSentence(stage: StageKey): string {
  return stageDefinition(stage).description;
}

export function npcNowSentence(
  stage: StageKey,
  install?: { visitDate?: string | null }
): string {
  const visitDate = install?.visitDate?.trim();
  const name = brandName();
  if (stage === 'visit_booked' && visitDate) {
    return `Installation visit booked for ${visitDate}.`;
  }
  if ((stage === 'details_confirmed' || stage === 'introduced' || stage === 'nominated') && !visitDate) {
    return 'Visit date not booked yet.';
  }
  if (stage === 'installing' && visitDate) {
    return `${name} is on site or scheduled for ${visitDate}.`;
  }
  return npcNextStep(stage);
}
