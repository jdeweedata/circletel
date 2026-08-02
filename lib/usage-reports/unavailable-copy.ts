import type { CoreUnavailableDiagnosis } from './types';

/**
 * Turns a core-traffic diagnosis into the causes an admin should read (#689).
 *
 * Rules this encodes:
 * - Every applicable cause is listed, not just the first — a site can be
 *   missing an AP link AND a subscriber mapping at once.
 * - A cause only offers a link when a screen exists that can actually fix it.
 *   Pointing at a page that cannot do the job is worse than saying so.
 * - Retention explains rather than instructs, because no admin can change it.
 * - "Shared group series" is distinct from "no AP linked": the device IS
 *   linked, so telling someone to link one would send them in circles (#701).
 */

export type CoreUnavailableCauseKey =
  | 'no_interstellio'
  | 'no_ap_link'
  | 'window_uncovered'
  | 'group_only';

export interface CoreUnavailableCause {
  key: CoreUnavailableCauseKey;
  title: string;
  detail: string;
  unlock: string;
  /** Present only where a screen can genuinely resolve it. */
  href?: string;
  /** False when nothing an admin does will fix it — explain, don't instruct. */
  actionable: boolean;
}

export function describeCoreUnavailable(
  diagnosis: CoreUnavailableDiagnosis
): CoreUnavailableCause[] {
  // A mapped subscriber means the report has a working source; any Ruijie
  // shortcoming is irrelevant and mentioning it would just be noise.
  if (diagnosis.interstellioMapped) return [];

  const causes: CoreUnavailableCause[] = [
    {
      key: 'no_interstellio',
      title: 'No Interstellio subscriber mapping',
      detail:
        'Periods longer than a week are billed from BNG subscriber accounting, and this site is not mapped to a subscriber.',
      unlock:
        'No admin screen sets this yet — ops must populate corporate_sites.interstellio_subscriber_id for the site.',
      actionable: false,
    },
  ];

  if (!diagnosis.ruijieLinked) {
    causes.push({
      key: 'no_ap_link',
      title: 'No access point linked to this site',
      detail:
        'Without a linked device there is no Ruijie series to fall back on for short periods.',
      unlock: 'Link a device to this site from the network devices page.',
      href: '/admin/network/devices',
      actionable: true,
    });
    return causes;
  }

  if (!diagnosis.ruijieCoversWindow) {
    causes.push({
      key: 'window_uncovered',
      title: 'No Ruijie samples in this period',
      detail:
        'Ruijie rollups reach back roughly two weeks, so they cannot cover this window.',
      unlock: 'Choose a shorter period, or wait for subscriber mapping.',
      actionable: false,
    });
    return causes;
  }

  if (!diagnosis.ruijiePerDeviceSeries) {
    causes.push({
      key: 'group_only',
      title: 'Traffic is only available for the shared network group',
      detail:
        'This site’s access point is linked and reporting, but its traffic is recorded against a network group shared with other sites — so it is not this site’s own usage.',
      unlock:
        'Per-device collection is now running; this resolves itself once enough per-device history exists for the period.',
      actionable: false,
    });
  }

  return causes;
}
