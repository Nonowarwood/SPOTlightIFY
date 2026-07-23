import { select } from "d3-selection";
import { arc, pie } from "d3-shape";
import { categoricalColor } from "../../lib/theme.ts";
import { responsiveSvg, showTooltip, hideTooltip, renderEmptyState } from "./chart-utils.ts";

export interface GenreSlice {
  name: string;
  minutes: number;
}

export function renderGenreDonut(container: HTMLElement, slices: GenreSlice[], size = 220): void {
  if (slices.length === 0) {
    renderEmptyState(container, "Pas encore assez de données.");
    return;
  }

  const total = slices.reduce((sum, s) => sum + s.minutes, 0);

  responsiveSvg(container, size, (svgEl, width, height) => {
    const radius = Math.min(width, height) / 2 - 4;
    const g = select(svgEl).append("g").attr("transform", `translate(${width / 2},${height / 2})`);

    const pieGen = pie<GenreSlice>()
      .value((d) => d.minutes)
      .sort(null);
    const arcGen = arc<import("d3-shape").PieArcDatum<GenreSlice>>()
      .innerRadius(radius * 0.6)
      .outerRadius(radius);

    g.selectAll("path")
      .data(pieGen(slices))
      .join("path")
      .attr("d", arcGen)
      .attr("fill", (_d, i) => categoricalColor(i))
      .attr("stroke", "var(--color-page)")
      .attr("stroke-width", 2)
      .style("cursor", "pointer")
      .on("mousemove", (event: MouseEvent, d) => {
        const pct = Math.round((d.data.minutes / total) * 100);
        showTooltip(event.clientX, event.clientY, `<strong>${d.data.name}</strong><br/>${pct}%`);
      })
      .on("mouseleave", () => hideTooltip());
  });

  renderLegend(container, slices);
}

function renderLegend(container: HTMLElement, slices: GenreSlice[]): void {
  const total = slices.reduce((sum, s) => sum + s.minutes, 0);
  const legend = document.createElement("div");
  legend.className = "chart-legend";
  slices.forEach((s, i) => {
    const pct = Math.round((s.minutes / total) * 100);
    const item = document.createElement("span");
    item.className = "chart-legend-item";
    item.innerHTML = `<span class="chart-legend-swatch" style="background:${categoricalColor(i)}"></span>${s.name} (${pct}%)`;
    legend.appendChild(item);
  });
  container.appendChild(legend);
}
