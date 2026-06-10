const websiteId = import.meta.env.VITE_UMAMI_WEBSITE_ID?.trim();
const scriptUrl =
  import.meta.env.VITE_UMAMI_SCRIPT_URL?.trim() ||
  "https://cloud.umami.is/script.js";

let scriptLoad: Promise<void> | null = null;

export function isUmamiEnabled(): boolean {
  return Boolean(websiteId);
}

function loadUmamiScript(): Promise<void> {
  if (!websiteId || typeof document === "undefined") {
    return Promise.resolve();
  }

  if (scriptLoad) {
    return scriptLoad;
  }

  scriptLoad = new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(
      `script[data-website-id="${websiteId}"]`,
    );
    if (existing) {
      if (existing.dataset.loaded === "true") {
        resolve();
        return;
      }
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener(
        "error",
        () => reject(new Error("Umami script failed to load")),
        { once: true },
      );
      return;
    }

    const script = document.createElement("script");
    script.defer = true;
    script.src = scriptUrl;
    script.dataset.websiteId = websiteId;
    script.setAttribute("data-website-id", websiteId);
    script.addEventListener(
      "load",
      () => {
        script.dataset.loaded = "true";
        resolve();
      },
      { once: true },
    );
    script.addEventListener(
      "error",
      () => reject(new Error("Umami script failed to load")),
      { once: true },
    );
    document.head.appendChild(script);
  });

  return scriptLoad;
}

export function initUmami(): void {
  void loadUmamiScript().catch((error) => {
    console.warn("Umami analytics failed to load", error);
  });
}

export async function trackUmamiPageview(url: string): Promise<void> {
  if (!websiteId) {
    return;
  }

  try {
    await loadUmamiScript();
    window.umami?.track((props) => ({ ...props, url }));
  } catch (error) {
    console.warn("Umami pageview failed", error);
  }
}
