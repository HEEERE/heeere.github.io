type GardenBridge = {
  takeShare: () => string;
  saveFile: (name: string, mime: string, base64: string) => void;
  minimize: () => void;
  copyText: (text: string) => void;
};

declare global {
  interface Window { GardenNative?: GardenBridge }
}

export const isNativeGarden = (): boolean => Boolean(window.GardenNative);
export const gardenName = '喆元的庭院';
