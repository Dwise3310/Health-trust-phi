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
    blurb: "Everyday and prescribed stock from the campus dispensary.",
    items: [
      { id: "med-para", name: "Paracetamol 500mg", blurb: "Pain and fever. Pack of 20.", health: 8, sku: "MED-001" },
      { id: "med-amox", name: "Amoxicillin 500mg", blurb: "Prescription only. Capsule pack.", health: 22, sku: "MED-002" },
      { id: "med-ibu", name: "Ibuprofen 400mg", blurb: "Inflammation and pain. Pack of 16.", health: 10, sku: "MED-003" },
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
    id: "surgical",
    title: "Surgical consumables",
    blurb: "Theatre and procedure stock.",
    items: [
      { id: "sur-glove", name: "Sterile gloves", blurb: "Pair. Size M.", health: 4, sku: "SUR-001" },
      { id: "sur-syr", name: "Syringe 5ml", blurb: "Needle included. Pack of 10.", health: 8, sku: "SUR-002" },
      { id: "sur-cat", name: "IV cannula 20G", blurb: "Single.", health: 5, sku: "SUR-003" },
    ],
  },
];
