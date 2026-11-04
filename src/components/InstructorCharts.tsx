import { useEffect, useRef, useState } from "react";
import { fontMedium, fontRegular, fontSemi } from "../fonts";

function useWidth() {
  const ref = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(800);
  useEffect(() => {
    if (!ref.current) return;
    const observer = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width));
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);
  return { ref, width };
}

const MARGIN = { top: 8, right: 8, bottom: 32, left: 64 };
const tickClass = `fill-[#475569] text-[12px] ${fontRegular}`;

export type ChartSeries = { key: string; label: string; color: string; values: number[] };

function Axes({ width, height, plotHeight, months, ticks, yMax, tickLabel }: { width: number; height: number; plotHeight: number; months: string[]; ticks: number[]; yMax: number; tickLabel: (t: number) => string }) {
  const band = (width - MARGIN.left - MARGIN.right) / months.length;
  return (
    <>
      {ticks.map((t) => {
        const y = MARGIN.top + plotHeight * (1 - t / yMax);
        return (
          <g key={t}>
            {t > 0 && <line x1={MARGIN.left} x2={width - MARGIN.right} y1={y} y2={y} stroke="#e2e8f0" strokeDasharray="3 3" />}
            <text x={MARGIN.left - 14} y={y + 4} textAnchor="end" className={tickClass}>
              {tickLabel(t)}
            </text>
          </g>
        );
      })}
      {months.map((m, i) => {
        const x = MARGIN.left + band * (i + 0.5);
        return (
          <g key={m}>
            <line x1={x} x2={x} y1={MARGIN.top} y2={MARGIN.top + plotHeight} stroke="#e2e8f0" strokeDasharray="3 3" />
            {(band >= 58 || i % 2 === 0) && (
              <text x={x} y={height - 8} textAnchor="middle" className={tickClass}>
                {m}
              </text>
            )}
          </g>
        );
      })}
      <line x1={MARGIN.left} x2={MARGIN.left} y1={MARGIN.top} y2={MARGIN.top + plotHeight} stroke="#94a3b8" />
      <line x1={MARGIN.left} x2={width - MARGIN.right} y1={MARGIN.top + plotHeight} y2={MARGIN.top + plotHeight} stroke="#94a3b8" />
    </>
  );
}

function ChartTooltip({ x, width, title, rows }: { x: number; width: number; title: string; rows: { label: string; color: string; value: string }[] }) {
  const left = Math.min(Math.max(x + 12, 0), width - 170);
  return (
    <div className="pointer-events-none absolute top-2 z-10 w-[158px] rounded-[8px] bg-[#1e293b] px-3 py-2 text-[12px] leading-[18px] text-white shadow-[0_8px_24px_rgba(15,23,42,0.2)]" style={{ left }}>
      <p className={fontSemi}>{title}</p>
      {rows.map((r) => (
        <p key={r.label} className={`mt-0.5 flex items-center gap-1.5 ${fontRegular}`}>
          <span className="h-[3px] w-3 shrink-0 rounded-full" style={{ backgroundColor: r.color }} />
          <span className="flex-1 truncate">{r.label}</span>
          <span className={fontMedium}>{r.value}</span>
        </p>
      ))}
    </div>
  );
}

export function LineChart({ months, series, yMax, ticks, height = 216, markers, tickLabel, valueLabel }: { months: string[]; series: ChartSeries[]; yMax: number; ticks: number[]; height?: number; markers?: boolean; tickLabel: (t: number) => string; valueLabel: (v: number) => string }) {
  const { ref, width } = useWidth();
  const [hover, setHover] = useState<number | null>(null);
  const plotHeight = height - MARGIN.top - MARGIN.bottom;
  const band = (width - MARGIN.left - MARGIN.right) / months.length;
  const xAt = (i: number) => MARGIN.left + band * (i + 0.5);
  const yAt = (v: number) => MARGIN.top + plotHeight * (1 - v / yMax);
  const baseline = MARGIN.top + plotHeight;
  const backToFront = [...series].sort((a, b) => Math.max(...b.values) - Math.max(...a.values));

  return (
    <div ref={ref} className="relative w-full" onMouseLeave={() => setHover(null)}>
      <svg
        width={width}
        height={height}
        role="img"
        aria-label={`Line chart of ${series.map((s) => s.label).join(", ") || "no series"} from ${months[0]} to ${months[months.length - 1]}`}
        onMouseMove={(e) => {
          const x = e.clientX - e.currentTarget.getBoundingClientRect().left;
          const i = Math.floor((x - MARGIN.left) / band);
          setHover(i >= 0 && i < months.length ? i : null);
        }}
      >
        <defs>
          {series.map((s) => (
            <linearGradient key={s.key} id={`area-${s.key}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor={s.color} stopOpacity="0.2" />
              <stop offset="1" stopColor={s.color} stopOpacity="0.01" />
            </linearGradient>
          ))}
        </defs>
        <Axes width={width} height={height} plotHeight={plotHeight} months={months} ticks={ticks} yMax={yMax} tickLabel={tickLabel} />
        {backToFront.map((s) => {
          const points = s.values.map((v, i) => `${xAt(i)},${yAt(v)}`).join(" L");
          return (
            <g key={s.key}>
              <path d={`M${xAt(0)},${baseline} L${points} L${xAt(s.values.length - 1)},${baseline} Z`} fill={`url(#area-${s.key})`} />
              <path d={`M${points}`} fill="none" stroke={s.color} strokeWidth="2" strokeLinejoin="round" />
              {markers && s.values.map((v, i) => <circle key={i} cx={xAt(i)} cy={yAt(v)} r="4" fill="#fff" stroke={s.color} strokeWidth="2" />)}
            </g>
          );
        })}
        {hover !== null && (
          <g>
            <line x1={xAt(hover)} x2={xAt(hover)} y1={MARGIN.top} y2={baseline} stroke="#64748b" />
            {series.map((s) => (
              <circle key={s.key} cx={xAt(hover)} cy={yAt(s.values[hover])} r="4" fill={s.color} stroke="#fff" strokeWidth="2" />
            ))}
          </g>
        )}
      </svg>
      {hover !== null && series.length > 0 && <ChartTooltip x={xAt(hover)} width={width} title={months[hover]} rows={series.map((s) => ({ label: s.label, color: s.color, value: valueLabel(s.values[hover]) }))} />}
    </div>
  );
}

export function BarChart({ months, values, color, yMax, ticks, height = 264, tickLabel, valueLabel }: { months: string[]; values: number[]; color: string; yMax: number; ticks: number[]; height?: number; tickLabel: (t: number) => string; valueLabel: (v: number) => string }) {
  const { ref, width } = useWidth();
  const [hover, setHover] = useState<number | null>(null);
  const plotHeight = height - MARGIN.top - MARGIN.bottom;
  const band = (width - MARGIN.left - MARGIN.right) / months.length;
  const barWidth = Math.min(19, band * 0.6);
  return (
    <div ref={ref} className="relative w-full" onMouseLeave={() => setHover(null)}>
      <svg width={width} height={height} role="img" aria-label={`Bar chart of monthly rating from ${months[0]} to ${months[months.length - 1]}`}>
        <Axes width={width} height={height} plotHeight={plotHeight} months={months} ticks={ticks} yMax={yMax} tickLabel={tickLabel} />
        {values.map((v, i) => {
          const barHeight = plotHeight * (v / yMax);
          const x = MARGIN.left + band * (i + 0.5) - barWidth / 2;
          const y = MARGIN.top + plotHeight - barHeight;
          return (
            <g key={months[i]} onMouseEnter={() => setHover(i)}>
              <rect x={MARGIN.left + band * i} y={MARGIN.top} width={band} height={plotHeight} fill="transparent" />
              <path d={`M${x},${y + barHeight} V${y + 2} Q${x},${y} ${x + 2},${y} H${x + barWidth - 2} Q${x + barWidth},${y} ${x + barWidth},${y + 2} V${y + barHeight} Z`} fill={color} opacity={hover === null || hover === i ? 1 : 0.55} />
            </g>
          );
        })}
      </svg>
      {hover !== null && <ChartTooltip x={MARGIN.left + band * (hover + 0.5)} width={width} title={months[hover]} rows={[{ label: "Rating", color, value: valueLabel(values[hover]) }]} />}
    </div>
  );
}

export function Donut({ segments, center }: { segments: { label: string; color: string; value: number }[]; center: string }) {
  const [hover, setHover] = useState<number | null>(null);
  const size = 250;
  const stroke = 48;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const total = segments.reduce((sum, s) => sum + s.value, 0);
  let offset = 0;
  return (
    <div className="relative mx-auto size-[250px] max-w-full">
      <svg viewBox={`0 0 ${size} ${size}`} className="size-full -rotate-90" role="img" aria-label={`Donut chart: ${segments.map((s) => `${s.label} $${s.value.toFixed(2)}`).join(", ")}`} onMouseLeave={() => setHover(null)}>
        {segments.length === 0 && <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#e2e8f0" strokeWidth={stroke} />}
        {segments.map((s, i) => {
          const length = (s.value / total) * circumference;
          const dash = `${length} ${circumference - length}`;
          const dashOffset = -offset;
          offset += length;
          return <circle key={s.label} cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={s.color} strokeWidth={hover === i ? stroke + 4 : stroke} strokeDasharray={dash} strokeDashoffset={dashOffset} className="transition-[stroke-width]" onMouseEnter={() => setHover(i)} />;
        })}
      </svg>
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
        {hover !== null && <span className={`text-[12px] leading-[18px] text-[#64748b] ${fontRegular}`}>{segments[hover]?.label}</span>}
        <span className="font-['Instrument_Sans:Bold'] text-[24px] font-bold leading-[32px] text-[#0f172a]">{hover !== null && segments[hover] ? `$${segments[hover].value.toFixed(2)}` : center}</span>
      </div>
    </div>
  );
}
