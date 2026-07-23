import { categoricalColor } from "../../lib/theme.ts";
import { renderEmptyState } from "./chart-utils.ts";

export interface TopListItem {
  label: string;
  sublabel?: string;
  value: number;
}

/** Ranked horizontal-bar list (top artists/tracks/albums/genres). */
export function renderTopList(
  container: HTMLElement,
  items: TopListItem[],
  formatValue: (n: number) => string,
): void {
  if (items.length === 0) {
    renderEmptyState(container, "Pas encore assez de données.");
    return;
  }

  const max = Math.max(...items.map((i) => i.value));
  container.innerHTML = "";
  const list = document.createElement("ol");
  list.className = "top-list";

  items.forEach((item, i) => {
    const li = document.createElement("li");
    li.className = "top-list-row";

    const rank = document.createElement("span");
    rank.className = "top-list-rank";
    rank.textContent = String(i + 1);

    const labels = document.createElement("span");
    labels.className = "top-list-labels";
    labels.innerHTML = `<span class="top-list-label">${escapeHtml(item.label)}</span>${
      item.sublabel ? `<span class="top-list-sublabel">${escapeHtml(item.sublabel)}</span>` : ""
    }`;

    const barTrack = document.createElement("span");
    barTrack.className = "top-list-bar-track";
    const bar = document.createElement("span");
    bar.className = "top-list-bar";
    bar.style.background = categoricalColor(i);
    bar.style.width = "0%";
    barTrack.appendChild(bar);
    requestAnimationFrame(() => {
      bar.style.width = `${(item.value / max) * 100}%`;
    });

    const value = document.createElement("span");
    value.className = "top-list-value tabular";
    value.textContent = formatValue(item.value);

    li.append(rank, labels, barTrack, value);
    list.appendChild(li);
  });

  container.appendChild(list);
  injectStylesOnce();
}

function escapeHtml(s: string): string {
  const div = document.createElement("div");
  div.textContent = s;
  return div.innerHTML;
}

let stylesInjected = false;
function injectStylesOnce(): void {
  if (stylesInjected) return;
  stylesInjected = true;
  const style = document.createElement("style");
  style.textContent = `
    .top-list { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 0.6rem; }
    .top-list-row { display: grid; grid-template-columns: 1.5rem minmax(0, 1fr) auto; align-items: center; gap: 0.75rem; }
    .top-list-rank { color: var(--color-text-faint); font-size: 0.8rem; text-align: right; }
    .top-list-labels { display: flex; flex-direction: column; min-width: 0; }
    .top-list-label { font-size: 0.9rem; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .top-list-sublabel { font-size: 0.75rem; color: var(--color-text-faint); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .top-list-bar-track { grid-column: 1 / -1; height: 6px; background: var(--color-border); border-radius: var(--radius-bar); overflow: hidden; order: 3; }
    .top-list-bar { display: block; height: 100%; border-radius: var(--radius-bar); transition: width 0.7s cubic-bezier(0.16, 1, 0.3, 1); }
    .top-list-value { font-size: 0.8rem; color: var(--color-text-muted); }
  `;
  document.head.appendChild(style);
}
