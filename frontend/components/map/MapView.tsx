'use client'

import { useRef, useCallback, useState } from 'react'
import Map, { Marker, Source, Layer, NavigationControl, type MapRef } from 'react-map-gl/maplibre'
import 'maplibre-gl/dist/maplibre-gl.css'
import { useAppStore } from '@/lib/store'
import { getInitials } from '@/lib/utils'
import type { PresenceUpdate } from '@/types'

// Free CartoDB dark matter tile style — no API key required
const MAP_STYLE = 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json'

function calcDist(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const dLat = (lat2 - lat1) * 111320
  const dLng = (lng2 - lng1) * 111320 * Math.cos(lat1 * (Math.PI / 180))
  return Math.sqrt(dLat * dLat + dLng * dLng)
}

function formatDist(meters: number): string {
  if (meters < 1000) return `${Math.round(meters)}m`
  return `${(meters / 1000).toFixed(1)}km`
}

interface MapViewProps {
  onUserClick?: (user: PresenceUpdate) => void
}

export function MapView({ onUserClick }: MapViewProps) {
  const mapRef = useRef<MapRef>(null)
  const { latitude, longitude, nearbyUsers, user, speaking, heading, speed } = useAppStore()
  const [hasPanned, setHasPanned] = useState(false)

  const myLat = latitude || 51.505
  const myLng = longitude || -0.09

  const proximityRadiusGeoJson = {
    type: 'Feature' as const,
    geometry: {
      type: 'Point' as const,
      coordinates: [myLng, myLat],
    },
    properties: {},
  }

  const handleMoveEnd = useCallback(() => {
    const map = mapRef.current
    if (!map) return
    const center = map.getCenter()
    const dist = calcDist(myLat, myLng, center.lat, center.lng)
    setHasPanned(dist > 50)
  }, [myLat, myLng])

  function recenter() {
    mapRef.current?.flyTo({ center: [myLng, myLat], zoom: 15, duration: 800 })
    setHasPanned(false)
  }

  return (
    <Map
      ref={mapRef}
      initialViewState={{ longitude: myLng, latitude: myLat, zoom: 15 }}
      mapStyle={MAP_STYLE}
      style={{ width: '100%', height: '100%' }}
      attributionControl={false}
      onMoveEnd={handleMoveEnd}
    >
      {/* Compass */}
      <NavigationControl position="bottom-right" showZoom={false} />

      {/* Proximity radius circle */}
      <Source
        id="proximity-radius"
        type="geojson"
        data={proximityRadiusGeoJson}
      >
        <Layer
          id="proximity-fill"
          type="circle"
          paint={{
            'circle-radius': [
              'interpolate',
              ['exponential', 2],
              ['zoom'],
              10,
              80,
              14,
              200,
              16,
              400,
            ],
            'circle-color': 'rgba(0, 255, 135, 0.06)',
            'circle-stroke-color': 'rgba(0, 255, 135, 0.3)',
            'circle-stroke-width': 1.5,
          }}
        />
      </Source>

      {/* Self marker */}
      <Marker longitude={myLng} latitude={myLat} anchor="center">
        <div className="relative flex items-center justify-center">
          {/* Pulse ring */}
          <div className="absolute w-12 h-12 rounded-full border-2 border-primary/40 animate-ping" />
          {/* Direction cone + avatar — rotates with heading when moving */}
          <div
            className="relative flex items-center justify-center"
            style={speed > 0 ? { transform: `rotate(${heading}deg)` } : undefined}
          >
            {speed > 0 && (
              <div
                className="absolute"
                style={{
                  top: '-16px',
                  width: 0,
                  height: 0,
                  borderLeft: '5px solid transparent',
                  borderRight: '5px solid transparent',
                  borderBottom: '12px solid rgba(124, 111, 255, 0.85)',
                }}
              />
            )}
            <div className="relative w-10 h-10 rounded-full bg-primary flex items-center justify-center shadow-neon text-white text-sm font-bold z-10">
              {user ? getInitials(user.displayName) : 'ME'}
            </div>
          </div>
          {/* You label */}
          <div className="absolute -bottom-5 text-[10px] text-primary font-semibold whitespace-nowrap">
            You
          </div>
        </div>
      </Marker>

      {/* Nearby user markers */}
      {nearbyUsers.map((u) => (
        <Marker
          key={u.userId}
          longitude={u.longitude}
          latitude={u.latitude}
          anchor="center"
          onClick={() => onUserClick?.(u)}
        >
          <UserMarker
            user={u}
            isSpeaking={speaking[u.userId] ?? false}
            distance={calcDist(myLat, myLng, u.latitude, u.longitude)}
          />
        </Marker>
      ))}

    </Map>
  )
}

function UserMarker({
  user,
  isSpeaking,
  distance,
}: {
  user: PresenceUpdate
  isSpeaking: boolean
  distance: number
}) {
  const isConvoy = user.mode === 'convoy'
  const color = isConvoy ? '#4488FF' : '#00FF87'
  const initials = user.userId.slice(0, 2).toUpperCase()

  return (
    <div
      className="relative flex flex-col items-center cursor-pointer select-none"
      style={{ filter: isSpeaking ? `drop-shadow(0 0 8px ${color})` : undefined }}
    >
      {/* Speaking indicator */}
      {isSpeaking && (
        <div className="absolute -top-5 flex items-end gap-[2px] h-4">
          <span className="speaking-bar h-2" style={{ background: color }} />
          <span className="speaking-bar h-3" style={{ background: color }} />
          <span className="speaking-bar h-2" style={{ background: color }} />
        </div>
      )}

      {/* Direction arrow + avatar — rotates with heading when moving */}
      <div
        className="relative flex items-center justify-center"
        style={user.speed > 0 ? { transform: `rotate(${user.heading}deg)` } : undefined}
      >
        {user.speed > 0 && (
          <div
            className="absolute"
            style={{
              top: '-13px',
              width: 0,
              height: 0,
              borderLeft: '4px solid transparent',
              borderRight: '4px solid transparent',
              borderBottom: `10px solid ${color}CC`,
            }}
          />
        )}
        <div
          className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-background shadow-md border-2 transition-all duration-200"
          style={{
            background: color,
            borderColor: isSpeaking ? color : 'rgba(255,255,255,0.15)',
            boxShadow: isSpeaking ? `0 0 16px ${color}88` : undefined,
          }}
        >
          {initials}
        </div>
      </div>

      {/* Distance label */}
      <div
        className="absolute -bottom-5 text-[9px] font-semibold px-1 py-0.5 rounded whitespace-nowrap"
        style={{ color, background: 'rgba(8,8,16,0.7)' }}
      >
        {formatDist(distance)}
      </div>
    </div>
  )
}
