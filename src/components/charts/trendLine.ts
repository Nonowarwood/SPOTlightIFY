import { scaleLinear, scaleTime } from "d3-scale";
import { line as d3line, area as d3area, curveMonotoneX } from "d3-shape";
import { extent, max } from "d3-array";
import { select, pointer } from "d3-selection";
import "d3-transition"; // side-effect import: extends Selection.prototype with .transition()
import { easeCubicOut } from "d3-ease";
import { CATEGORICAL_COLORS } from "../../lib/theme.ts";
import { responsiveSvg, showTooltip, hideTooltip, renderEmptyState, DEFAULT_MARGIN } from "./chart-utils.ts";

export interface TrendSeriesPoint {
  date: Date;
  value: number;
}

export interface TrendSeries {
  name: string;
  points: TrendSeriesPoint[];
}

export interface TrendLineOptions {
  height?: number;
  /** Fill the space under the (first) series with a soft gradient — the
   *  dashboard-reference "area chart" look. */
  area?: boolean;
}

let gradientSeq = 0;

export function renderTrendLine(
  container: HTMLElement,
  series: TrendSeries[],
  formatValue: (n: number) => string,
  opts: TrendLineOptions = {},
): void {
  const height = opts.height ?? 260;
  const allPoints = series.flatMap((s) => s.points);
  if (allPoints.length === 0) {
    renderEmptyState(container, "Pas encore assez de données.");
    return;
  }

  responsiveSvg(container, height, (svgEl, width) => {
    const margin = DEFAULT_MARGIN;
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    const svg = select(svgEl);
    const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

    const [xMin, xMax] = extent(allPoints, (d) => d.date) as [Date, Date];
    const x = scaleTime().domain([xMin, xMax]).range([0, innerWidth]);
    const yMax = max(allPoints, (d) => d.value) ?? 1;
    const y = scaleLinear().domain([0, yMax * 1.1]).range([innerHeight, 0]).nice();

    // Gridlines
    g.append("g")
      .attr("class", "chart-gridline")
      .selectAll("line")
      .data(y.ticks(4))
      .join("line")
      .attr("x1", 0)
      .attr("x2", innerWidth)
      .attr("y1", (d) => y(d))
      .attr("y2", (d) => y(d));

    const lineGen = d3line<TrendSeriesPoint>()
      .x((d) => x(d.date))
      .y((d) => y(d.value))
      .curve(curveMonotoneX);

    if (opts.area && series[0]) {
      const gradId = `trend-area-grad-${gradientSeq++}`;
      const defs = svg.append("defs");
      const grad = defs
        .append("linearGradient")
        .attr("id", gradId)
        .attr("x1", "0")
        .attr("y1", "0")
        .attr("x2", "0")
        .attr("y2", "1");
      grad.append("stop").attr("offset", "0%").attr("stop-color", CATEGORICAL_COLORS[0]).attr("stop-opacity", 0.4);
      grad.append("stop").attr("offset", "100%").attr("stop-color", CATEGORICAL_COLORS[0]).attr("stop-opacity", 0);

      const areaGen = d3area<TrendSeriesPoint>()
        .x((d) => x(d.date))
        .y0(innerHeight)
        .y1((d) => y(d.value))
        .curve(curveMonotoneX);

      g.append("path")
        .datum(series[0].points)
        .attr("fill", `url(#${gradId})`)
        .attr("d", areaGen)
        .attr("opacity", 0)
        .transition()
        .duration(900)
        .ease(easeCubicOut)
        .attr("opacity", 1);
    }

    series.forEach((s, i) => {
      const color = CATEGORICAL_COLORS[i % CATEGORICAL_COLORS.length];
      const path = g
        .append("path")
        .datum(s.points)
        .attr("fill", "none")
        .attr("stroke", color)
        .attr("stroke-width", 2)
        .attr("d", lineGen);

      const totalLength = (path.node() as SVGPathElement).getTotalLength();
      path
        .attr("stroke-dasharray", `${totalLength} ${totalLength}`)
        .attr("stroke-dashoffset", totalLength)
        .transition()
        .duration(900)
        .ease(easeCubicOut)
        .attr("stroke-dashoffset", 0);
    });

    // Axes (minimal, chrome consistent with the rest of the site)
    const xAxisG = g.append("g").attr("class", "chart-axis").attr("transform", `translate(0,${innerHeight})`);
    const xTicks = x.ticks(Math.min(6, allPoints.length));
    xAxisG
      .selectAll("text")
      .data(xTicks)
      .join("text")
      .attr("x", (d) => x(d))
      .attr("y", 18)
      .attr("text-anchor", "middle")
      .text((d) => d.toLocaleDateString("fr-FR", { month: "short", day: "numeric" }));
    xAxisG.append("line").attr("class", "domain").attr("x1", 0).attr("x2", innerWidth).attr("y1", 0).attr("y2", 0);

    const yAxisG = g.append("g").attr("class", "chart-axis");
    yAxisG
      .selectAll("text")
      .data(y.ticks(4))
      .join("text")
      .attr("x", -10)
      .attr("y", (d) => y(d) + 4)
      .attr("text-anchor", "end")
      .text((d) => formatValue(d));

    // Hover interaction: nearest point across the primary series.
    const overlay = g
      .append("rect")
      .attr("width", innerWidth)
      .attr("height", innerHeight)
      .attr("fill", "transparent");

    const focusDot = g
      .append("circle")
      .attr("r", 4)
      .attr("fill", CATEGORICAL_COLORS[0])
      .style("opacity", 0);

    overlay.on("mousemove", (event) => {
      const [mx] = pointer(event);
      const date = x.invert(mx);
      const primary = series[0]?.points ?? [];
      if (primary.length === 0) return;
      let nearest = primary[0]!;
      let bestDist = Infinity;
      for (const p of primary) {
        const dist = Math.abs(p.date.getTime() - date.getTime());
        if (dist < bestDist) {
          bestDist = dist;
          nearest = p;
        }
      }
      focusDot.attr("cx", x(nearest.date)).attr("cy", y(nearest.value)).style("opacity", 1);
      const [pageX, pageY] = pointer(event, document.body);
      showTooltip(
        pageX,
        pageY,
        `<strong>${nearest.date.toLocaleDateString("fr-FR", { day: "numeric", month: "long" })}</strong><br/>${formatValue(nearest.value)}`,
      );
    });
    overlay.on("mouseleave", () => {
      focusDot.style("opacity", 0);
      hideTooltip();
    });
  });

  if (series.length > 1) renderLegend(container, series);
}

function renderLegend(container: HTMLElement, series: TrendSeries[]): void {
  const legend = document.createElement("div");
  legend.className = "chart-legend";
  series.forEach((s, i) => {
    const item = document.createElement("span");
    item.className = "chart-legend-item";
    item.innerHTML = `<span class="chart-legend-swatch" style="background:${CATEGORICAL_COLORS[i % CATEGORICAL_COLORS.length]}"></span>${s.name}`;
    legend.appendChild(item);
  });
  container.appendChild(legend);
}
