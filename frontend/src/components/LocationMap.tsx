'use client';

import { useEffect, useRef, useState } from 'react';

interface LocationMapProps {
    onLocationSelect: (lat: number, lng: number) => void;
    initialLat?: number;
    initialLng?: number;
}

export default function LocationMap({ onLocationSelect, initialLat = 28.6139, initialLng = 77.2090 }: LocationMapProps) {
    const mapContainerRef = useRef<HTMLDivElement>(null);
    const mapInstanceRef = useRef<any>(null);
    const markerRef = useRef<any>(null);
    const [scriptsLoaded, setScriptsLoaded] = useState(false);

    // Load Leaflet scripts dynamically
    useEffect(() => {
        if (window.L) {
            setScriptsLoaded(true);
            return;
        }

        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
        document.head.appendChild(link);

        const script = document.createElement('script');
        script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
        script.onload = () => setScriptsLoaded(true);
        document.body.appendChild(script);

        return () => {
            // Cleanup unnecessary
        };
    }, []);

    // Initialize Map
    useEffect(() => {
        if (!scriptsLoaded || !mapContainerRef.current || mapInstanceRef.current) return;

        const L = window.L;
        const map = L.map(mapContainerRef.current).setView([initialLat, initialLng], 13);

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors'
        }).addTo(map);

        mapInstanceRef.current = map;

        // Custom icon fix
        const icon = L.icon({
            iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
            shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
            iconSize: [25, 41],
            iconAnchor: [12, 41]
        });

        // Click handler
        map.on('click', (e: any) => {
            const { lat, lng } = e.latlng;

            if (markerRef.current) {
                markerRef.current.setLatLng([lat, lng]);
            } else {
                markerRef.current = L.marker([lat, lng], { icon }).addTo(map);
            }

            onLocationSelect(lat, lng);
        });

    }, [scriptsLoaded, initialLat, initialLng, onLocationSelect]);

    return (
        <div className="w-full h-full min-h-[300px] rounded-lg border border-gray-300 overflow-hidden relative">
            {!scriptsLoaded && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-100 z-10">
                    Loading Map...
                </div>
            )}
            <div ref={mapContainerRef} className="w-full h-full bg-gray-50" />

            <div className="absolute bottom-2 left-2 bg-white px-2 py-1 text-xs rounded shadow z-[1000] pointer-events-none">
                Click map to pin location
            </div>
        </div>
    );
}

// Add global type for Leaflet
declare global {
    interface Window {
        L: any;
    }
}
