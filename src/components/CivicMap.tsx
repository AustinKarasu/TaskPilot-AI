/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from "react";
import { Issue, IssueSeverity, IssueStatus } from "../types";
import { Layers, ZoomIn, ZoomOut, Maximize, AlertCircle, Flame, Search, Navigation } from "lucide-react";
import L from "leaflet";

interface CivicMapProps {
  issues: Issue[];
  selectedIssueId?: string;
  onSelectIssue: (id: string) => void;
  onMapClickReport?: (lat: number, lng: number) => void;
  centerCoordinates?: { lat: number; lng: number };
  theme?: "light" | "dark";
}

interface LocationSuggestion {
  id: string;
  label: string;
  detail: string;
  lat: number;
  lng: number;
  source: "local" | "issue" | "search";
  issueId?: string;
}

const LOCAL_SPOTS: Array<{ keywords: string[]; label: string; detail: string; lat: number; lng: number }> = [
  { keywords: ["nanaon", "palampur", "kangra", "hq"], label: "Nanaon, Palampur", detail: "Kangra district command area", lat: 32.1109, lng: 76.5363 },
  { keywords: ["st. xavier", "school", "xavier road", "kolkata", "rajesh"], label: "St. Xavier Primary School", detail: "Xavier Road, Kolkata", lat: 22.5697, lng: 88.3639 },
  { keywords: ["market", "subji", "bowbazar", "market street", "ananya"], label: "Subji Bazaar Market Lane", detail: "Bowbazar, Kolkata", lat: 22.5726, lng: 88.3585 },
  { keywords: ["park", "central park", "salt lake", "sector v", "sector 5", "aisha"], label: "Central Park Sector V", detail: "Salt Lake, Kolkata", lat: 22.5732, lng: 88.4312 },
  { keywords: ["mg road", "clogged", "drainage crossing", "joydeep"], label: "MG Road Crossing", detail: "Kolkata drainage intersection", lat: 22.5802, lng: 88.3611 },
  { keywords: ["ae block", "alleyway", "community club", "meera"], label: "AE Block Alleyway", detail: "Salt Lake community club", lat: 22.5855, lng: 88.4109 },
  { keywords: ["ring road", "bypass", "science city", "amit"], label: "Science City Bypass", detail: "Kolkata ring road corridor", lat: 22.5451, lng: 88.3842 },
  { keywords: ["bengaluru", "bangalore", "silk board", "koramangala"], label: "Bengaluru City Center", detail: "Koramangala / MG Road command area", lat: 12.9716, lng: 77.5946 }
];

export default function CivicMap({
  issues,
  selectedIssueId,
  onSelectIssue,
  onMapClickReport,
  centerCoordinates,
  theme = "light"
}: CivicMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersGroupRef = useRef<L.LayerGroup | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [searchLocationQuery, setSearchLocationQuery] = useState("");
  const [searchSuggestions, setSearchSuggestions] = useState<LocationSuggestion[]>([]);
  const [showSearchSuggestions, setShowSearchSuggestions] = useState(false);
  const [isSearchingLoc, setIsSearchingLoc] = useState(false);
  const [locationStatus, setLocationStatus] = useState("");
  const [isLocating, setIsLocating] = useState(false);
  const currentLocationMarkerRef = useRef<L.Marker | null>(null);

  useEffect(() => {
    if (!locationStatus || isLocating) return;
    const timeout = setTimeout(() => setLocationStatus(""), 4500);
    return () => clearTimeout(timeout);
  }, [locationStatus, isLocating]);

  const buildLocalSuggestions = (query: string): LocationSuggestion[] => {
    const lowerQuery = query.toLowerCase().trim();
    if (!lowerQuery) return [];

    const spotSuggestions = LOCAL_SPOTS
      .filter(spot => {
        const searchable = `${spot.label} ${spot.detail} ${spot.keywords.join(" ")}`.toLowerCase();
        return searchable.includes(lowerQuery) || spot.keywords.some(keyword => lowerQuery.includes(keyword));
      })
      .map((spot): LocationSuggestion => ({
        id: `local-${spot.label}`,
        label: spot.label,
        detail: spot.detail,
        lat: spot.lat,
        lng: spot.lng,
        source: "local"
      }));

    const issueSuggestions = issues
      .filter(issue => {
        const searchable = `${issue.title} ${issue.address} ${issue.landmark || ""} ${issue.category} ${issue.subcategory || ""}`.toLowerCase();
        return searchable.includes(lowerQuery);
      })
      .slice(0, 10)
      .map((issue): LocationSuggestion => ({
        id: `issue-${issue.id}`,
        label: issue.title,
        detail: issue.landmark || issue.address,
        lat: issue.location.lat,
        lng: issue.location.lng,
        source: "issue",
        issueId: issue.id
      }));

    return [...spotSuggestions, ...issueSuggestions].slice(0, 10);
  };

  const fetchSearchSuggestions = async (query: string, signal?: AbortSignal) => {
    const local = buildLocalSuggestions(query);
    setSearchSuggestions(local);

    if (query.trim().length < 3 || local.length >= 10) {
      setIsSearchingLoc(false);
      return;
    }

    try {
      const response = await fetch(
        `/api/geocode/search?q=${encodeURIComponent(query)}&limit=${10 - local.length}`,
        { signal }
      );
      if (!response.ok) throw new Error(`Search returned ${response.status}`);
      const data = await response.json();
      const remoteData = Array.isArray(data?.results) ? data.results : [];
      const remote: LocationSuggestion[] = remoteData.map((item: any, index: number) => ({
        id: `search-${item.place_id || index}`,
        label: item.label || "Search result",
        detail: item.detail || "OpenStreetMap result",
        lat: parseFloat(item.lat),
        lng: parseFloat(item.lng),
        source: "search" as const
      })).filter(item => Number.isFinite(item.lat) && Number.isFinite(item.lng));

      setSearchSuggestions([...local, ...remote].slice(0, 10));
    } catch (err: any) {
      if (err?.name !== "AbortError") {
        console.error("Geocoding failed:", err);
      }
    } finally {
      setIsSearchingLoc(false);
    }
  };

  useEffect(() => {
    const query = searchLocationQuery.trim();
    if (!query) {
      setSearchSuggestions([]);
      setIsSearchingLoc(false);
      return;
    }

    setIsSearchingLoc(true);
    const controller = new AbortController();
    const debounce = setTimeout(() => {
      fetchSearchSuggestions(query, controller.signal);
    }, 250);

    return () => {
      clearTimeout(debounce);
      controller.abort();
    };
  }, [searchLocationQuery, issues]);

  const selectSearchSuggestion = (suggestion: LocationSuggestion) => {
    setSearchLocationQuery(suggestion.label);
    setShowSearchSuggestions(false);
    setSearchSuggestions([]);
    mapRef.current?.setView([suggestion.lat, suggestion.lng], suggestion.source === "issue" ? 16 : 15, { animate: true });
    if (suggestion.issueId) {
      onSelectIssue(suggestion.issueId);
    }
  };

  const handleSearchLocation = async () => {
    const query = searchLocationQuery.trim();
    if (!query) return;

    if (searchSuggestions.length > 0) {
      selectSearchSuggestion(searchSuggestions[0]);
      return;
    }

    setIsSearchingLoc(true);
    await fetchSearchSuggestions(query);
    setShowSearchSuggestions(true);
  };

  const renderCurrentLocation = (position: GeolocationPosition, zoom: number, status: string) => {
    const { latitude, longitude, accuracy } = position.coords;
    const map = mapRef.current;
    if (!map) return;

    map.setView([latitude, longitude], zoom, { animate: true });

    if (currentLocationMarkerRef.current) {
      map.removeLayer(currentLocationMarkerRef.current);
    }

    const pulseIcon = L.divIcon({
      html: `
        <div class="relative w-7 h-7 flex items-center justify-center">
          <div class="absolute h-7 w-7 rounded-full bg-cyan-500/35 animate-ping"></div>
          <div class="w-3.5 h-3.5 rounded-full bg-cyan-400 border-2 border-white shadow-md"></div>
        </div>
      `,
      className: "current-location-marker",
      iconSize: [28, 28],
      iconAnchor: [14, 14]
    });

    const newMarker = L.marker([latitude, longitude], { icon: pulseIcon })
      .bindPopup(`Current location${accuracy ? `, accurate to about ${Math.round(accuracy)}m` : ""}`, { closeButton: false })
      .addTo(map);
    currentLocationMarkerRef.current = newMarker;
    setLocationStatus(status);
  };

  const handleUseCurrentLocation = () => {
    if (!window.isSecureContext) {
      setLocationStatus("Live location requires HTTPS or localhost.");
      alert("Live location requires HTTPS or localhost.");
      return;
    }
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser.");
      return;
    }
    setIsLocating(true);
    setLocationStatus("Requesting browser location permission...");

    let settled = false;
    let fallbackStarted = false;
    let hardTimeout: number | undefined;

    const finish = (message?: string) => {
      settled = true;
      setIsLocating(false);
      if (message) setLocationStatus(message);
      if (hardTimeout) window.clearTimeout(hardTimeout);
    };

    const showGeoError = (error: GeolocationPositionError) => {
      console.warn("Map geolocation failed:", error.message);
      if (error.code === error.PERMISSION_DENIED) {
        finish("Location permission denied. Enable site location access in your browser.");
        return;
      }
      if (!fallbackStarted) {
        fallbackStarted = true;
        setLocationStatus("High accuracy timed out. Trying last known location...");
        navigator.geolocation.getCurrentPosition(
          (position) => {
            renderCurrentLocation(position, 14, "Approximate location loaded from browser cache.");
            finish();
          },
          (fallbackError) => {
            console.warn("Fallback geolocation failed:", fallbackError.message);
            finish("Location unavailable. Enable GPS/location permission or search a place.");
          },
          { enableHighAccuracy: false, timeout: 6000, maximumAge: 15 * 60 * 1000 }
        );
        return;
      }
      finish("Location unavailable. Enable GPS/location permission or search a place.");
    };

    hardTimeout = window.setTimeout(() => {
      if (!settled) {
        finish("Location request timed out. Check browser permission and GPS settings.");
      }
    }, 16000);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        renderCurrentLocation(position, 17, "Live location locked.");
        finish();
      },
      showGeoError,
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  // Redraw Heatmap Overlay
  const redrawHeatmap = () => {
    const canvas = canvasRef.current;
    const map = mapRef.current;
    if (!canvas || !map) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const size = map.getSize();
    if (canvas.width !== size.x || canvas.height !== size.y) {
      canvas.width = size.x;
      canvas.height = size.y;
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    issues.forEach((item) => {
      if (item.status === IssueStatus.REJECTED) return;
      if (!item.location || item.location.lat === undefined) return;
      
      try {
        const point = map.latLngToContainerPoint([item.location.lat, item.location.lng]);

        let radius = 40;
        let color = "255, 99, 132"; // default red
        
        if (item.severity === IssueSeverity.CRITICAL) {
          radius = 65;
          color = "239, 93, 93"; // red
        } else if (item.severity === IssueSeverity.HIGH) {
          radius = 50;
          color = "245, 158, 11"; // orange
        } else if (item.status === IssueStatus.RESOLVED) {
          radius = 35;
          color = "34, 197, 94"; // success green
        } else {
          radius = 35;
          color = "33, 199, 232"; // blue/cyan
        }

        const grad = ctx.createRadialGradient(point.x, point.y, 2, point.x, point.y, radius);
        grad.addColorStop(0, `rgba(${color}, 0.55)`);
        grad.addColorStop(0.25, `rgba(${color}, 0.35)`);
        grad.addColorStop(1, `rgba(${color}, 0)`);

        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(point.x, point.y, radius, 0, Math.PI * 2);
        ctx.fill();
      } catch (err) {
        // Guard against projection failure
      }
    });
  };

  // Wire map movements to heatmap redraw
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !showHeatmap) return;

    redrawHeatmap();

    map.on("move", redrawHeatmap);
    map.on("zoom", redrawHeatmap);
    map.on("resize", redrawHeatmap);

    return () => {
      map.off("move", redrawHeatmap);
      map.off("zoom", redrawHeatmap);
      map.off("resize", redrawHeatmap);
    };
  }, [issues, showHeatmap]);

  // Initialize Map
  useEffect(() => {
    if (!mapContainer.current) return;

    // Default center at Bengaluru central Command (Koramangala/MG Road intersection area)
    const initialLat = centerCoordinates?.lat || 12.9716;
    const initialLng = centerCoordinates?.lng || 77.5946;

    const map = L.map(mapContainer.current, {
      zoomControl: false,
      attributionControl: false,
      scrollWheelZoom: true
    }).setView([initialLat, initialLng], 12);

    mapRef.current = map;

    // Load initial tile layer based on current theme state
    const isDarkMode = theme === "dark" || document.documentElement.classList.contains("dark");
    const tileUrl = isDarkMode
      ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
      : "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png";

    const tiles = L.tileLayer(tileUrl, {
      maxZoom: 19,
      attribution: "OpenStreetMap, CARTO"
    }).addTo(map);

    tileLayerRef.current = tiles;

    // Markers layer group
    const markers = L.layerGroup().addTo(map);
    markersGroupRef.current = markers;

    // On map click, let citizens preset a report pin coordinate location
    map.on("click", (e: L.LeafletMouseEvent) => {
      // Don't trigger if clicked on a marker directly
      if (onMapClickReport) {
        onMapClickReport(e.latlng.lat, e.latlng.lng);
      }
    });

    // Schedule an immediate size refresh to avoid grey cell load limits
    const t = setTimeout(() => {
      map.invalidateSize();
    }, 250);

    const handleResize = () => {
      map.invalidateSize();
    };
    window.addEventListener("resize", handleResize);

    // Cleanup map on unmount
    return () => {
      clearTimeout(t);
      window.removeEventListener("resize", handleResize);
      if (currentLocationMarkerRef.current) {
        map.removeLayer(currentLocationMarkerRef.current);
        currentLocationMarkerRef.current = null;
      }
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Update map tile theme on switcher toggle
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // Remove previous tiles layer
    if (tileLayerRef.current) {
      map.removeLayer(tileLayerRef.current);
    }

    const tileUrl = theme === "dark"
      ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
      : "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png";

    const newTiles = L.tileLayer(tileUrl, {
      maxZoom: 19
    }).addTo(map);

    tileLayerRef.current = newTiles;
  }, [theme]);

  // Center view on coordinate updates dynamically
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !centerCoordinates) return;
    map.setView([centerCoordinates.lat, centerCoordinates.lng], 14, { animate: true });
    const t = setTimeout(() => {
      map.invalidateSize();
    }, 150);
    return () => clearTimeout(t);
  }, [centerCoordinates]);

  // Render Markers and Pins for current active filters list
  useEffect(() => {
    const map = mapRef.current;
    const markersGroup = markersGroupRef.current;
    if (!map || !markersGroup) return;

    // Clear old markers safely
    markersGroup.clearLayers();

    issues.forEach((item) => {
      // Exclude rejected tickets
      if (item.status === IssueStatus.REJECTED) return;

      const isSelected = selectedIssueId === item.id;

      // Map color matches category severity
      let markerColor = "#E2E8F0"; // Slate default
      let shadowColor = "rgba(100, 116, 139, 0.4)";
      let pulseEffect = false;

      if (item.severity === IssueSeverity.CRITICAL) {
        markerColor = "#EF5D5D"; // Red
        shadowColor = "rgba(239, 93, 93, 0.5)";
        pulseEffect = true;
      } else if (item.severity === IssueSeverity.HIGH) {
        markerColor = "#F59E0B"; // Orange
        shadowColor = "rgba(245, 158, 11, 0.4)";
      } else if (item.status === IssueStatus.RESOLVED) {
        markerColor = "#22C55E"; // Success Green
        shadowColor = "rgba(34, 197, 94, 0.3)";
      } else {
        markerColor = "#21C7E8"; // Light blue - new or verified
        shadowColor = "rgba(33, 199, 232, 0.4)";
      }

      const activePulseHtml = pulseEffect 
        ? `<div class="absolute h-8 w-8 rounded-full bg-red-500/25 animate-ping -top-1.5 -left-1.5"></div>` 
        : "";

      const activeBadgeStyle = isSelected
        ? "border-white scale-125 z-[999] ring-4 ring-cyan-400/50"
        : "border-slate-900";

      const miniId = item.id.replace("issue_", "");

      // Premium Div-based HTML marker to match Figma layouts
      const divHtml = `
        <div class="relative w-7 h-7 flex items-center justify-center transition-transform hover:scale-110">
          ${activePulseHtml}
          <div class="w-6 h-6 rounded-full flex items-center justify-center border-2 ${activeBadgeStyle} shadow-lg transition-all" style="background-color: ${markerColor};">
            <span class="text-[9px] font-mono font-bold text-white leading-none">${miniId}</span>
          </div>
          <!-- Pin pointer arrow tail -->
          <div class="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rotate-45 border-r border-b ${isSelected ? 'border-white bg-white' : 'border-slate-900'} " style="background-color: ${markerColor};"></div>
        </div>
      `;

      const customIcon = L.divIcon({
        html: divHtml,
        className: "custom-leaflet-marker",
        iconSize: [28, 28],
        iconAnchor: [14, 28] // anchors bottom center of the pin
      });

      const marker = L.marker([item.location.lat, item.location.lng], { icon: customIcon });

      // Clean responsive popup on click / hover
      const previewTitle = item.title.substring(0, 32) + (item.title.length > 32 ? "..." : "");
      const popupHtml = `
        <div class="leaflet-popup-custom-frame font-sans p-2 select-none" style="min-width: 170px;">
          <div class="flex items-center gap-1.5 mb-1">
            <span class="text-[8px] font-mono font-black uppercase text-white px-1 py-0.5 rounded" style="background-color: ${markerColor};">${item.severity}</span>
            <span class="text-[9px] text-slate-400 font-medium font-mono">${item.id}</span>
          </div>
          <h4 class="text-xs font-bold text-slate-800 m-0">${previewTitle}</h4>
          <p class="text-[10px] text-slate-500 m-0 mt-1">📍 ${item.landmark || item.address}</p>
        </div>
      `;

      marker.bindPopup(popupHtml, { closeButton: false, offset: L.point(0, -20) });

      marker.on("click", () => {
        onSelectIssue(item.id);
      });

      marker.addTo(markersGroup);
    });

  }, [issues, selectedIssueId]);

  return (
    <div className="relative w-full h-full bg-theme-main border border-theme-main rounded-2xl overflow-hidden shadow-theme-main transition-colors select-none">
      
      {/* Actual Map Container */}
      <div 
        ref={mapContainer} 
        className="w-full h-full z-0" 
        id="leaflet-map-root"
      />

      {/* Heatmap Canvas Overlay */}
      {showHeatmap && (
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full pointer-events-none z-[1]"
        />
      )}

      {/* Embedded Highlighting Badge, Zoom Controls, Geolocation, & Heatmap Toggle */}
      <div className="absolute top-4 left-4 z-[400] flex flex-col gap-2">
        <button
          type="button"
          onClick={() => mapRef.current?.zoomIn()}
          className="p-2 border border-theme-main bg-theme-secondary hover:bg-theme-tertiary text-theme-main rounded-xl shadow-lg transition-all cursor-pointer"
          title="Zoom In map viewport"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => mapRef.current?.zoomOut()}
          className="p-2 border border-theme-main bg-theme-secondary hover:bg-theme-tertiary text-theme-main rounded-xl shadow-lg transition-all cursor-pointer"
          title="Zoom Out map viewport"
        >
          <ZoomOut className="w-4 h-4" />
        </button>

        {/* Geolocation Fly-to Button */}
        <button
          type="button"
          onClick={handleUseCurrentLocation}
          disabled={isLocating}
          className={`p-2 border border-theme-main bg-theme-secondary hover:bg-theme-tertiary text-theme-main rounded-xl shadow-lg transition-all cursor-pointer flex items-center justify-center ${isLocating ? "animate-pulse border-cyan-550" : ""}`}
          title="Fly to Current Location"
        >
          <Navigation className={`w-4 h-4 text-cyan-400 ${isLocating ? "animate-spin" : ""}`} />
        </button>

        <button
          type="button"
          onClick={() => setShowHeatmap(!showHeatmap)}
          className={`p-2 border rounded-xl shadow-lg transition-all cursor-pointer flex items-center justify-center ${
            showHeatmap 
              ? "bg-red-500 border-red-650 text-white animate-pulse" 
              : "border-theme-main bg-theme-secondary hover:bg-theme-tertiary text-theme-main"
          }`}
          title="Toggle Heatmap View"
        >
          <Flame className="w-4 h-4" />
        </button>
      </div>

      <div className="absolute bottom-4 left-4 z-[400] bg-theme-secondary/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-theme-main text-[10px] font-mono text-theme-secondary flex items-center gap-1.5 shadow-sm">
        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
        <span>See It. Verify It. Solve It. Map Active</span>
        {showHeatmap && <span className="text-red-400 font-bold ml-1 uppercase">Heatmap Overlay Enabled</span>}
      </div>

      {/* Top Right Map Search Location Bar overlay */}
      <div className="absolute top-4 right-4 z-[400] flex items-center gap-1 bg-theme-secondary/95 backdrop-blur-md p-1.5 rounded-xl border border-theme-main shadow-lg pointer-events-auto">
        <div className="relative">
          <input
            type="text"
            value={searchLocationQuery}
            onChange={(e) => {
              setSearchLocationQuery(e.target.value);
              setShowSearchSuggestions(true);
            }}
            onFocus={() => setShowSearchSuggestions(true)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleSearchLocation();
              }
              if (e.key === "Escape") {
                setShowSearchSuggestions(false);
              }
            }}
            placeholder="Search map address..."
            className="bg-theme-tertiary border border-theme-main focus:outline-none focus:border-[#21D4FD]/65 rounded-lg text-[10px] px-2 py-1.5 text-theme-main w-48 sm:w-64 placeholder:text-slate-500 font-sans"
          />
          {showSearchSuggestions && searchLocationQuery.trim() && (
            <div className="absolute right-0 top-[calc(100%+6px)] w-72 max-w-[82vw] max-h-80 overflow-y-auto bg-theme-secondary border border-theme-main rounded-xl shadow-2xl p-1.5">
              {isSearchingLoc && searchSuggestions.length === 0 ? (
                <div className="px-3 py-2 text-[10px] font-mono text-theme-muted">Searching locations...</div>
              ) : searchSuggestions.length > 0 ? (
                searchSuggestions.slice(0, 10).map((suggestion) => (
                  <button
                    key={suggestion.id}
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => selectSearchSuggestion(suggestion)}
                    className="w-full text-left px-3 py-2 rounded-lg hover:bg-theme-tertiary transition flex flex-col gap-0.5 cursor-pointer"
                  >
                    <span className="text-[11px] font-bold text-theme-main line-clamp-1">{suggestion.label}</span>
                    <span className="text-[9px] text-theme-muted line-clamp-1">
                      {suggestion.source === "issue" ? "Issue" : suggestion.source === "local" ? "Saved place" : "Search"} - {suggestion.detail}
                    </span>
                  </button>
                ))
              ) : (
                <div className="px-3 py-2 text-[10px] font-mono text-theme-muted">No matches found.</div>
              )}
            </div>
          )}
        </div>
        <button
          type="button"
          onClick={handleSearchLocation}
          disabled={isSearchingLoc}
          className="p-1.5 bg-theme-tertiary hover:bg-theme-tertiary/80 text-cyan-400 rounded-lg border border-theme-main transition cursor-pointer flex items-center justify-center"
          title="Search address coordinates"
        >
          {isSearchingLoc ? (
            <span className="w-3 h-3 border border-cyan-500/20 border-t-cyan-400 rounded-full animate-spin"></span>
          ) : (
            <Search className="w-3.5 h-3.5" />
          )}
        </button>
      </div>

      {locationStatus && (
        <div className="absolute top-16 left-4 z-[400] bg-theme-secondary/95 border border-theme-main rounded-lg px-3 py-1.5 text-[10px] text-theme-secondary shadow-lg max-w-[220px]">
          {locationStatus}
        </div>
      )}

    </div>
  );
}
