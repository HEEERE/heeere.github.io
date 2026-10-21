import {useMemo} from 'react';
import {
  coolerDrinksTexture,
  konbiniInteriorFloor,
  magazineRackTexture,
  menuBoardTexture,
  neonOpenTexture,
  posterTexture,
  shelfProductsTexture,
  storePosterTexture,
  staffOnlyTexture,
} from '../../three/textures';
import {KONBINI} from './layout';
import {Box, Cyl, Glow, Panel, Plant, RBox, Sphere, type Vec3} from '../../three/kit/primitives';
import {flat, glass, toon} from '../../three/materials';
import {LampLight} from '../../three/kit/lighting';
import {Steam} from '../../three/kit/rain';

const FLOOR_Y = KONBINI.building.interiorFloor;
const CEILING_Y = KONBINI.building.ceiling;

/* ------------------------------------------------------------------ */
/* Back wall: drink coolers + dry goods shelves                        */
/* ------------------------------------------------------------------ */

const PRODUCT_COLORS = ['#e8c86a', '#d8705a', '#6a9a7a', '#5f8ab0', '#e8e0c8', '#b87a9a', '#d8a45a'];

const ProductStack = ({origin, count = 6}: {origin: Vec3; count?: number}) => (
  <group position={origin}>
    {Array.from({length: count}, (_, index) => {
      const color = PRODUCT_COLORS[index % PRODUCT_COLORS.length] ?? '#e8c86a';
      return (
        <Box
          key={index}
          size={[0.032 + (index % 3) * 0.006, 0.05 + (index % 4) * 0.01, 0.028]}
          color={color}
          ink={false}
          shadow={false}
          p={[(index % 3) * 0.04 - 0.04, 0.028, Math.floor(index / 3) * 0.05 - 0.025]}
          r={[0, (index % 5) * 0.12, 0]}
        />
      );
    })}
  </group>
);

const CoolerBank = () => {
  const doors = [-1.5, -1.23, -0.96];
  return (
    <group>
      <RBox size={[0.78, 0.78, 0.3]} color="#38424a" p={[-1.23, FLOOR_Y + 0.39, -2.05]} ink inkWidth={0.005} shadow={false} />
      <Box
        size={[0.74, 0.68, 0.02]}
        material={toon('#b0cad8', {emissive: '#6f96ac', emissiveIntensity: 0.08})}
        p={[-1.23, FLOOR_Y + 0.4, -2.03]}
        ink={false}
        shadow={false}
      />
      {doors.map((x) => (
        <group key={x}>
          <Panel size={[0.245, 0.66]} texture={coolerDrinksTexture()} lit p={[x, FLOOR_Y + 0.4, -1.888]} />
          <Panel size={[0.245, 0.66]} material={glass('#cfe8f4', 0.1)} p={[x, FLOOR_Y + 0.4, -1.87]} />
          <Box size={[0.016, 0.1, 0.014]} color="#b8c0c4" p={[x + 0.09, FLOOR_Y + 0.44, -1.865]} ink={false} shadow={false} />
        </group>
      ))}
      {[-1.62, -1.365, -1.095, -0.83].map((x) => (
        <Box key={x} size={[0.018, 0.72, 0.035]} color="#6f777c" p={[x, FLOOR_Y + 0.4, -1.87]} ink={false} shadow={false} />
      ))}
      <Box size={[0.8, 0.02, 0.04]} color="#6f777c" p={[-1.23, FLOOR_Y + 0.755, -1.87]} ink={false} shadow={false} />
      <Box size={[0.8, 0.02, 0.04]} color="#6f777c" p={[-1.23, FLOOR_Y + 0.045, -1.87]} ink={false} shadow={false} />
      <Box size={[0.76, 0.03, 0.03]} material={flat('#f2fbff')} p={[-1.23, FLOOR_Y + 0.78, -1.9]} ink={false} shadow={false} />
      <LampLight position={[-1.23, FLOOR_Y + 0.55, -1.8]} color="#cfe8ff" intensity={0.45} distance={1.6} />
    </group>
  );
};

const DryShelf = () => {
  const centerX = -0.335;
  const unitWidth = 0.77;
  const centerZ = -2.06;
  return (
    <group>
      <Box size={[unitWidth, 0.76, 0.06]} color="#3a3c38" p={[centerX, FLOOR_Y + 0.38, -2.16]} ink={false} shadow={false} />
      <Box size={[0.03, 0.76, 0.24]} color="#4a4c46" p={[centerX - unitWidth / 2, FLOOR_Y + 0.38, centerZ]} ink={false} shadow={false} />
      <Box size={[0.03, 0.76, 0.24]} color="#4a4c46" p={[centerX + unitWidth / 2, FLOOR_Y + 0.38, centerZ]} ink={false} shadow={false} />
      <Box size={[unitWidth, 0.04, 0.24]} color="#4a4c46" p={[centerX, FLOOR_Y + 0.02, centerZ]} ink={false} shadow={false} />
      {[0, 1, 2, 3].map((row) => {
        const y = FLOOR_Y + 0.16 + row * 0.16;
        return (
          <group key={row}>
            <Panel size={[unitWidth - 0.02, 0.13]} texture={shelfProductsTexture(row)} lit p={[centerX, y + 0.065, centerZ + 0.09]} />
            <Box size={[unitWidth - 0.02, 0.016, 0.18]} color="#4f514a" p={[centerX, y - 0.006, centerZ + 0.03]} ink={false} shadow={false} />
            <ProductStack origin={[centerX - 0.18, y - 0.004, centerZ + 0.13]} count={4} />
            <ProductStack origin={[centerX + 0.16, y - 0.004, centerZ + 0.13]} count={3} />
          </group>
        );
      })}
      <Box size={[unitWidth, 0.02, 0.24]} color="#e8e2d2" p={[centerX, FLOOR_Y + 0.765, centerZ]} ink={false} shadow={false} />
      <ProductStack origin={[centerX - 0.16, FLOOR_Y + 0.765, centerZ]} count={4} />
    </group>
  );
};

/* ------------------------------------------------------------------ */
/* Central island shelf                                                */
/* ------------------------------------------------------------------ */

const IslandShelf = () => {
  const centerX = -0.82;
  const centerZ = -1.12;
  return (
    <group>
      <RBox size={[0.24, 0.42, 0.74]} color="#d8d2c2" p={[centerX, FLOOR_Y + 0.21, centerZ]} ink inkWidth={0.005} />
      <Panel size={[0.7, 0.3]} texture={shelfProductsTexture(2)} lit r={[0, Math.PI / 2, 0]} p={[centerX + 0.125, FLOOR_Y + 0.22, centerZ]} />
      <Panel size={[0.7, 0.3]} texture={shelfProductsTexture(1)} lit r={[0, -Math.PI / 2, 0]} p={[centerX - 0.125, FLOOR_Y + 0.22, centerZ]} />
      <Box size={[0.24, 0.018, 0.74]} color="#efe9d8" p={[centerX, FLOOR_Y + 0.43, centerZ]} ink={false} shadow={false} />
      <ProductStack origin={[centerX, FLOOR_Y + 0.43, centerZ - 0.24]} count={3} />
      <ProductStack origin={[centerX, FLOOR_Y + 0.43, centerZ + 0.06]} count={4} />
      {[-0.2, 0.05, 0.26].map((offset) => (
        <Panel
          key={offset}
          size={[0.082, 0.032]}
          texture={storePosterTexture('sale')}
          p={[centerX + 0.13, FLOOR_Y + 0.11, centerZ + offset]}
          r={[0, Math.PI / 2, 0]}
        />
      ))}
      <RBox size={[0.16, 0.09, 0.12]} color="#c8a44a" p={[centerX + 0.24, FLOOR_Y + 0.045, centerZ + 0.44]} ink={false} shadow={false} />
    </group>
  );
};

/* ------------------------------------------------------------------ */
/* Counter, hot food, coffee                                           */
/* ------------------------------------------------------------------ */

const Counter = () => (
  <group>
    <RBox size={[0.34, 0.7, 0.86]} color="#d6cdb8" p={[0.24, FLOOR_Y + 0.35, -1.6]} ink inkWidth={0.006} />
    <Box size={[0.38, 0.03, 0.9]} color="#e4d8bc" p={[0.24, FLOOR_Y + 0.715, -1.6]} ink={false} shadow={false} />
    <Box size={[0.02, 0.56, 0.82]} color="#b8ac94" p={[0.075, FLOOR_Y + 0.36, -1.6]} ink={false} shadow={false} />
    {/* Customer-facing POS display. */}
    <Box size={[0.17, 0.13, 0.014]} color="#20272c" p={[0.26, FLOOR_Y + 0.82, -1.2]} r={[0.18, 0, 0]} ink={false} shadow={false} />
    <Panel size={[0.15, 0.11]} texture={storePosterTexture('coffee')} p={[0.26, FLOOR_Y + 0.82, -1.191]} r={[0.18, 0, 0]} />
    <Box size={[0.03, 0.06, 0.03]} color="#2b3238" p={[0.26, FLOOR_Y + 0.76, -1.21]} ink={false} shadow={false} />
    {/* Hot food case. */}
    <Box size={[0.28, 0.02, 0.2]} color="#6a6050" p={[0.26, FLOOR_Y + 0.73, -1.52]} ink={false} shadow={false} />
    <Box size={[0.27, 0.16, 0.19]} color="#f6d8a0" material={flat('#f6cf94')} p={[0.26, FLOOR_Y + 0.82, -1.52]} ink={false} shadow={false} />
    {[0, 1, 2, 3].map((index) => (
      <Sphere key={index} radius={0.028} color={index % 2 === 0 ? '#d8a45a' : '#c87a4a'} ink={false} p={[0.18 + index * 0.055, FLOOR_Y + 0.79, -1.52]} s={[1, 0.7, 1]} />
    ))}
    <Box size={[0.29, 0.2, 0.012]} material={glass('#e8f0f4', 0.2)} p={[0.26, FLOOR_Y + 0.84, -1.42]} ink={false} shadow={false} />
    <Box size={[0.29, 0.2, 0.012]} material={glass('#e8f0f4', 0.2)} p={[0.26, FLOOR_Y + 0.84, -1.62]} ink={false} shadow={false} />
    <Box size={[0.012, 0.2, 0.19]} material={glass('#e8f0f4', 0.2)} p={[0.13, FLOOR_Y + 0.84, -1.52]} ink={false} shadow={false} />
    <Box size={[0.012, 0.2, 0.19]} material={glass('#e8f0f4', 0.2)} p={[0.39, FLOOR_Y + 0.84, -1.52]} ink={false} shadow={false} />
    {/* Coffee machine */}
    <RBox size={[0.15, 0.26, 0.17]} color="#3c4248" p={[0.34, FLOOR_Y + 0.86, -1.84]} ink={false} shadow={false} />
    <Panel size={[0.1, 0.075]} texture={storePosterTexture('coffee')} p={[0.34, FLOOR_Y + 0.92, -1.754]} />
    <Box size={[0.05, 0.02, 0.05]} color="#20262a" p={[0.34, FLOOR_Y + 0.76, -1.78]} ink={false} shadow={false} />
    <Cyl radius={0.014} height={0.035} color="#f0ece0" p={[0.34, FLOOR_Y + 0.74, -1.78]} ink={false} shadow={false} />
    <Steam p={[0.34, FLOOR_Y + 0.77, -1.78]} height={0.16} />
    {/* Register + basket stack + pen pot */}
    <Box size={[0.09, 0.05, 0.06]} color="#2b3238" p={[0.2, FLOOR_Y + 0.76, -1.72]} ink={false} shadow={false} />
    <Box size={[0.2, 0.018, 0.18]} color="#8a6f5a" p={[0.24, FLOOR_Y + 0.735, -1.4]} ink={false} shadow={false} />
    <Cyl radius={0.018} height={0.05} color="#6a6f6a" p={[0.12, FLOOR_Y + 0.755, -1.7]} ink={false} shadow={false} />
    {[0, 1].map((index) => (
      <RBox key={index} size={[0.2, 0.12, 0.2]} color="#c8b48e" p={[0.23, FLOOR_Y + 0.09 + index * 0.12, -1.32]} ink={false} shadow={false} />
    ))}
  </group>
);

/* ------------------------------------------------------------------ */
/* Set dressing near the window                                        */
/* ------------------------------------------------------------------ */

const MagazineRack = () => (
  <group>
    <RBox size={[0.56, 0.24, 0.2]} color="#c8b996" p={[-1.25, FLOOR_Y + 0.12, -0.72]} ink={false} />
    <Panel size={[0.52, 0.2]} texture={magazineRackTexture()} lit r={[-Math.PI / 2 + 0.5, 0, 0]} p={[-1.25, FLOOR_Y + 0.26, -0.66]} />
    {[0, 1, 2, 3].map((index) => (
      <Box
        key={index}
        size={[0.1, 0.016, 0.13]}
        color={index % 2 === 0 ? '#e8dcc4' : '#d8b8a8'}
        ink={false}
        shadow={false}
        p={[-1.44 + index * 0.11, FLOOR_Y + 0.28, -0.66]}
        r={[-0.55, 0.1 * (index % 2 === 0 ? 1 : -1), 0]}
      />
    ))}
  </group>
);

const Baskets = () => (
  <group position={[0.3, FLOOR_Y, -0.78]}>
    {[0, 1, 2].map((index) => (
      <RBox key={index} size={[0.24, 0.055, 0.18]} color={index === 0 ? '#d8b05a' : '#c8a44a'} p={[0, 0.03 + index * 0.055, 0]} ink={false} shadow={false} />
    ))}
    <Cyl radius={0.14} height={0.09} color="#8a9096" p={[-0.3, 0.05, 0.02]} ink={false} shadow={false} />
  </group>
);

const WindowPosters = () => (
  <group>
    {(
      [
        {kind: 'bento', x: -1.42, y: 0.52, w: 0.22, h: 0.3},
        {kind: 'drink', x: -1.08, y: 0.5, w: 0.2, h: 0.28},
        {kind: 'staff', x: 0.38, y: 0.52, w: 0.18, h: 0.26},
      ] as const
    ).map((poster) => (
      <Panel key={poster.kind} size={[poster.w, poster.h]} texture={storePosterTexture(poster.kind)} p={[poster.x, poster.y, -0.505]} />
    ))}
    <Panel size={[0.34, 0.17]} texture={neonOpenTexture()} p={[-1.24, 0.9, -0.56]} />
    <Glow color="#ffc48a" size={0.4} opacity={0.14} p={[-1.24, 0.9, -0.53]} />
  </group>
);

const HangingBanners = () => (
  <group>
    {[
      {kind: 'sale' as const, x: -1.02},
      {kind: 'bento' as const, x: -0.34},
    ].map((banner) => (
      <group key={banner.kind} position={[banner.x, 0, 0]}>
        <Cyl radius={0.004} height={0.16} color="#8a8f8a" p={[0, 1.0, -1.0]} ink={false} shadow={false} />
        <Panel size={[0.34, 0.26]} texture={storePosterTexture(banner.kind)} p={[0, 0.8, -1.0]} r={[0, 0, 0.015]} />
        <Glow color="#ffd8a8" size={0.28} opacity={0.08} p={[0, 0.82, -0.98]} />
      </group>
    ))}
  </group>
);

/* ------------------------------------------------------------------ */
/* Interior                                                           */
/* ------------------------------------------------------------------ */

export const StoreInterior = () => {
  const floor = useMemo(konbiniInteriorFloor, []);
  return (
    <group>
      <Panel size={[2.11, 1.69]} texture={floor} lit r={[-Math.PI / 2, 0, 0]} p={[-0.62, FLOOR_Y + 0.001, -1.37]} />
      <Box size={[2.11, 0.03, 1.7]} color="#cfc7b6" p={[-0.62, CEILING_Y, -1.37]} ink={false} shadow={false} />

      {/* Ceiling light bars. */}
      {[-1.0, -1.45, -1.9].map((z) => (
        <Box key={z} size={[1.44, 0.03, 0.09]} material={flat('#ffe9c0')} p={[-0.7, CEILING_Y - 0.03, z]} ink={false} shadow={false} />
      ))}

      <CoolerBank />
      <DryShelf />
      <IslandShelf />
      <Counter />
      <MagazineRack />
      <Baskets />
      <WindowPosters />
      <HangingBanners />

      {/* Backlit panel on the left wall. */}
      <Box size={[0.03, 0.44, 0.82]} material={flat('#f4efe2')} p={[-1.66, 0.72, -1.42]} ink={false} shadow={false} />
      <Panel
        size={[0.7, 0.28]}
        texture={posterTexture('coffee-ad', 'HOT COFFEE', 'いつでも 淹れたて', '#7a5232')}
        r={[0, Math.PI / 2, 0]}
        p={[-1.635, 0.72, -1.42]}
      />
      <Box size={[0.025, 0.02, 0.8]} material={flat('#ffe8c0')} p={[-1.64, 0.94, -1.42]} ink={false} shadow={false} />

      {/* Staff door + menu board behind the counter */}
      <Box size={[0.28, 0.86, 0.02]} color="#4a4a44" p={[0.25, FLOOR_Y + 0.43, -2.19]} ink={false} shadow={false} />
      <Panel size={[0.16, 0.06]} texture={staffOnlyTexture()} p={[0.25, FLOOR_Y + 0.72, -2.178]} />
      <Panel size={[0.42, 0.24]} texture={menuBoardTexture()} p={[0.24, 0.9, -2.177]} />
      <Box size={[0.44, 0.02, 0.03]} color="#8a7f6a" p={[0.24, 1.03, -2.17]} ink={false} shadow={false} />

      {/* Ceiling camera + a small plant by the door. */}
      <Box size={[0.05, 0.035, 0.05]} color="#5a6266" p={[-0.4, CEILING_Y - 0.05, -0.75]} ink={false} shadow={false} />
      <Cyl radius={0.018} height={0.03} color="#2b3238" p={[-0.4, CEILING_Y - 0.085, -0.72]} r={[0.6, 0, 0]} ink={false} shadow={false} />
      <Plant p={[0.38, FLOOR_Y, -0.62]} scale={0.8} leafColor="#6f9a68" potColor="#b8a888" />

      {/* Warm interior lighting — the colour the whole scene is built around. */}
      <LampLight position={[-0.9, CEILING_Y - 0.12, -1.15]} color="#ffd9a4" intensity={1.75} distance={2.6} />
      <LampLight position={[-0.05, CEILING_Y - 0.12, -1.55]} color="#ffdcae" intensity={1.45} distance={2.4} />
      <LampLight position={[-1.35, 0.5, -0.85]} color="#ffd0a0" intensity={0.6} distance={1.4} />
      <LampLight position={[-1.23, CEILING_Y - 0.15, -2.02]} color="#cfe8ff" intensity={0.3} distance={1.4} />
    </group>
  );
};
