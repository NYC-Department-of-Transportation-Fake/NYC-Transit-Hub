import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseAlerts, parseFacilities } from '../src/services/mta.ts';

test('alerts retain current/future periods, exclude expired records, and use plain English', () => {
  const entity = (id: string, start: number, end?: number) => ({ id, alert: {
    active_period: [{ start, end }], informed_entity: [{ route_id: 'A' }, { route_id: 'A' }],
    header_text: { translation: [{ language: 'en-html', text: '<b>HTML</b>' }, { language: 'en', text: 'Notice' }] },
  } });
  const result = parseAlerts({ header: { timestamp: 100 }, entity: [entity('future', 200), entity('expired', 1, 99), entity('current', 1, 101)] }, 100);
  assert.deepEqual(result.alerts.map(item => [item.id, item.upcoming]), [['current', false], ['future', true]]);
  assert.deepEqual(result.alerts[0].routes, ['A']);
  assert.equal(result.alerts[0].title, 'Notice');
  assert.equal(result.sourceUpdatedAt, 100000);
});

test('facilities join by equipment ID and distinguish upcoming, current and missing status', () => {
  const equipment = ['1', '2', '3', '4'].map(equipmentno => ({ equipmentno, station: 'Test', trainno: 'A/C', equipmenttype: 'EL', ADA: 'Y' }));
  const result = parseFacilities(equipment, [
    { equipment: '1', isupcomingoutage: 'Y' },
    { equipment: '2', isupcomingoutage: 'Y' },
    { equipment: '2', isupcomingoutage: 'N', reason: 'Repair' },
    { equipment: '4' },
  ]);
  assert.deepEqual(result.map(item => item.status), ['Planned outage', 'Out of service', 'No reported outage', 'Unknown']);
  assert.equal(result[1].note, 'Repair');
  assert.deepEqual(result[0].routes, ['A', 'C']);
});

test('unexpected payloads fail rather than implying normal service', () => {
  assert.throws(() => parseAlerts({}));
  assert.throws(() => parseFacilities([], []));
  assert.throws(() => parseFacilities([{ equipmentno: '1' }], [{ reason: 'missing identifier' }]));
});
