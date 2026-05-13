# Compliance & Audit Logging Disclosure


**ConneCDNA is a platform operated by Silvermoon Capital LLC.**

## 1. Purpose

This Disclosure explains how ConneCDNA processes data, generates audit and execution-event logs, and maintains compliance evidence trails. Audit and execution-event logging is a core function of the Platform and supports customer compliance programs as well as ConneCDNA's software-only operating model.

## 2. Categories of Data Processed

- Customer Data submitted by you for orchestration and verification.
- Connection data received from Third-Party Services.
- Identity-verification artifacts and outcomes (as outputs of licensed identity providers).
- Execution-event metadata: timestamps, actors, workflow steps, decisions, outcomes, and references.
- Security telemetry: authentication events, IPs, device data, error rates.
- Operational logs: API request/response metadata, retries, rate-limit data.

## 3. Audit Log Principles

- **Append-only**: audit logs are designed to be append-only and tamper-evident.
- **Comprehensive**: workflow, verification, identity, and execution events are logged with sufficient context to support reconstruction.
- **Access-controlled**: access to logs is restricted to authorized personnel and is itself logged.
- **Retained**: logs are retained for the period required by applicable law, contract, and customer configuration.

## 4. Use of Data

Data is used to provide and secure the Platform, to orchestrate workflows, to detect and respond to fraud and abuse, to comply with law, to support customer compliance and audit needs, and to produce de-identified, aggregated analytics that do not identify any user or individual.

## 5. Retention and Deletion

Default retention periods for audit and execution-event logs are set forth in the applicable order form or product documentation. On termination, Customer Data is deleted or returned in accordance with the order form, except for (i) backups subject to standard rotation; (ii) data retained as required by law, regulation, or legal hold; and (iii) audit logs retained for compliance evidence purposes.

## 6. Compliance Evidence Trails

On appropriate request and subject to confidentiality, ConneCDNA may make compliance evidence trails available to Customers to support their internal audits, regulator inquiries, or counterparty diligence. ConneCDNA does not provide privileged or confidential information of other customers.

## 7. HIPAA Considerations

Where a BAA is in place, audit logs related to PHI are processed and retained as required by HIPAA and the BAA, including breach-notification requirements. Default Platform configurations are not authorized for PHI absent a BAA.

---

**ConneCDNA is a platform operated by Silvermoon Capital LLC. All intellectual property rights reserved.** The ConneCDNA name, logo, trademarks, service marks, software, infrastructure, execution systems, orchestration systems, identity systems, API frameworks, and all related materials are the exclusive property of Silvermoon Capital LLC.
