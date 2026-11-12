"use client";

import { useState } from "react";

const STORES = [
  { name: "สาขาสยาม", lat: 13.7462, lng: 100.5347 },
  { name: "สาขาเชียงใหม่", lat: 18.7883, lng: 98.9853 },
  { name: "สาขาภูเก็ต", lat: 7.8804, lng: 98.3923 },
];

function distanceKm(aLat: number, aLng: number, bLat: number, bLng: number): number {
  const rad = (d: number) => (d * Math.PI) / 180;
  const h =
    Math.sin(rad(bLat - aLat) / 2) ** 2 +
    Math.cos(rad(aLat)) * Math.cos(rad(bLat)) * Math.sin(rad(bLng - aLng) / 2) ** 2;
  return 6371 * 2 * Math.asin(Math.sqrt(h));
}

export function StoresClient() {
  const [nearest, setNearest] = useState<string | null>(null);
  const [denied, setDenied] = useState(false);

  function findNearest() {
    setNearest(null);
    setDenied(false);
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        const best = STORES.reduce((a, b) =>
          distanceKm(coords.latitude, coords.longitude, b.lat, b.lng) <
          distanceKm(coords.latitude, coords.longitude, a.lat, a.lng)
            ? b
            : a,
        );
        setNearest(best.name);
      },
      () => setDenied(true),
    );
  }

  return (
    <>
      <h1>สาขาของเรา</h1>
      <ul>
        {STORES.map((s) => (
          <li key={s.name}>
            {s.name} ({s.lat}, {s.lng})
          </li>
        ))}
      </ul>
      <button type="button" onClick={findNearest}>
        หาสาขาใกล้ฉัน
      </button>
      {nearest && <p role="status">สาขาที่ใกล้ที่สุดคือ {nearest}</p>}
      {denied && <p role="alert">ไม่ได้รับอนุญาตให้เข้าถึงตำแหน่ง</p>}
    </>
  );
}
