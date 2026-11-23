import base from "./playwright.config.ts";
export default {
  ...base,
  use: { ...base.use, baseURL: "http://127.0.0.1:5174" },
  webServer: {
    ...(base.webServer as object),
    command: "npm run dev -- --port 5174 --strictPort",
    url: "http://127.0.0.1:5174",
  },
};
