import io
import unittest
from zipfile import ZipFile

from prepare_transit_data import build_snapshot


class SnapshotTests(unittest.TestCase):
    def archive(self, parent="S1"):
        buffer = io.BytesIO()
        with ZipFile(buffer, "w") as z:
            z.writestr("stops.txt", "stop_id,stop_name,stop_lat,stop_lon,location_type,parent_station\n"
                       'S1,"Central, West",40.7,-73.9,1,\n'
                       'S2,"Central, West",40.8,-73.8,1,\n'
                       f"S1N,Boarding,40.7,-73.9,0,{parent}\n"
                       "S2N,Boarding,40.8,-73.8,0,S2\n")
            z.writestr("routes.txt", "route_id,route_short_name,route_long_name,route_color,route_text_color\n"
                       'A,A,"Avenue, Express",0039A6,FFFFFF\nB,B,Local,,\n')
            z.writestr("trips.txt", "trip_id,route_id\nT1,A\nT2,B\n")
            z.writestr("stop_times.txt", "trip_id,stop_id\nT1,S1N\nT1,S1N\nT2,S2N\n")
        buffer.seek(0)
        return ZipFile(buffer)

    def test_joins_trip_routes_to_parent_stations_without_merging_names(self):
        with self.archive() as z:
            result = build_snapshot(z)
        first, second = result["stations"]
        self.assertEqual(first["name"], "Central, West")
        self.assertEqual(first["routeIds"], ["A"])
        self.assertEqual(second["routeIds"], ["B"])
        self.assertNotEqual(first["id"], second["id"])
        self.assertEqual(first["stopIds"], ["S1N"])
        self.assertIsNone(result["stops"][0]["directionLabel"])
        self.assertEqual(result["routes"][0]["longName"], "Avenue, Express")
        self.assertEqual(result["routes"][1]["color"], "FFFFFF")

    def test_rejects_unknown_parent(self):
        with self.archive(parent="MISSING") as z:
            with self.assertRaises(ValueError):
                build_snapshot(z)


if __name__ == "__main__":
    unittest.main()
