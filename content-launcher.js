(() => {
  if (window.top !== window || document.getElementById("job-buddy-launcher-root")) return;

  const host = document.createElement("div");
  host.id = "job-buddy-launcher-root";
  host.setAttribute("data-job-buddy-ui", "launcher");

  const shadow = host.attachShadow({ mode: "closed" });
  const style = document.createElement("style");
  style.textContent = `
    :host { all: initial; position: fixed; z-index: 2147483646; top: 32vh; right: 12px; pointer-events: none; color-scheme: light dark; }
    button { pointer-events: auto; display: flex; align-items: center; gap: 8px; min-height: 42px; padding: 6px 12px 6px 7px; border: 1px solid rgba(255,255,255,.7); border-radius: 999px; background: rgba(226,238,248,.82); box-shadow: 0 10px 30px rgba(22,49,76,.18), inset 0 1px 0 rgba(255,255,255,.72); color: #142942; cursor: pointer; font: 650 13px/1 -apple-system,BlinkMacSystemFont,"Segoe UI","PingFang SC",sans-serif; letter-spacing: .01em; backdrop-filter: blur(14px) saturate(125%); -webkit-backdrop-filter: blur(14px) saturate(125%); opacity: .82; transform: translateX(4px); transition: opacity 160ms ease, transform 180ms ease, box-shadow 180ms ease; }
    button:hover, button:focus-visible { opacity: 1; transform: translateX(0); box-shadow: 0 14px 36px rgba(22,49,76,.24), inset 0 1px 0 rgba(255,255,255,.82); }
    button:focus-visible { outline: 3px solid rgba(78,132,222,.38); outline-offset: 3px; }
    button[data-state="opening"] { cursor: progress; opacity: .66; }
    img { width: 28px; height: 28px; flex: 0 0 28px; border-radius: 9px; }
    span { white-space: nowrap; }
    @media (prefers-color-scheme: dark) { button { border-color: rgba(174,205,232,.24); background: rgba(21,46,72,.84); color: #edf7ff; box-shadow: 0 12px 34px rgba(0,9,20,.34), inset 0 1px 0 rgba(255,255,255,.1); } }
    @media (max-width: 720px) { :host { right: 8px; } button { width: 42px; padding: 6px; overflow: hidden; } span { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0,0,0,0); } }
    @media (prefers-reduced-motion: reduce) { button { transition: none; } }
  `;

  const button = document.createElement("button");
  button.type = "button";
  button.title = "打开求职buddy侧边栏";
  button.setAttribute("aria-label", "打开求职buddy侧边栏");

  const icon = document.createElement("img");
  icon.src = chrome.runtime.getURL("icons/icon32.png");
  icon.alt = "";

  const label = document.createElement("span");
  const pageSignals = [location.pathname, document.title, document.querySelector('meta[property="og:title"]')?.content || ""].join(" ").toLowerCase();
  const hasJobSchema = [...document.querySelectorAll('script[type="application/ld+json"]')].some((node) => /"@type"\s*:\s*"JobPosting"/i.test(node.textContent || ""));
  const jobSignalCount = [/(?:^|[\/\s_-])(jobs?|careers?|positions?|recruit(?:ment)?)(?:[\/\s_-]|$)/i,/招聘|职位|岗位|实习|校招|社会招聘|job description|responsibilities|qualifications/i].filter((pattern) => pattern.test(pageSignals)).length;
  const looksLikeJob = hasJobSchema || jobSignalCount >= 2;
  label.textContent = looksLikeJob ? "识别这个岗位" : "求职buddy";

  button.append(icon, label);
  shadow.append(style, button);
  document.documentElement.appendChild(host);

  button.addEventListener("click", () => {
    if (button.dataset.state === "opening") return;
    button.dataset.state = "opening";
    chrome.runtime.sendMessage({ type: "open-side-panel", capture: looksLikeJob }, (response) => {
      button.dataset.state = "";
      if (chrome.runtime.lastError || !response?.ok) button.title = "请点击 Chrome 工具栏中的求职buddy图标";
    });
  });
})();
