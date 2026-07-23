import { select } from "d3-selection";
import { sequentialColor } from "../../lib/theme.ts";
import { responsiveSvg, showTooltip, hideTooltip, renderEmptyState } from "./chart-utils.ts";

const DAY_LABELS = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

/** matrix[dayOfWeek 0=Mon..6=Sun][hour 0..23] = minutes listened */
export function renderHourDayHeatmap(container: HTMLElement, matrix: number[][]): void {
  const total = matrix.flat().reduce((a, b) => a + b, 0);
  if (total === 0) {
    renderEmptyState(container, "Pas encore assez de données.");
    return;
  }

  const max = Math.max(...matrix.flat(), 1);
  const labelWidth = 34;
  const height = 7 * 20 + 20;

  responsiveSvg(container, height, (svgEl, width) => {
    const cellWidth = (width - labelWidth) / 24;
    const cellHeight = 20;
    const svg = select(svgEl);
    const g = svg.append("g").attr("transform", `translate(${labelWidth}, 4)`);

    DAY_LABELS.forEach((label, dayIdx) => {
      svg
        .append("text")
        .attr("class", "chart-axis")
        .attr("x", 0)
        .attr("y", 4 + dayIdx * cellHeight + cellHeight / 2 + 3)
        .attr("font-size", "10px")
        .attr("fill", "var(--color-text-faint)")
        .text(label);

      for (let hour = 0; hour < 24; hour++) {
        const minutes = matrix[dayIdx]?.[hour] ?? 0;
        const rect = g
          .append("rect")
          .attr("x", hour * cellWidth)
          .attr("y", dayIdx * cellHeight)
          .attr("width", cellWidth - 2)
          .attr("height", cellHeight - 2)
          .attr("rx", 0)
          .attr("fill", minutes > 0 ? sequentialColor(minutes / max) : "var(--color-border)")
          .style("cursor", minutes > 0 ? "pointer" : "default");

        rect.on("mousemove", (event: MouseEvent) => {
          showTooltip(
            event.clientX,
            event.clientY,
            `<strong>${label} ${hour}h</strong><br/>${minutes} min`,
          );
        });
        rect.on("mouseleave", () => hideTooltip());
      }
    });

    // Hour axis, sparse ticks
    [0, 6, 12, 18, 23].forEach((hour) => {
      svg
        .append("text")
        .attr("class", "chart-axis")
        .attr("x", labelWidth + hour * cellWidth + cellWidth / 2)
        .attr("y", height - 4)
        .attr("font-size", "9px")
        .attr("text-anchor", "middle")
        .attr("fill", "var(--color-text-faint)")
        .text(`${hour}h`);
    });
  });
}
