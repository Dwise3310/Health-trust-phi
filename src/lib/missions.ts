export type Mission = {
  id: string;
  title: string;
  body: string;
  reward: number;
};

export const MISSIONS: Mission[] = [
  {
    id: "profile",
    title: "Complete your patient file",
    body: "Add a photo, phone, state of origin, and next of kin on Overview.",
    reward: 10,
  },
  {
    id: "username",
    title: "Lock a username",
    body: "Pick a public username in Settings. It stays yours.",
    reward: 5,
  },
  {
    id: "deposit",
    title: "First Health in the wallet",
    body: "Fund the wallet, or use the test credit while we wire the bank.",
    reward: 15,
  },
  {
    id: "product",
    title: "First pharmacy item",
    body: "Open Products and add any template item to your bag.",
    reward: 12,
  },
  {
    id: "card",
    title: "Hold a digital card",
    body: "Buy a normal or VIP appointment card.",
    reward: 8,
  },
  {
    id: "booking",
    title: "Book a consult",
    body: "Schedule a physical visit or an in-app audio call.",
    reward: 10,
  },
  {
    id: "share",
    title: "Issue a Care Quota code",
    body: "Allocate a slice of cover to family from the Wallet tab.",
    reward: 8,
  },
  {
    id: "refer",
    title: "Bring a member",
    body: "Someone must create an account with your referral code.",
    reward: 5,
  },
];
