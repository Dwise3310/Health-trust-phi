/**
 * Grok PWA / extensions injection disabled.
 * Health Trust is an independent project — no grok.com scripts or __grok assets.
 */
export default async function disabledGrokPwaMiddleware(
  _event: unknown,
  next: () => unknown | Promise<unknown>,
): Promise<unknown> {
  return next();
}
