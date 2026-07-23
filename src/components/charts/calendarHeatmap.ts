import { select } from "d3-selection";
import { timeDay, timeWeek } from "d3-time";
import { sequentialColor } from "../../lib/theme.ts";
import { showTooltip, hideTooltip, renderEmptyState } from "./chart-utils.ts";

export interface CalendarDay {
  date: string; // YYYY-MM-DD
  minutes: number;
}

const CELL = 11;
const GAP = 3;
const MONTH_LABEL_HEIGHT = 18;

export function renderCalendarHeatmap(container: HTMLElement, days: CalendarDay[]): void {
  if (days.length === 0) {
    renderEmptyState(container, "Pas encore assez de données.");
    return;
  }

  const byDate = new Map(days.map((d) => [d.date, d.minutes]));
  const dates = days.map((d) => new Date(d.date));
  const start = timeWeek.floor(new Date(Math.min(...dates.map((d) => d.getTime()))));
  const end = new Date(Math.max(...dates.map((d) => d.getTime())));
  const allDays = timeDay.range(start, timeDay.offset(end, 1));
  const maxMinutes = Math.max(...days.map((d) => d.minutes), 1);

  const weekCount = Math.ceil(allDays.length / 7) + 1;
  const width = weekCount * (CELL + GAP);
  const height = MONTH_LABEL_HEIGHT + 7 * (CELL + GAP);

  // Rendered at true pixel size (not stretched to fill the container, unlike
  // the other responsive charts) — a calendar heatmap's cells have a fixed,
  // legible size; the parent container scrolls horizontally when it overflows
  // (see the .scroll-x wrapper in patterns.astro), same as GitHub's contribution graph.
  container.innerHTML = "";
  const svgEl = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svgEl.setAttribute("width", String(width));
  svgEl.setAttribute("height", String(height));
  svgEl.setAttribute("viewBox", `0 0 ${width} ${height}`);
  container.appendChild(svgEl);

  {
    const svg = select(svgEl);
    const g = svg.append("g").attr("transform", `translate(0, ${MONTH_LABEL_HEIGHT})`);

    let lastMonth = -1;
    for (const day of allDays) {
      const weekIndex = timeWeek.count(start, day);
      const dayIndex = day.getDay();
      const key = toDateKey(day);
      const minutes = byDate.get(key) ?? 0;

      if (dayIndex === 0 && day.getMonth() !== lastMonth) {
        lastMonth = day.getMonth();
        svg
          .append("text")
          .attr("class", "chart-axis")
          .attr("x", weekIndex * (CELL + GAP))
          .attr("y", MONTH_LABEL_HEIGHT - 6)
          .attr("fill", "var(--color-text-faint)")
          .attr("font-size", "9px")
          .text(day.toLocaleDateString("fr-FR", { month: "short" }));
      }

      const rect = g
        .append("rect")
        .attr("x", weekIndex * (CELL + GAP))
        .attr("y", dayIndex * (CELL + GAP))
        .attr("width", CELL)
        .attr("height", CELL)
        .attr("rx", 2)
        .attr("fill", minutes > 0 ? sequentialColor(minutes / maxMinutes) : "var(--color-border)")
        .style("cursor", minutes > 0 ? "pointer" : "default");

      rect.on("mousemove", (event: MouseEvent) => {
        showTooltip(
          event.clientX,
          event.clientY,
          `<strong>${day.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}</strong><br/>${minutes} min`,
        );
      });
      rect.on("mouseleave", () => hideTooltip());
    }
  }
}

function toDateKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
