// Minimal static-assets Worker for geez-art. The app is a zero-backend Vite
// build (dist/); this Worker exists only so `wrangler deploy` serves those
// assets on the Workers platform (which honors public/_headers for the CSP).
// There is no app logic here by design.
export default {
  async fetch(request: Request, env: { ASSETS: { fetch: (req: Request) => Promise<Response> } }): Promise<Response> {
    return env.ASSETS.fetch(request);
  },
};
