export type UserRole =
  'EXEC' | 'HOD' | 'DIR' | 'SITE_ENG' | 'CONTRACTOR' | 'QA' | 'VENDOR' | 'SYSTEM_ADMIN' | 'AUDITOR';

export interface DashboardConfig {
  label: string;
  widgets: string[];
}

export const DASHBOARD_CONFIG: Record<UserRole, DashboardConfig> = {
  EXEC: {
    label: 'Executive Dashboard',
    widgets: ['myWorkRequests', 'workflowStatus', 'submitRequest'],
  },
  HOD: {
    label: 'HOD Dashboard',
    widgets: ['pendingApprovals', 'ncrRegister', 'ipcCertification', 'qualityHoldPoints'],
  },
  DIR: {
    label: 'Director Dashboard',
    widgets: [
      'totalSites',
      'activeWorkPackages',
      'overallCompletion',
      'delayedSites',
      'pendingApprovals',
      'provinceComparison',
    ],
  },
  SITE_ENG: {
    label: 'Site Engineer Dashboard',
    widgets: [
      'dailyProgressEntry',
      'taskList',
      'materialConsumption',
      'holdPointsPending',
      'hseIncidents',
    ],
  },
  CONTRACTOR: {
    label: 'Contractor Dashboard',
    widgets: ['assignedTasks', 'progressUpdates', 'attendance', 'contractorCPI'],
  },
  QA: {
    label: 'QA Inspector Dashboard',
    widgets: ['tcPipeline', 'inspectionChecklists', 'witnessTests', 'snagList'],
  },
  VENDOR: {
    label: 'Vendor Dashboard',
    widgets: ['deliveryConfirmations'],
  },
  SYSTEM_ADMIN: {
    label: 'System Admin Dashboard',
    widgets: ['userManagement', 'roleManagement', 'workflowConfig', 'systemSettings'],
  },
  AUDITOR: {
    label: 'Auditor Dashboard',
    widgets: ['auditLogViewer', 'complianceExport'],
  },
};
