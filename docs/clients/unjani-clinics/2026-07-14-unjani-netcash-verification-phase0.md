# Unjani × NetCash verification (Phase 0)

**Generated:** 2026-07-14T21:45:34.698Z  
**Auth used (read-only):** `NETCASH_DEBIT_ORDER_SERVICE_KEY` (RequestMandateData/RetrieveMandateData), `NETCASH_ACCOUNT_SERVICE_KEY` (merchant statements)  
**Joined to:** `2026-07-14-unjani-vat-correction-register-phase0.csv`  
**Output CSV:** `docs/clients/unjani-clinics/2026-07-14-unjani-netcash-verification-phase0.csv`

## API connectivity

| API | Status |
|-----|--------|
| Mandate file | OK — 16 rows |
| Statement dates queried | 2026-06-26, 2026-07-01, 2026-07-02, 2026-07-07, 2026-07-10 |
| Statement txs loaded | 25 |

## Cohort summary

| Metric | Count |
|--------|------:|
| Register rows | 23 |
| NetCash mandate outcome=active | 1 |
| Mandate missing from NetCash file | 12 |
| max_debit below target (517.50) | 0 |
| DB completed collection at R450 | 3 |
| DB completed collection at R276 | 4 |
| Rows with statement hits | 10 |

## Non-LEAVE rows (action + NetCash flags)

- **INV-2026-00025** | CT-2026-00017 | Unjani Clinic - Barcelona  
  action=`AMEND_OPEN` · netcash_mandate=`Awaiting authorisation` · max_debit=`` · db_method=`debit_order`  
  notes=`MANDATE_NOT_ACTIVE|OPEN_UNPAID_AMEND_CANDIDATE`  
  txs=`276@completed`  
  statement=`2026-06-26:TDD:276:+:`

- **INV-2026-00026** | CT-2026-00016 | Unjani Clinic - Heidelberg  
  action=`AMEND_OPEN` · netcash_mandate=`Awaiting authorisation` · max_debit=`` · db_method=`debit_order`  
  notes=`MANDATE_NOT_ACTIVE|OPEN_UNPAID_AMEND_CANDIDATE`  
  txs=`276@completed`  
  statement=`2026-06-26:TDD:276:+:`

- **INV-2026-00030** | CT-2026-00019 | Unjani Clinic - Jabulani  
  action=`AMEND_OPEN` · netcash_mandate=`NOT_IN_MANDATE_FILE` · max_debit=`` · db_method=``  
  notes=`NO_NETCASH_MANDATE_ROW|OPEN_UNPAID_AMEND_CANDIDATE`  
  txs=`none`  
  statement=`none`

- **INV-2026-00032** | CT-2026-00026 | Unjani Clinic - New Hanover  
  action=`AMEND_OPEN` · netcash_mandate=`NOT_IN_MANDATE_FILE` · max_debit=`` · db_method=``  
  notes=`NO_NETCASH_MANDATE_ROW|OPEN_UNPAID_AMEND_CANDIDATE`  
  txs=`none`  
  statement=`none`

- **INV-2026-00033** | CT-2026-00027 | Unjani Clinic - Umsinga  
  action=`AMEND_OPEN` · netcash_mandate=`NOT_IN_MANDATE_FILE` · max_debit=`` · db_method=``  
  notes=`NO_NETCASH_MANDATE_ROW|OPEN_UNPAID_AMEND_CANDIDATE`  
  txs=`none`  
  statement=`none`

- **INV-2026-00027** | CT-2026-00022 | Unjani Clinic - Kayamandi  
  action=`REBUILD_PARTIAL` · netcash_mandate=`Awaiting authorisation` · max_debit=`` · db_method=`debit_order`  
  notes=`MANDATE_NOT_ACTIVE`  
  txs=`276@completed`  
  statement=`2026-07-01:TDD:276:+:`

- **INV-2026-00023** | CT-2026-00013 | Unjani Clinic - Sky City  
  action=`TOPUP_67_50` · netcash_mandate=`NOT_IN_MANDATE_FILE` · max_debit=`` · db_method=``  
  notes=`DB_TX_MATCHES_INVOICE_TOTAL|COLLECTED_450_WRONG_FULL_MONTH|STATEMENT_AMOUNT_MATCHES_INVOICE|NO_NETCASH_MANDATE_ROW|TOPUP_CANDIDATE_CONFIRMED_PAID_450`  
  txs=`450@completed`  
  statement=`2026-06-26:OBL:3273.99:+: | 2026-06-26:TDD:276:+: | 2026-06-26:TDD:276:+: | 2026-06-26:CBL:3825.99:+: | 2026-07-01:OBL:4707.63:+: | 2026-07-01:TDD:276:+: | 2026-07-01:TDD:276:+: | 2026-07-01:NSF:385.84:-: | 2026-07-01:VAT:57.9:-: | 2026-07-01:SDD:999:+: | 2026-07-01:CBL:5814.89:+: | 2026-07-02:OBL:5814.89:+: | 2026-07-02:PIA:0:+:CT-696d052a-da5a-47dd-84c6-0b1f59fa2c1d-1782871229328 | 2026-07-02:PNA:0:+:CT-696d052a-da5a-47dd-84c6-0b1f59fa2c1d-1782871229328 | 2026-07-02:PNA:0:+:CT-271183e9-6de0-4c24-9435-e72cc70ded96-1782871226256 | 2026-07-02:PIF:0:+:CT-696d052a-da5a-47dd-84c6-0b1f59fa2c1d-1782871229328 | 2026-07-02:PNC:450:+:CT-271183e9-6de0-4c24-9435-e72cc70ded96-1782871226256 | 2026-07-02:PNC:450:+:CT-696d052a-da5a-47dd-84c6-0b1f59fa2c1d-1782871229328 | 2026-07-02:CBL:6714.89:+: | 2026-07-07:OBL:7163.89:+: | 2026-07-07:PNA:0:+:CT-83def339-91b0-42f5-8bdb-f26701692c19-1782871256192 | 2026-07-07:PNC:450:+:CT-83def339-91b0-42f5-8bdb-f26701692c19-1782871256192 | 2026-07-07:CBL:7613.89:+: | 2026-07-10:OBL:7613.89:+: | 2026-07-10:CBL:7613.89:+:`

- **INV-2026-00024** | CT-2026-00014 | Unjani Clinic - Tokoza  
  action=`TOPUP_67_50` · netcash_mandate=`NOT_IN_MANDATE_FILE` · max_debit=`` · db_method=``  
  notes=`DB_TX_MATCHES_INVOICE_TOTAL|COLLECTED_450_WRONG_FULL_MONTH|STATEMENT_AMOUNT_MATCHES_INVOICE|NO_NETCASH_MANDATE_ROW|TOPUP_CANDIDATE_CONFIRMED_PAID_450`  
  txs=`450@completed`  
  statement=`2026-06-26:OBL:3273.99:+: | 2026-06-26:TDD:276:+: | 2026-06-26:TDD:276:+: | 2026-06-26:CBL:3825.99:+: | 2026-07-01:OBL:4707.63:+: | 2026-07-01:TDD:276:+: | 2026-07-01:TDD:276:+: | 2026-07-01:NSF:385.84:-: | 2026-07-01:VAT:57.9:-: | 2026-07-01:SDD:999:+: | 2026-07-01:CBL:5814.89:+: | 2026-07-02:OBL:5814.89:+: | 2026-07-02:PIA:0:+:CT-696d052a-da5a-47dd-84c6-0b1f59fa2c1d-1782871229328 | 2026-07-02:PNA:0:+:CT-696d052a-da5a-47dd-84c6-0b1f59fa2c1d-1782871229328 | 2026-07-02:PNA:0:+:CT-271183e9-6de0-4c24-9435-e72cc70ded96-1782871226256 | 2026-07-02:PIF:0:+:CT-696d052a-da5a-47dd-84c6-0b1f59fa2c1d-1782871229328 | 2026-07-02:PNC:450:+:CT-271183e9-6de0-4c24-9435-e72cc70ded96-1782871226256 | 2026-07-02:PNC:450:+:CT-696d052a-da5a-47dd-84c6-0b1f59fa2c1d-1782871229328 | 2026-07-02:CBL:6714.89:+: | 2026-07-07:OBL:7163.89:+: | 2026-07-07:PNA:0:+:CT-83def339-91b0-42f5-8bdb-f26701692c19-1782871256192 | 2026-07-07:PNC:450:+:CT-83def339-91b0-42f5-8bdb-f26701692c19-1782871256192 | 2026-07-07:CBL:7613.89:+: | 2026-07-10:OBL:7613.89:+: | 2026-07-10:CBL:7613.89:+:`

- **INV-2026-00034** | CT-2026-00020 | Unjani Clinic - Lens ext 10  
  action=`TOPUP_67_50` · netcash_mandate=`Awaiting authorisation` · max_debit=`` · db_method=``  
  notes=`DB_TX_MATCHES_INVOICE_TOTAL|COLLECTED_450_WRONG_FULL_MONTH|STATEMENT_AMOUNT_MATCHES_INVOICE|MANDATE_NOT_ACTIVE|TOPUP_CANDIDATE_CONFIRMED_PAID_450`  
  txs=`450@completed`  
  statement=`2026-06-26:OBL:3273.99:+: | 2026-06-26:TDD:276:+: | 2026-06-26:TDD:276:+: | 2026-06-26:CBL:3825.99:+: | 2026-07-01:OBL:4707.63:+: | 2026-07-01:TDD:276:+: | 2026-07-01:TDD:276:+: | 2026-07-01:NSF:385.84:-: | 2026-07-01:VAT:57.9:-: | 2026-07-01:SDD:999:+: | 2026-07-01:CBL:5814.89:+: | 2026-07-02:OBL:5814.89:+: | 2026-07-02:PIA:0:+:CT-696d052a-da5a-47dd-84c6-0b1f59fa2c1d-1782871229328 | 2026-07-02:PNA:0:+:CT-696d052a-da5a-47dd-84c6-0b1f59fa2c1d-1782871229328 | 2026-07-02:PNA:0:+:CT-271183e9-6de0-4c24-9435-e72cc70ded96-1782871226256 | 2026-07-02:PIF:0:+:CT-696d052a-da5a-47dd-84c6-0b1f59fa2c1d-1782871229328 | 2026-07-02:PNC:450:+:CT-271183e9-6de0-4c24-9435-e72cc70ded96-1782871226256 | 2026-07-02:PNC:450:+:CT-696d052a-da5a-47dd-84c6-0b1f59fa2c1d-1782871229328 | 2026-07-02:CBL:6714.89:+: | 2026-07-07:OBL:7163.89:+: | 2026-07-07:PNA:0:+:CT-83def339-91b0-42f5-8bdb-f26701692c19-1782871256192 | 2026-07-07:PNC:450:+:CT-83def339-91b0-42f5-8bdb-f26701692c19-1782871256192 | 2026-07-07:CBL:7613.89:+: | 2026-07-10:OBL:7613.89:+: | 2026-07-10:CBL:7613.89:+:`

- **INV-2026-00021** | CT-2026-00009 | Unjani Clinic - Alexandra  
  action=`IGNORE_VOID` · netcash_mandate=`NOT_IN_MANDATE_FILE` · max_debit=`` · db_method=``  
  notes=`NO_NETCASH_MANDATE_ROW`  
  txs=`none`  
  statement=`none`

- **INV-2026-00022** | CT-2026-00010 | Unjani Clinic - Chloorkop  
  action=`IGNORE_VOID` · netcash_mandate=`NOT_IN_MANDATE_FILE` · max_debit=`` · db_method=``  
  notes=`NO_NETCASH_MANDATE_ROW`  
  txs=`none`  
  statement=`none`

- **INV-2026-00028** | CT-2026-00015 | Unjani Clinic - Sicelo  
  action=`IGNORE_VOID` · netcash_mandate=`NOT_IN_MANDATE_FILE` · max_debit=`` · db_method=``  
  notes=`NO_NETCASH_MANDATE_ROW`  
  txs=`none`  
  statement=`none`

- **INV-2026-00029** | CT-2026-00018 | Unjani Clinic - Oukasie  
  action=`IGNORE_VOID` · netcash_mandate=`NOT_IN_MANDATE_FILE` · max_debit=`` · db_method=``  
  notes=`NO_NETCASH_MANDATE_ROW`  
  txs=`none`  
  statement=`none`

- **INV-2026-00031** | CT-2026-00025 | Unjani Clinic - Phoenix  
  action=`IGNORE_VOID` · netcash_mandate=`NOT_IN_MANDATE_FILE` · max_debit=`` · db_method=``  
  notes=`NO_NETCASH_MANDATE_ROW`  
  txs=`none`  
  statement=`none`

## Notes

- Debit batches use **accountReference = invoice_number** and **amount = invoice.total_amount** (see `scripts/netcash/collect-pilot.ts`).
- Verification is **read-only** — no batches submitted, no mandates changed.
- If mandate max amount is missing/null in DB, check NetCash portal for live cap before scheduling R517.50.
