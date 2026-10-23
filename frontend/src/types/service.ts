export type ServiceAlert = {
  id: string;
  routes: string[];
  status: string;
  title: string;
  description: string;
  advice: string;
  period?: string;
  upcoming?: boolean;
};

export type FacilityStatus = {
  id: string;
  stationId: string;
  stationName: string;
  routes: string[];
  type: 'Elevator' | 'Escalator' | 'Other facility';
  location: string;
  status: 'Available' | 'Out of service' | 'No reported outage' | 'Planned outage' | 'Unknown';
  note: string;
  alternative?: string;
  outageStart?: string;
  estimatedReturn?: string;
  ada?: string;
};
