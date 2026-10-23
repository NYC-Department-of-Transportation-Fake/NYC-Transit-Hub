import type { FacilityStatus, ServiceAlert } from '../types/service';

// Fictional scenarios for UI development. These are not current MTA reports.
export const demoAlerts: ServiceAlert[] = [
  { id: 'demo-1', routes: ['A', 'C'], status: 'Delays', title: 'Longer waits on downtown trains', description: 'Demo scenario: downtown trains are running with delays while crews investigate a signal issue.', advice: 'Allow extra travel time and check station announcements before boarding.' },
  { id: 'demo-2', routes: ['1', '2', '3'], status: 'Planned work', title: 'Overnight platform changes', description: 'Demo scenario: maintenance work changes the boarding platform at selected stations overnight.', advice: 'Follow posted signs for the correct platform.' },
  { id: 'demo-3', routes: ['N', 'Q'], status: 'Service change', title: 'Some trains use a different platform', description: 'Demo scenario: some trains are rerouted during track maintenance.', advice: 'Check the destination displayed on the train before boarding.' },
];

export const demoFacilities: FacilityStatus[] = [
  { id: 'demo-el-1', stationId: 'demo-times-square', stationName: 'Times Sq–42 St', routes: ['1', '2', '3', 'N', 'Q'], type: 'Elevator', location: 'Street to mezzanine', status: 'Out of service', note: 'Demo outage. An accessible alternative has not been verified.' },
  { id: 'demo-el-2', stationId: 'demo-grand-central', stationName: 'Grand Central–42 St', routes: ['4', '5', '6'], type: 'Elevator', location: 'Mezzanine to platform', status: 'Available', note: 'Demo availability for this individual facility; this does not confirm an accessible journey.' },
  { id: 'demo-es-1', stationId: 'demo-herald-square', stationName: '34 St–Herald Sq', routes: ['B', 'D', 'F', 'M', 'N', 'Q', 'R', 'W'], type: 'Escalator', location: 'Platform to mezzanine', status: 'Out of service', note: 'Demo maintenance. No restoration estimate is available.' },
  { id: 'demo-el-3', stationId: 'demo-fulton', stationName: 'Fulton St', routes: ['A', 'C', 'J', 'Z', '2', '3', '4', '5'], type: 'Elevator', location: 'Street to concourse', status: 'Available', note: 'Demo availability for this individual facility; check all facilities needed for your trip.' },
];
