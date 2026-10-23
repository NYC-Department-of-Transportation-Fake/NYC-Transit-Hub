import type { FacilityStatus, ServiceAlert } from '../types/service';

type Row = Record<string, unknown>;
const base = 'https://api-endpoint.mta.info/Dataservice/mtagtfsfeeds/';
export const MTA_URLS = {
  alerts: `${base}camsys%2Fsubway-alerts.json`,
  equipment: `${base}nyct%2Fnyct_ene_equipments.json`,
  outages: `${base}nyct%2Fnyct_ene.json`,
};
const row = (value: unknown): Row => value && typeof value === 'object' && !Array.isArray(value) ? value as Row : {};
const str = (value: unknown) => typeof value === 'string' ? value.trim() : '';
const list = (value: unknown): unknown[] => Array.isArray(value) ? value : [];
const routes = (value: unknown) => [...new Set(str(value).split(/[\s/,]+/).filter(Boolean))];
function text(value: unknown) {
  const translations = list(row(value).translation).map(row);
  return str(translations.find(item => item.language === 'en')?.text);
}
export function parseAlerts(payload: unknown, now = Date.now() / 1000) {
  const feed = row(payload);
  if (!Array.isArray(feed.entity) || typeof row(feed.header).timestamp !== 'number') throw new Error('Unexpected MTA alert response');
  const alerts: ServiceAlert[] = [];
  for (const value of feed.entity) {
    const entity = row(value), alert = row(entity.alert);
    if (!str(entity.id) || !text(alert.header_text)) continue;
    const periods = list(alert.active_period).map(row);
    if (periods.length && periods.every(period => typeof period.end === 'number' && period.end <= now)) continue;
    const current = !periods.length || periods.some(period =>
      (typeof period.start !== 'number' || period.start <= now) && (typeof period.end !== 'number' || period.end > now));
    const extra = row(alert['transit_realtime.mercury_alert']);
    alerts.push({
      id: str(entity.id), routes: [...new Set(list(alert.informed_entity).map(item => str(row(item).route_id)).filter(Boolean))],
      status: str(extra.alert_type) || str(alert.effect) || 'Service notice',
      title: text(alert.header_text), description: text(alert.description_text), advice: '',
      period: text(extra.human_readable_active_period), upcoming: !current,
    });
  }
  return { alerts: alerts.sort((a, b) => Number(a.upcoming) - Number(b.upcoming)), sourceUpdatedAt: Number(row(feed.header).timestamp) * 1000 };
}

export function parseFacilities(equipment: unknown, outages: unknown): FacilityStatus[] {
  if (!Array.isArray(equipment) || !equipment.length || !Array.isArray(outages)) throw new Error('Unexpected MTA facility response');
  const machines = equipment.map(row);
  if (machines.some(item => !str(item.equipmentno)) || outages.some(item => !str(row(item).equipment))) throw new Error('Missing MTA equipment identifiers');
  return machines.filter(item => item.isactive !== 'N').map(item => {
    const records = outages.map(row).filter(outage => outage.equipment === item.equipmentno);
    const current = records.find(outage => outage.isupcomingoutage === 'N');
    const upcoming = records.find(outage => outage.isupcomingoutage === 'Y');
    const unknown = records.some(outage => !['Y', 'N'].includes(str(outage.isupcomingoutage)));
    const outage = current ?? upcoming;
    return {
      id: str(item.equipmentno), stationId: str(item.elevatorsgtfsstopid), stationName: str(item.station) || 'Unknown station',
      routes: routes(item.trainno), type: item.equipmenttype === 'EL' ? 'Elevator' : item.equipmenttype === 'ES' ? 'Escalator' : 'Other facility',
      location: str(item.serving) || str(item.shortdescription),
      status: current ? 'Out of service' : unknown ? 'Unknown' : upcoming ? 'Planned outage' : 'No reported outage',
      note: str(outage?.reason), alternative: str(item.alternativeroute),
      outageStart: str(outage?.outagedate), estimatedReturn: str(outage?.estimatedreturntoservice),
      ada: item.ADA === 'Y' ? 'Yes' : item.ADA === 'N' ? 'No' : 'Unknown',
    };
  });
}

async function getJson(url: string, signal?: AbortSignal): Promise<unknown> {
  const response = await fetch(url, { signal: AbortSignal.any([...(signal ? [signal] : []), AbortSignal.timeout(20000)]) });
  if (!response.ok) throw new Error(`MTA request failed (${response.status})`);
  return response.json();
}
export async function fetchAlerts(signal?: AbortSignal) {
  const result = parseAlerts(await getJson(MTA_URLS.alerts, signal));
  return { ...result, fetchedAt: Date.now() };
}
export async function fetchFacilities(signal?: AbortSignal) {
  const [equipment, outages] = await Promise.all([getJson(MTA_URLS.equipment, signal), getJson(MTA_URLS.outages, signal)]);
  return { facilities: parseFacilities(equipment, outages), fetchedAt: Date.now() };
}
