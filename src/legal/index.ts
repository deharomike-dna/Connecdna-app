// src/legal/index.ts
// Public surface of the mobile Legal & Compliance subsystem.

export * from './types'
export * from './registry'
export * from './disclosures'
export * from './acceptanceService'

export { TransactionDisclosureBanner } from './components/TransactionDisclosureBanner'
export { PolicyCheckboxBundle, allRequiredAccepted } from './components/PolicyCheckboxBundle'
export { IntegrationsDisclosure } from './components/IntegrationsDisclosure'
export { LegalCenterScreen } from './screens/LegalCenterScreen'
export { PolicyViewerScreen } from './screens/PolicyViewerScreen'
export { ReacceptanceGate } from './screens/ReacceptanceGate'
