export interface RoleChangePayload {
  workDate: string;
  exitContext: 'crew' | 'satellite';
  exitEntityId: string;
  entryContext: 'crew' | 'satellite';
  entryEntityId: string;
  farmId?: string;
  plotId?: string | null;
  valveId?: string | null;
  workZone?: string;
  reason: string;
  changeTime?: string;
}
