//#region node_modules/.nitro/vite/services/ssr/assets/constants-SIRCXCh0.js
var TIERS = {
	base: {
		id: "base",
		name: "Health Trust Base",
		short: "Base",
		priceHealth: 250,
		durationMonths: 6,
		refreshes: 2,
		queue: 3
	},
	plus: {
		id: "plus",
		name: "Health Trust Plus",
		short: "Plus",
		priceHealth: 500,
		durationMonths: 9,
		refreshes: 3,
		queue: 2
	},
	prime: {
		id: "prime",
		name: "Health Trust Prime",
		short: "Prime",
		priceHealth: 1e3,
		durationMonths: 12,
		refreshes: 4,
		queue: 1
	}
};
var REFERRAL_PERCENT = {
	base: {
		base: 3,
		plus: 5,
		prime: 7
	},
	plus: {
		base: 5,
		plus: 8,
		prime: 11
	},
	prime: {
		base: 7,
		plus: 11,
		prime: 15
	}
};
var CALL_PRICES = [{
	minutes: 25,
	health: 50
}, {
	minutes: 60,
	health: 110
}];
var PHYSICAL_PRICES = [
	{
		minutes: 30,
		health: 40
	},
	{
		minutes: 60,
		health: 80
	},
	{
		minutes: 90,
		health: 110
	}
];
//#endregion
export { TIERS as i, PHYSICAL_PRICES as n, REFERRAL_PERCENT as r, CALL_PRICES as t };
