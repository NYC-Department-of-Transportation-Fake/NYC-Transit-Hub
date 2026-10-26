"""Build the small static API snapshot from MTA's regular subway GTFS ZIP.

Usage: python scripts/prepare_transit_data.py path/to/gtfs_subway.zip
Python is only needed to refresh data, not to build or run the backend.
"""

import argparse
import csv
import hashlib
import io
import json
from datetime import datetime, timezone
from pathlib import Path
from zipfile import ZipFile

SOURCE_URL = "https://rrgtfsfeeds.s3.amazonaws.com/gtfs_subway.zip"


def rows(archive, name):
    with archive.open(name) as source:
        yield from csv.DictReader(io.TextIOWrapper(source, encoding="utf-8-sig", newline=""))


def unique_rows(archive, name, key):
    result = {}
    for item in rows(archive, name):
        identifier = item[key]
        if not identifier or identifier in result:
            raise ValueError(f"Missing or duplicate {key} in {name}: {identifier}")
        result[identifier] = item
    return result


def build_snapshot(archive):
    source_stops = unique_rows(archive, "stops.txt", "stop_id")
    source_routes = unique_rows(archive, "routes.txt", "route_id")
    trips = unique_rows(archive, "trips.txt", "trip_id")
    stations = {
        key: {
            "id": key, "name": item["stop_name"],
            "latitude": float(item["stop_lat"]), "longitude": float(item["stop_lon"]),
            "routeIds": set(), "stopIds": [],
        }
        for key, item in source_stops.items() if item.get("location_type") == "1"
    }
    stops = {}
    for key, item in source_stops.items():
        if item.get("location_type", "") not in ("", "0"):
            continue
        parent = item.get("parent_station")
        if parent not in stations:
            raise ValueError(f"Stop {key} has unknown parent station {parent}")
        # GTFS parent relationships are authoritative; never merge by station name.
        stops[key] = {"id": key, "stationId": parent, "directionLabel": None}
        stations[parent]["stopIds"].append(key)

    for trip in trips.values():
        if trip["route_id"] not in source_routes:
            raise ValueError(f"Trip references unknown route {trip['route_id']}")
    for item in rows(archive, "stop_times.txt"):
        trip = trips[item["trip_id"]]
        stop = stops[item["stop_id"]]
        stations[stop["stationId"]]["routeIds"].add(trip["route_id"])
    if not stations or not stops or not source_routes:
        raise ValueError("Empty transit dataset")
    for station in stations.values():
        station["routeIds"] = sorted(station["routeIds"])
        station["stopIds"].sort()
    routes = [{
        "id": key, "shortName": item["route_short_name"], "longName": item["route_long_name"],
        "color": item.get("route_color") or "FFFFFF",
        "textColor": item.get("route_text_color") or "000000",
    } for key, item in sorted(source_routes.items())]
    return {
        "stations": [stations[key] for key in sorted(stations)],
        "stops": [stops[key] for key in sorted(stops)],
        "routes": routes,
    }


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("zip_path", type=Path)
    args = parser.parse_args()
    with ZipFile(args.zip_path) as archive:
        snapshot = build_snapshot(archive)
        feed_info = list(rows(archive, "feed_info.txt")) if "feed_info.txt" in archive.namelist() else []
    output = Path(__file__).resolve().parents[1] / "src/main/resources/data"
    output.mkdir(parents=True, exist_ok=True)
    (output / "transit.json").write_text(json.dumps(snapshot, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    provenance = {
        "sourceUrl": SOURCE_URL,
        "preparedAt": datetime.now(timezone.utc).isoformat(),
        "sourceSha256": hashlib.sha256(args.zip_path.read_bytes()).hexdigest(),
        "feedInfo": feed_info,
        "note": "Regular scheduled service coverage; not current service, trip order or arrival predictions.",
    }
    (output / "transit-source.json").write_text(json.dumps(provenance, indent=2) + "\n", encoding="utf-8")
    print(f"Prepared {len(snapshot['stations'])} stations, {len(snapshot['stops'])} stops, {len(snapshot['routes'])} routes")


if __name__ == "__main__":
    main()
