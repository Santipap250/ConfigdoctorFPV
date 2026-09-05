/**
 * Optional analytics loader (Umami).
 *
 * Analytics is not currently wired to any real endpoint in this project, so
 * this is intentionally a no-op unless BOTH `VITE_ANALYTICS_ENDPOINT` and
 * `VITE_ANALYTICS_WEBSITE_ID` are supplied at build time. There is no default
 * or fake endpoint here — an unconfigured environment loads nothing.
 *
 * Loading happens via a runtime-injected `<script type="module">` rather than
 * a static tag in index.html, which avoids Vite's `%VITE_*%` HTML placeholder
 * substitution (the previous approach produced an "undefined env var" build
 * warning, and a `%VITE_*%`-literal script src in production whenever the
 * vars were unset).
 */
export function initAnalytics(): void {
  const endpoint = import.meta.env.VITE_ANALYTICS_ENDPOINT;
  const websiteId = import.meta.env.VITE_ANALYTICS_WEBSITE_ID;

  if (!endpoint || !websiteId) {
    return;
  }

  const script = document.createElement("script");
  script.type = "module";
  script.defer = true;
  script.src = `${endpoint}/umami`;
  script.dataset.websiteId = websiteId;
  document.head.appendChild(script);
}
