import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchStations } from "../services/transit";

export default function JourneysPage() {
  // User input
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  // Selected station IDs
  const [selectedFromId, setSelectedFromId] = useState("");
  const [selectedToId, setSelectedToId] = useState("");

  // Validation state
  const [validationMessage, setValidationMessage] = useState("");
  const [isValid, setIsValid] = useState(false);

  // Search starting stations
  const fromStations = useQuery({
    queryKey: ["stations", from],
    queryFn: ({ signal }) => fetchStations(from, "", signal),
    enabled: from.trim().length >= 2 && !selectedFromId,
    staleTime: 300000,
  });

  // Search destination stations
  const toStations = useQuery({
    queryKey: ["stations", to],
    queryFn: ({ signal }) => fetchStations(to, "", signal),
    enabled: to.trim().length >= 2 && !selectedToId,
    staleTime: 300000,
  });

  // Clear validation and previous trip result
  const clearValidation = () => {
    setValidationMessage("");
    setIsValid(false);
  };

  // Swap starting and destination stations
  const handleSwap = () => {
    setFrom(to);
    setTo(from);

    setSelectedFromId(selectedToId);
    setSelectedToId(selectedFromId);

    clearValidation();
  };

  // Clear both station selections
  const handleClear = () => {
    setFrom("");
    setTo("");

    setSelectedFromId("");
    setSelectedToId("");

    clearValidation();
  };

  // Validate selected stations
  const handleFindRoute = () => {
    setIsValid(false);

    if (!selectedFromId) {
      setValidationMessage("Please select a starting station.");
      return;
    }

    if (!selectedToId) {
      setValidationMessage("Please select a destination station.");
      return;
    }

    if (selectedFromId === selectedToId) {
      setValidationMessage(
        "Starting and destination stations must be different.",
      );
      return;
    }

    // Validation successful
    setIsValid(true);
    setValidationMessage("Stations selected successfully.");
  };

  return (
    <div className="p-6">
      {/* Page Title */}
      <h1 className="text-3xl font-bold">Plan a Trip</h1>

      <p className="mt-2 text-gray-600">
        Find the best subway route for your journey.
      </p>

      <div className="mt-6 space-y-4">
        {/* From - Starting Station */}
        <div>
          <label htmlFor="from" className="block font-medium">
            From
          </label>

          <input
            id="from"
            type="text"
            value={from}
            onChange={(e) => {
              setFrom(e.target.value);
              setSelectedFromId("");
              clearValidation();
            }}
            placeholder="Enter starting station"
            autoComplete="off"
            className="mt-2 w-full rounded-lg border border-gray-300 p-3"
          />

          {/* From Loading */}
          {from.trim().length >= 2 &&
            !selectedFromId &&
            fromStations.isFetching && (
              <p className="mt-2 text-sm text-gray-500">
                Searching stations...
              </p>
            )}

          {/* From Error */}
          {from.trim().length >= 2 &&
            !selectedFromId &&
            fromStations.isError && (
              <p role="alert" className="mt-2 text-sm text-red-600">
                Unable to load stations.
              </p>
            )}

          {/* From Search Results */}
          {from.trim().length >= 2 &&
            !selectedFromId &&
            !fromStations.isFetching &&
            fromStations.data && (
              <div className="mt-2 overflow-hidden rounded-lg border bg-white">
                {fromStations.data.data.length === 0 && (
                  <p className="p-3 text-sm text-gray-500">
                    No stations found.
                  </p>
                )}

                {fromStations.data.data.slice(0, 5).map((station) => (
                  <button
                    key={station.id}
                    type="button"
                    onClick={() => {
                      setFrom(station.name);
                      setSelectedFromId(station.id);
                      clearValidation();
                    }}
                    className="block w-full border-b p-3 text-left hover:bg-gray-100"
                  >
                    <span className="font-medium">{station.name}</span>

                    <span className="ml-2 text-sm text-gray-500">
                      {station.routeIds.join(", ")}
                    </span>
                  </button>
                ))}
              </div>
            )}
        </div>

        {/* Swap and Clear Buttons */}
        <div className="flex justify-center gap-4">
          <button
            type="button"
            onClick={handleSwap}
            className="rounded-lg bg-purple-700 px-6 py-2 font-medium text-white hover:bg-purple-800"
          >
            ⇅ Swap Stations
          </button>

          <button
            type="button"
            onClick={handleClear}
            className="rounded-lg border border-gray-300 bg-white px-6 py-2 font-medium text-gray-700 hover:bg-gray-100"
          >
            Clear
          </button>
        </div>

        {/* To - Destination Station */}
        <div>
          <label htmlFor="to" className="block font-medium">
            To
          </label>

          <input
            id="to"
            type="text"
            value={to}
            onChange={(e) => {
              setTo(e.target.value);
              setSelectedToId("");
              clearValidation();
            }}
            placeholder="Enter destination station"
            autoComplete="off"
            className="mt-2 w-full rounded-lg border border-gray-300 p-3"
          />

          {/* To Loading */}
          {to.trim().length >= 2 && !selectedToId && toStations.isFetching && (
            <p className="mt-2 text-sm text-gray-500">Searching stations...</p>
          )}

          {/* To Error */}
          {to.trim().length >= 2 && !selectedToId && toStations.isError && (
            <p role="alert" className="mt-2 text-sm text-red-600">
              Unable to load stations.
            </p>
          )}

          {/* To Search Results */}
          {to.trim().length >= 2 &&
            !selectedToId &&
            !toStations.isFetching &&
            toStations.data && (
              <div className="mt-2 overflow-hidden rounded-lg border bg-white">
                {toStations.data.data.length === 0 && (
                  <p className="p-3 text-sm text-gray-500">
                    No stations found.
                  </p>
                )}

                {toStations.data.data.slice(0, 5).map((station) => (
                  <button
                    key={station.id}
                    type="button"
                    onClick={() => {
                      setTo(station.name);
                      setSelectedToId(station.id);
                      clearValidation();
                    }}
                    className="block w-full border-b p-3 text-left hover:bg-gray-100"
                  >
                    <span className="font-medium">{station.name}</span>

                    <span className="ml-2 text-sm text-gray-500">
                      {station.routeIds.join(", ")}
                    </span>
                  </button>
                ))}
              </div>
            )}
        </div>

        {/* Find Route Button */}
        <div className="mt-6">
          <button
            type="button"
            onClick={handleFindRoute}
            className="w-full rounded-lg bg-purple-700 px-6 py-3 font-medium text-white hover:bg-purple-800"
          >
            Find Route
          </button>

          {/* Validation Message */}
          {validationMessage && (
            <p
              role="status"
              className={`mt-3 rounded-lg p-3 text-center text-sm ${
                isValid
                  ? "bg-green-50 text-green-700"
                  : "bg-red-50 text-red-700"
              }`}
            >
              {validationMessage}
            </p>
          )}
        </div>

        {/* Trip Summary */}
        {isValid && (
          <div className="mt-6 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-bold text-gray-900">Your Trip</h2>

            <div className="mt-4 space-y-4">
              {/* Starting Station */}
              <div>
                <p className="text-sm font-medium text-gray-500">
                  Starting Station
                </p>

                <p className="mt-1 text-lg font-semibold">{from}</p>
              </div>

              {/* Route Placeholder */}
              <div className="border-l-2 border-purple-500 pl-4 text-sm text-gray-500">
                Route details will appear here.
              </div>

              {/* Destination Station */}
              <div>
                <p className="text-sm font-medium text-gray-500">
                  Destination Station
                </p>

                <p className="mt-1 text-lg font-semibold">{to}</p>
              </div>
            </div>

            <p className="mt-5 text-sm text-gray-500">
              Route calculation is not available yet.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
