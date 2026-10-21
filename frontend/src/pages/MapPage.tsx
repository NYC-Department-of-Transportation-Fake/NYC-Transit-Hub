import { MapContainer, TileLayer } from "react-leaflet";
import "leaflet/dist/leaflet.css";

export default function MapPage() {
  return (
    <section>
      <h2 className="text-2xl font-bold">Subway Map</h2>

      <p className="mt-2 text-slate-600">Explore NYC subway stations.</p>

      <div className="mt-6 overflow-hidden rounded-xl border border-slate-200">
        <MapContainer
          center={[40.73, -73.99]}
          zoom={12}
          style={{ height: "500px", width: "100%" }}
          className="z-0"
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
        </MapContainer>
      </div>
    </section>
  );
}
