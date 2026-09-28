import { a as getServerFnById, i as TSS_SERVER_FUNCTION, r as createServerFn } from "./ssr.mjs";
import { D as _enum, F as object, P as number, R as string } from "../_libs/@better-auth/core+[...].mjs";
import { t as authMiddleware } from "./middleware-B4MpUGzV.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/actions-CjO9TbL0.js
var createSsrRpc = (functionId) => {
	const url = "/_serverFn/" + functionId;
	const serverFnMeta = { id: functionId };
	const fn = async (...args) => {
		return (await getServerFnById(functionId, { origin: "server" }))(...args);
	};
	return Object.assign(fn, {
		url,
		serverFnMeta,
		[TSS_SERVER_FUNCTION]: true
	});
};
var ensureMember = createServerFn({ method: "POST" }).middleware([authMiddleware]).handler(createSsrRpc("6492d5219af7fe062e126946310a29ceb18ee664605fbb55200f32ba1eb4b514"));
var setUsername = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((d) => object({
	username: string().min(3).max(24).regex(/^[a-zA-Z0-9_]+$/),
	fullName: string().max(80).optional(),
	phone: string().max(20).optional(),
	referredBy: string().max(24).optional()
}).parse(d)).handler(createSsrRpc("d46d956e738d9df2364d6d716c19b56d9356cdf5449495b072790ab7037285e9"));
var fundWalletDemo = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((d) => object({ amount: number().min(10).max(5e3) }).parse(d)).handler(createSsrRpc("da9fa1231c0ef0bad55b308baf0512e4bf99c722e5561804c95b7cb1f0fb9600"));
var subscribeTier = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((d) => object({ tier: _enum([
	"base",
	"plus",
	"prime"
]) }).parse(d)).handler(createSsrRpc("b126fa3631affa6e5d6c15b3d1fff6b575bbab74bc5a12ab3b51da07725c9c25"));
var generateCareCode = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((d) => object({ percent: number().min(1).max(100) }).parse(d)).handler(createSsrRpc("1762bbe9a58ca1b86be82f11f7d678ce956c0fd30fd581dd2d02bee103ebba5a"));
var listMyCodes = createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(createSsrRpc("535c01a1400eda1e3a874b669f301691ab62739eaaed85cc9b3a90d4423b034a"));
var cancelCareCode = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((d) => object({ id: number() }).parse(d)).handler(createSsrRpc("fb89a8d6273ca685953d37d5e5cc87f42141311a50aa10fd9d8a833e6318e0ef"));
var checkCode = createServerFn({ method: "POST" }).validator((d) => object({ code: string().min(4) }).parse(d)).handler(createSsrRpc("ed06310b55da17da21413832acda2035e98e5326b1ea7d37e83f696ae49c8cc0"));
var debitCode = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((d) => object({
	code: string(),
	percent: number().min(.1).max(100)
}).parse(d)).handler(createSsrRpc("56383b4bda24a4d087a1418c83ce6f9f3812cfd030eb26e2761421fec2f82234"));
var listTx = createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(createSsrRpc("88d7d0ebf61ca3f1b2f754b87a0d12fe70a3149c1b9aed5520498cc17df81ec8"));
var buyCard = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((d) => object({ cardType: _enum(["normal", "vip"]) }).parse(d)).handler(createSsrRpc("7e02fc3dbb7e247c663c63cfbdb2828c163e099d93f66464b3142f30b4e97181"));
var listCards = createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(createSsrRpc("851d1de9594eb18cce30e9f8ab18706018b75282287ffc73222e15e9ccf21889"));
var bookAppointment = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((d) => object({
	kind: _enum(["physical", "audio"]),
	minutes: number(),
	when: string(),
	notes: string().max(400).optional()
}).parse(d)).handler(createSsrRpc("2d466ddeb6366e23a7cdf396954ca55a00bec80d1b58d42081f85fb63d67feda"));
var listAppointments = createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(createSsrRpc("a93cecdd362c0fce82906298034f5649e4be68e80d742a5215c336ea0b826fbc"));
var listReferrals = createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(createSsrRpc("94e2710eb8e19203e6a19ba7286be9f784cbc8c7d7b123e84d941eae2977a082"));
var sendEnquiry = createServerFn({ method: "POST" }).validator((d) => object({
	name: string().min(2).max(80),
	email: string().email(),
	message: string().min(8).max(1e3)
}).parse(d)).handler(createSsrRpc("e25fb69c52598a11ba47c17d77bff4b2dfacc323258d25d899f2bef78b233894"));
var listUpdates = createServerFn({ method: "GET" }).handler(createSsrRpc("ce0f1bcb542ad03b9c71baa35154bc1b442ed26eae10d845499a289bd7b272d2"));
createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(createSsrRpc("55b0341b8f1ee3801102a782679719a833c61bb8222d79c4de4233bd453ae872"));
//#endregion
export { subscribeTier as _, debitCode as a, generateCareCode as c, listMyCodes as d, listReferrals as f, setUsername as g, sendEnquiry as h, checkCode as i, listAppointments as l, listUpdates as m, buyCard as n, ensureMember as o, listTx as p, cancelCareCode as r, fundWalletDemo as s, bookAppointment as t, listCards as u };
