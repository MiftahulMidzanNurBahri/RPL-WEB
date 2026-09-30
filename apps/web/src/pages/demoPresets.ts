import { ItemCategories } from "../../../../packages/shared/src/index.js";

export interface DemoPreset {
  id: string;
  label: string;
  title: string;
  category: typeof ItemCategories[number];
  background: string;
  accent: string;
  illustration: string;
}

export const DemoPresets: DemoPreset[] = [
  {
    id: "laptop",
    label: "Laptop",
    title: "Laptop warna perak",
    category: ItemCategories[0],
    background: "#e7eff9",
    accent: "#4777af",
    illustration: '<rect x="83" y="39" width="154" height="111" rx="8"/><rect x="92" y="48" width="136" height="88" rx="3" fill="#f8fbff" stroke="none"/><path d="M59 157h202l-17 19H76z" fill="#4777af" stroke="none"/><path d="M127 161h66" stroke="#dbeafe" stroke-width="3"/>'
  },
  {
    id: "earphone",
    label: "Earphone",
    title: "Earphone nirkabel",
    category: ItemCategories[0],
    background: "#edf2ef",
    accent: "#39816c",
    illustration: '<rect x="83" y="111" width="154" height="61" rx="27"/><path d="M107 76c0-17 13-31 29-31v56c0 8-7 15-15 15s-14-7-14-15zM184 76c0-17 13-31 29-31v56c0 8-7 15-15 15s-14-7-14-15z"/><circle cx="128" cy="82" r="4" fill="#ffffff" stroke="none"/><circle cx="205" cy="82" r="4" fill="#ffffff" stroke="none"/>'
  },
  {
    id: "key",
    label: "Kunci motor",
    title: "Kunci kendaraan",
    category: ItemCategories[2],
    background: "#fff2e8",
    accent: "#c46a3c",
    illustration: '<circle cx="112" cy="96" r="39"/><circle cx="112" cy="96" r="18" fill="#fff8f1"/><path d="M150 96h100v19h-22v20h-20v-20h-25v-19" fill="#c46a3c" stroke="#c46a3c"/><path d="M183 101h55" stroke="#fff8f1" stroke-width="4"/>'
  },
  {
    id: "wallet",
    label: "Dompet",
    title: "Dompet lipat",
    category: ItemCategories[1],
    background: "#f5efe3",
    accent: "#876848",
    illustration: '<rect x="67" y="62" width="186" height="111" rx="13"/><path d="M68 86h170a14 14 0 0 1 14 14v39h-51a24 24 0 0 1 0-48h52"/><circle cx="207" cy="119" r="5" fill="#fffaf0"/><path d="M91 78h72" stroke="#d9c7ac" stroke-width="5"/>'
  },
  {
    id: "backpack",
    label: "Ransel",
    title: "Ransel kampus",
    category: ItemCategories[6],
    background: "#f1eaf7",
    accent: "#8061a1",
    illustration: '<path d="M105 77a55 55 0 0 1 110 0v88H92V92a15 15 0 0 1 13-15z"/><path d="M124 77a36 36 0 0 1 72 0" fill="none"/><rect x="113" y="111" width="94" height="37" rx="9" fill="#f8f4fc"/><path d="M124 123h72" stroke="#b7a2ce" stroke-width="4"/><path d="M92 99h-9v42h9m132-42h9v42h-9" fill="none" stroke="#8061a1" stroke-width="8"/>'
  },
  {
    id: "glasses",
    label: "Kacamata",
    title: "Kacamata bingkai",
    category: ItemCategories[5],
    background: "#e8f3f2",
    accent: "#347b78",
    illustration: '<rect x="54" y="79" width="91" height="66" rx="25"/><rect x="175" y="79" width="91" height="66" rx="25"/><path d="M145 99c8-9 22-9 30 0M54 92 38 80m228 12 16-12" fill="none" stroke="#347b78" stroke-width="9" stroke-linecap="round"/><path d="M69 91h61m60 0h40" stroke="#b7d8d5" stroke-width="4"/>'
  },
  {
    id: "tumbler",
    label: "Tumbler",
    title: "Tumbler minum",
    category: ItemCategories[6],
    background: "#fff4dd",
    accent: "#cb8b28",
    illustration: '<path d="M124 55h72l-7 23 17 22-9 75H111l-9-75 17-22z"/><rect x="130" y="41" width="60" height="17" rx="5"/><path d="M119 104h82" stroke="#f4d18f" stroke-width="5"/><path d="M133 119h54" stroke="#f4d18f" stroke-width="4"/>'
  },
  {
    id: "calculator",
    label: "Kalkulator",
    title: "Kalkulator ilmiah",
    category: ItemCategories[0],
    background: "#e9edf2",
    accent: "#45566d",
    illustration: '<rect x="92" y="35" width="136" height="151" rx="12"/><rect x="108" y="52" width="104" height="30" rx="4" fill="#d8e6df" stroke="none"/><g fill="#f6f8fb" stroke="#aab6c4" stroke-width="2"><rect x="108" y="96" width="22" height="20" rx="4"/><rect x="141" y="96" width="22" height="20" rx="4"/><rect x="174" y="96" width="22" height="20" rx="4"/><rect x="108" y="127" width="22" height="20" rx="4"/><rect x="141" y="127" width="22" height="20" rx="4"/><rect x="174" y="127" width="22" height="20" rx="4"/><rect x="108" y="158" width="22" height="14" rx="4"/><rect x="141" y="158" width="22" height="14" rx="4"/><rect x="174" y="158" width="22" height="14" rx="4"/></g>'
  }
];

export function presetImageUrl(preset: DemoPreset): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 220"><rect width="320" height="220" fill="${preset.background}"/><path d="M0 188 320 28v192H0z" fill="#ffffff" fill-opacity=".34"/><g fill="${preset.accent}" stroke="${preset.accent}" stroke-width="7" stroke-linecap="round" stroke-linejoin="round">${preset.illustration}</g></svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

export async function presetToFile(preset: DemoPreset): Promise<File> {
  const image = new Image();
  image.src = presetImageUrl(preset);
  await new Promise<void>((resolve, reject) => {
    image.onload = () => resolve();
    image.onerror = () => reject(new Error("Preset image could not be loaded."));
  });

  const canvas = document.createElement("canvas");
  canvas.width = 640;
  canvas.height = 440;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Image canvas is not available.");
  context.drawImage(image, 0, 0, canvas.width, canvas.height);

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((result) => result ? resolve(result) : reject(new Error("Preset image could not be encoded.")), "image/png");
  });
  return new File([blob], `${preset.id}.png`, { type: "image/png" });
}