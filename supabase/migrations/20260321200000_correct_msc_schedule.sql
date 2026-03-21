-- =============================================================================
-- Migration: correct_msc_schedule
-- =============================================================================
-- Description: Corrects MSC schedule in execution milestones. Contract started
--              September 2025, NOT April 2026. By April 2026 (exec month 1),
--              MSC is already at Q3 (R29,940/mo) and jumps to Q4 (R49,900) in June.
--              Tarana customer targets increased to cover MSC obligations.
-- Version: 1.0
-- Created: 2026-03-21
-- =============================================================================

-- Contract start: September 2025
-- Exec Month 1 (Apr 2026) = Contract Month 8 (Q3): MSC R29,940
-- Exec Month 3 (Jun 2026) = Contract Month 10 (Q4): MSC R49,900
-- Exec Month 6 (Sep 2026) = Contract Month 13 (Q5): MSC R74,850
-- Exec Month 9 (Dec 2026) = Contract Month 16 (Q6): MSC R104,790
-- Exec Month 12 (Mar 2027) = Contract Month 19 (Q7): MSC R139,720

-- To cover MSC, need Tarana wholesale spend >= MSC
-- Each Tarana customer = R499/month wholesale
-- R29,940 MSC needs 60 customers, R49,900 needs 100, etc.

-- Phase 1: Q3 MSC (Months 1-2) — R29,940/mo, shortfall expected
UPDATE execution_milestones SET msc_commitment=29940, target_tarana_customers=20, target_tarana_mrr=34800, target_mrr=41600,
  notes='CORRECTED MSC: Contract Q3=R29,940. Have 12 Tarana (Unjani+existing). MSC shortfall ~R20K.' WHERE month_number=1;
UPDATE execution_milestones SET msc_commitment=29940, target_tarana_customers=35, target_tarana_mrr=60900, target_mrr=81300,
  notes='Q3 MSC R29,940. Unjani billing starts 15 May. 35 Tarana = R17,465 (still short).' WHERE month_number=2;

-- Phase 2: Q4 MSC (Months 3-5) — R49,900/mo, aggressive ramp needed
UPDATE execution_milestones SET msc_commitment=49900, target_tarana_customers=60, target_tarana_mrr=104400, target_mrr=145200,
  notes='CRITICAL: MSC jumps to R49,900 (Q4). 60 Tarana = R29,940. Shortfall R19,960.' WHERE month_number=3;
UPDATE execution_milestones SET msc_commitment=49900, target_tarana_customers=80, target_tarana_mrr=139200, target_mrr=207200,
  notes='Q4 MSC R49,900. 80 Tarana = R39,920. Shortfall R9,980.' WHERE month_number=4;
UPDATE execution_milestones SET msc_commitment=49900, target_tarana_customers=100, target_tarana_mrr=174000, target_mrr=269200,
  notes='Q4 MSC R49,900. 100 Tarana = R49,900. MSC COVERED.' WHERE month_number=5;

-- Phase 3: Q5 MSC (Months 6-8) — R74,850/mo
UPDATE execution_milestones SET msc_commitment=74850, target_tarana_customers=130, target_tarana_mrr=226200, target_mrr=348600,
  notes='Q5 MSC R74,850. 130 Tarana = R64,870. Shortfall R9,980.' WHERE month_number=6;
UPDATE execution_milestones SET msc_commitment=74850, target_tarana_customers=150, target_tarana_mrr=261000, target_mrr=410600,
  notes='Q5 MSC R74,850. 150 Tarana = R74,850. MSC exactly covered.' WHERE month_number=7;
UPDATE execution_milestones SET msc_commitment=74850, target_tarana_customers=170, target_tarana_mrr=295800, target_mrr=479400,
  notes='Q5 MSC R74,850. 170 Tarana = 1.13x MSC coverage.' WHERE month_number=8;

-- Phase 4: Q6 MSC (Months 9-11) — R104,790/mo
UPDATE execution_milestones SET msc_commitment=104790, target_tarana_customers=210, target_tarana_mrr=365400, target_mrr=583000,
  notes='Q6 MSC R104,790. 210 Tarana = R104,790. MSC exactly covered.' WHERE month_number=9;
UPDATE execution_milestones SET msc_commitment=104790, target_tarana_customers=240, target_tarana_mrr=417600, target_mrr=676000,
  notes='Q6 MSC R104,790. 240 Tarana = 1.14x MSC coverage.' WHERE month_number=10;
UPDATE execution_milestones SET msc_commitment=104790, target_tarana_customers=270, target_tarana_mrr=469800, target_mrr=775800,
  notes='Q6 MSC R104,790. 270 Tarana = 1.29x MSC coverage.' WHERE month_number=11;

-- Phase 5: Q7 MSC (Month 12) — R139,720/mo
UPDATE execution_milestones SET msc_commitment=139720, target_tarana_customers=310, target_tarana_mrr=539400, target_mrr=893000,
  notes='Q7 MSC R139,720. 310 Tarana = R154,690. 1.1x coverage. Gap to R1.2M needs DFA+Managed IT.' WHERE month_number=12;

-- =============================================================================
-- End of Migration
-- =============================================================================
