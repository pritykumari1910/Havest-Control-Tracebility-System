export const DashboardUserRole = {
  SYSTEM_ADMINISTRATOR: 'System Administrator',
  FARM_MANAGER: 'Farm Manager',
  OPERATIONS_DIRECTOR: 'Operations Director',
} as const;

export type DashboardUserRole = (typeof DashboardUserRole)[keyof typeof DashboardUserRole];

export type SystemAdministratorDashboardSummary = {
  activeFarmsCount: number;
  workersCount: number;
  varietiesCount: number;
  campaignsCount: number;
  crewsCount: number;
  palletBinsCount: number;
  dispatchNotesCount: number;
  qrSeriesCount: number;
};

export type FarmManagerCrewItem = {
  id: string;
  crewCode: string;
  crewName: string;
  status: string;
  pickersCount: number;
  assignmentsCount: number;
};

export type FarmManagerDashboardSummary = {
  activeCrewsCount: number;
  pickersCount: number;
  palletsReceivedCount: number;
  openAssignmentsCount: number;
  yourCrews: FarmManagerCrewItem[];
  satelliteStaffRegisteredTodayCount: number;
};

export type OperationsDirectorDashboardSummary = {
  currentCampaign: {
    id: string;
    campaignName: string;
    campaignCode: string;
    status: string;
  } | null;
  todaysHarvest: {
    weightKg: number;
    binsToday: number;
  };
  forecastAchievement: {
    actualTonnes: number;
    forecastTonnes: number;
    percentage: number;
  };
  actualProduction: {
    totalTonnes: number;
    totalBinsCount: number;
  };
  estimatedProduction: {
    approvedForecastTonnes: number;
  };
  totalFarms: {
    activeFarmsCount: number;
  };
  activeCrews: {
    activeCrewsCount: number;
  };
  activePickers: {
    activePickersCount: number;
  };
  satelliteStaff: {
    todaysShiftCount: number;
  };
  satelliteRatio: {
    ratioString: string;
    supportPickersCount: number;
  };
  collectionPoints: {
    openBatchesCount: number;
  };
  openDispatchNotes: {
    activeLoadOrdersCount: number;
  };
  completedDispatches: {
    totalCompleted: number;
    completedToday: number;
  };
  vehiclesWaiting: {
    awaitingLoadCount: number;
  };
  operationalIncidents: {
    palletIncidentsLoggedCount: number;
  };
};

export type DashboardSummary =
  | SystemAdministratorDashboardSummary
  | FarmManagerDashboardSummary
  | OperationsDirectorDashboardSummary;

