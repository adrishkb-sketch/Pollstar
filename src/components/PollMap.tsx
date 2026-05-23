'use client';

import { useEffect, useRef } from 'react';
import 'leaflet/dist/leaflet.css';

interface VoteLocation {
  ipAddress: string;
  isp?: string;
  lat: number;
  lon: number;
  city?: string;
  country?: string;
  flaggedSuspicious: boolean;
}

interface PollMapProps {
  locations: VoteLocation[];
}

export default function PollMap({ locations }: PollMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<any>(null);
  const markersGroup = useRef<any>(null);

  useEffect(() => {
    // Dynamically load Leaflet on client-side only to prevent Next.js SSR crashes
    const initLeafletMap = async () => {
      if (!mapRef.current) return;

      const L = (await import('leaflet')).default;

      // Fix default marker icon issues in Leaflet
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.3.1/images/marker-icon-2x.png',
        iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.3.1/images/marker-icon.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.3.1/images/marker-shadow.png',
      });

      // Initialize map instance if not already initialized
      if (!mapInstance.current) {
        // Create dark matter carto map
        mapInstance.current = L.map(mapRef.current, {
          center: [20, 0],
          zoom: 2,
          minZoom: 1.5,
          zoomControl: true,
          attributionControl: false,
        });

        L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
          maxZoom: 20,
        }).addTo(mapInstance.current);

        markersGroup.current = L.featureGroup().addTo(mapInstance.current);
      }

      // Clear existing markers
      if (markersGroup.current) {
        markersGroup.current.clearLayers();
      }

      // Add custom glowing pulsing markers for each location
      const validLocations = locations.filter((loc) => loc.lat !== 0 && loc.lon !== 0);

      validLocations.forEach((loc) => {
        const markerColor = loc.flaggedSuspicious ? '#ef4444' : '#6366f1';
        
        // Dynamic pulsing neon dot Icon
        const pulsingIcon = L.divIcon({
          className: 'custom-pulsing-icon',
          html: `
            <div style="position: relative; width: 14px; height: 14px;">
              <div style="
                position: absolute; 
                width: 14px; 
                height: 14px; 
                border-radius: 50%; 
                background-color: ${markerColor}; 
                border: 2px solid #fff;
                box-shadow: 0 0 8px ${markerColor};
                z-index: 2;
              "></div>
              <div style="
                position: absolute;
                width: 32px;
                height: 32px;
                left: -9px;
                top: -9px;
                border-radius: 50%;
                background-color: ${markerColor};
                opacity: 0.35;
                animation: pulse-ring 1.5s cubic-bezier(0.215, 0.610, 0.355, 1) infinite;
                z-index: 1;
              "></div>
            </div>
          `,
          iconSize: [14, 14],
          iconAnchor: [7, 7],
        });

        // Add to map
        const marker = L.marker([loc.lat, loc.lon], { icon: pulsingIcon });
        
        const popupContent = `
          <div style="
            background: #0b0f19;
            color: #fff;
            padding: 8px 12px;
            font-family: 'Inter', sans-serif;
            border-radius: 12px;
            font-size: 11px;
            line-height: 1.4;
          ">
            <strong style="color: #818cf8; font-size: 12px; display: block; margin-bottom: 4px;">
              ${loc.city || 'Private location'}, ${loc.country || 'Global'}
            </strong>
            <strong>IP:</strong> ${loc.ipAddress}<br/>
            <strong>ISP:</strong> ${loc.isp || 'Local provider'}<br/>
            ${loc.flaggedSuspicious ? '<strong style="color:#ef4444;">⚠️ FLAGGED SUSPICIOUS</strong>' : '<span style="color:#10b981;">✓ Secure cast</span>'}
          </div>
        `;

        marker.bindPopup(popupContent, {
          closeButton: false,
          className: 'custom-leaflet-popup'
        });

        if (markersGroup.current) {
          markersGroup.current.addLayer(marker);
        }
      });

      // Fit map bounds to encompass all active coordinates beautifully
      if (validLocations.length > 0 && mapInstance.current && markersGroup.current) {
        try {
          mapInstance.current.fitBounds(markersGroup.current.getBounds(), {
            padding: [40, 40],
            maxZoom: 6,
          });
        } catch (e) {
          // Fallback if bounds fit fails
        }
      }
    };

    initLeafletMap();

    // Clean up map instance when component unmounts
    return () => {
      // In development HMR (Hot Module Replacement), let's keep the map stable or let it dispose cleanly
    };
  }, [locations]);

  return (
    <div className="relative w-full h-[320px] rounded-2xl overflow-hidden border border-white/5 shadow-inner">
      <div ref={mapRef} className="w-full h-full z-10" />

      {/* Pulsing ring animation in SVG / CSS */}
      <style jsx global>{`
        @keyframes pulse-ring {
          0% { transform: scale(0.33); opacity: 0.8; }
          80%, 100% { transform: scale(1.3); opacity: 0; }
        }
        .leaflet-popup-content-wrapper {
          background: #0b0f19 !important;
          border: 1px solid rgba(255,255,255,0.08) !important;
          border-radius: 12px !important;
          padding: 0 !important;
          box-shadow: 0 10px 25px rgba(0,0,0,0.5) !important;
        }
        .leaflet-popup-tip {
          background: #0b0f19 !important;
          border: 1px solid rgba(255,255,255,0.08) !important;
        }
      `}</style>
    </div>
  );
}
