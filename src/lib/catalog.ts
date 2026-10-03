export type CatalogItem = {
  id: string;
  name: string;
  blurb: string;
  health: number;
  sku: string;
};

export type CatalogGroup = {
  id: string;
  title: string;
  blurb: string;
  items: CatalogItem[];
};

export const CATALOG: CatalogGroup[] = [
  {
    id: "medicines",
    title: "Medicines",
    blurb: "Pharmacy stock for everyday and prescribed use. Details come later.",
    items: [
      { id: "med-para", name: "Paracetamol 500mg", blurb: "Pain and fever. Pack of 20.", health: 8, sku: "MED-001" },
      { id: "med-amox", name: "Amoxicillin 500mg", blurb: "Prescription only. Capsule pack.", health: 22, sku: "MED-002" },
      { id: "med-ibu", name: "Ibuprofen 400mg", blurb: "Inflammation and pain. Pack of 16.", health: 10, sku: "MED-003" },
    ],
  },
  {
    id: "otc",
    title: "Over the counter",
    blurb: "No prescription at the desk. Still billed in Health.",
    items: [
      { id: "otc-cough", name: "Cough syrup 100ml", blurb: "Dry cough formula.", health: 12, sku: "OTC-001" },
      { id: "otc-antac", name: "Antacid chewables", blurb: "Heartburn relief. 24 tablets.", health: 7, sku: "OTC-002" },
      { id: "otc-ors", name: "ORS sachets", blurb: "Rehydration. Pack of 10.", health: 6, sku: "OTC-003" },
    ],
  },
  {
    id: "supplements",
    title: "Vitamins and supplements",
    blurb: "Nutrition support from the industrial pharmacy.",
    items: [
      { id: "sup-c", name: "Vitamin C 1000mg", blurb: "30 tablets.", health: 15, sku: "SUP-001" },
      { id: "sup-d", name: "Vitamin D3 1000 IU", blurb: "60 capsules.", health: 18, sku: "SUP-002" },
      { id: "sup-iron", name: "Iron + folate", blurb: "30 tablets.", health: 14, sku: "SUP-003" },
    ],
  },
  {
    id: "first-aid",
    title: "First aid",
    blurb: "Home and ward kits.",
    items: [
      { id: "fa-kit", name: "Family first aid kit", blurb: "Bandages, wipes, tape.", health: 35, sku: "FA-001" },
      { id: "fa-gauze", name: "Sterile gauze pack", blurb: "10 pieces.", health: 9, sku: "FA-002" },
      { id: "fa-plas", name: "Plaster assortment", blurb: "40 strips.", health: 5, sku: "FA-003" },
    ],
  },
  {
    id: "devices",
    title: "Medical devices",
    blurb: "Monitors and tools for the house and the ward.",
    items: [
      { id: "dev-bp", name: "Digital BP monitor", blurb: "Upper arm cuff.", health: 180, sku: "DEV-001" },
      { id: "dev-glu", name: "Glucometer kit", blurb: "Meter, 10 strips, lancets.", health: 95, sku: "DEV-002" },
      { id: "dev-therm", name: "Infrared thermometer", blurb: "Non-contact.", health: 70, sku: "DEV-003" },
    ],
  },
  {
    id: "diagnostics",
    title: "Diagnostics and tests",
    blurb: "Rapid tests and sample kits.",
    items: [
      { id: "dx-mal", name: "Malaria rapid test", blurb: "Single cassette.", health: 12, sku: "DX-001" },
      { id: "dx-preg", name: "Pregnancy test", blurb: "Midstream. Pack of 2.", health: 8, sku: "DX-002" },
      { id: "dx-glu", name: "Glucose strips", blurb: "50 strips.", health: 28, sku: "DX-003" },
    ],
  },
  {
    id: "personal",
    title: "Personal care",
    blurb: "Hygiene that the dispensary actually stocks.",
    items: [
      { id: "pc-hand", name: "Surgical hand wash", blurb: "500ml.", health: 11, sku: "PC-001" },
      { id: "pc-mask", name: "Face masks", blurb: "Box of 50.", health: 16, sku: "PC-002" },
      { id: "pc-san", name: "Alcohol sanitiser 250ml", blurb: "70 percent.", health: 7, sku: "PC-003" },
    ],
  },
  {
    id: "maternal",
    title: "Maternal and infant",
    blurb: "Antenatal and newborn support.",
    items: [
      { id: "mat-pre", name: "Prenatal vitamins", blurb: "30 days.", health: 24, sku: "MAT-001" },
      { id: "mat-dia", name: "Infant diapers pack", blurb: "Size 2. 30 pieces.", health: 20, sku: "MAT-002" },
      { id: "mat-ors", name: "Infant ORS", blurb: "6 sachets.", health: 6, sku: "MAT-003" },
    ],
  },
  {
    id: "surgical",
    title: "Surgical consumables",
    blurb: "Theatre and procedure stock.",
    items: [
      { id: "sur-glove", name: "Sterile gloves", blurb: "Pair. Size M.", health: 4, sku: "SUR-001" },
      { id: "sur-syr", name: "Syringe 5ml", blurb: "Needle included. Pack of 10.", health: 8, sku: "SUR-002" },
      { id: "sur-cat", name: "IV cannula 20G", blurb: "Single.", health: 5, sku: "SUR-003" },
    ],
  },
  {
    id: "chronic",
    title: "Chronic care",
    blurb: "Diabetes, blood pressure, and long-running plans.",
    items: [
      { id: "chr-met", name: "Metformin 500mg", blurb: "Prescription. 28 tablets.", health: 18, sku: "CHR-001" },
      { id: "chr-aml", name: "Amlodipine 5mg", blurb: "Prescription. 28 tablets.", health: 16, sku: "CHR-002" },
      { id: "chr-strip", name: "BP log booklet", blurb: "90-day paper log.", health: 4, sku: "CHR-003" },
    ],
  },
  {
    id: "dental",
    title: "Dental",
    blurb: "Mouth care from the campus pharmacy.",
    items: [
      { id: "den-paste", name: "Fluoride toothpaste", blurb: "100ml.", health: 6, sku: "DEN-001" },
      { id: "den-mw", name: "Antiseptic mouthwash", blurb: "250ml.", health: 9, sku: "DEN-002" },
      { id: "den-brush", name: "Soft toothbrush", blurb: "Single.", health: 3, sku: "DEN-003" },
    ],
  },
  {
    id: "eye",
    title: "Eye care",
    blurb: "Drops and simple vision support.",
    items: [
      { id: "eye-art", name: "Artificial tears", blurb: "10ml.", health: 11, sku: "EYE-001" },
      { id: "eye-ant", name: "Antibiotic eye drop", blurb: "Prescription. 5ml.", health: 19, sku: "EYE-002" },
      { id: "eye-patch", name: "Eye patch", blurb: "Sterile. Single.", health: 3, sku: "EYE-003" },
    ],
  },
  {
    id: "skin",
    title: "Skin",
    blurb: "Creams and dressings.",
    items: [
      { id: "sk-hyd", name: "Aqueous cream", blurb: "250g.", health: 8, sku: "SK-001" },
      { id: "sk-anti", name: "Antifungal cream", blurb: "15g.", health: 12, sku: "SK-002" },
      { id: "sk-burn", name: "Burn gel", blurb: "25g.", health: 10, sku: "SK-003" },
    ],
  },
  {
    id: "wellness",
    title: "Wellness",
    blurb: "Sleep, hydration, and recovery.",
    items: [
      { id: "wel-sleep", name: "Sleep support tea", blurb: "20 bags.", health: 9, sku: "WEL-001" },
      { id: "wel-pro", name: "Probiotic capsules", blurb: "30 count.", health: 21, sku: "WEL-002" },
      { id: "wel-zinc", name: "Zinc 25mg", blurb: "30 tablets.", health: 10, sku: "WEL-003" },
    ],
  },
];
