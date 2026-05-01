import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
  ZAxis,
  ReferenceLine,
  LabelList,
} from "recharts";
import type { GenreBucket, QuadrantPoint, SequelBucket, YearBucket } from "@/lib/aggregations";
import type { Person } from "@/lib/types";

const NAVY = "hsl(207 88% 15%)";
const GOLD = "hsl(38 47% 46%)";
const RULE = "hsl(210 16% 82%)";
const INK = "hsl(210 45% 12%)";
const MUTED = "hsl(210 14% 38%)";

const tooltipStyle = {
  background: "hsl(0 0% 100%)",
  border: `1px solid ${RULE}`,
  borderRadius: 2,
  fontFamily: "Inter, sans-serif",
  fontSize: 12,
  color: INK,
  padding: "8px 10px",
};
const axisStyle = { fontSize: 11, fill: MUTED, fontFamily: "Inter" };

export function VolumeVsScoreChart({ data }: { data: YearBucket[] }) {
  return (
    <ResponsiveContainer width="100%" height={320}>
      <ComposedChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 5 }}>
        <CartesianGrid stroke={RULE} strokeDasharray="2 4" vertical={false} />
        <XAxis dataKey="year" tick={axisStyle} stroke={RULE} />
        <YAxis yAxisId="left" tick={axisStyle} stroke={RULE} label={{ value: "Films released", angle: -90, position: "insideLeft", style: axisStyle, offset: 10 }} />
        <YAxis yAxisId="right" orientation="right" domain={[0, 5]} tick={axisStyle} stroke={RULE} label={{ value: "Avg performance (1–9)", angle: 90, position: "insideRight", style: axisStyle, offset: 10 }} />
        <Tooltip contentStyle={tooltipStyle} />
        <Bar yAxisId="left" dataKey="count" fill={NAVY} name="Films" maxBarSize={26} />
        <Line yAxisId="right" type="monotone" dataKey="avgScore" stroke={GOLD} strokeWidth={2.5} dot={{ r: 4, fill: GOLD }} name="Avg score" />
      </ComposedChart>
    </ResponsiveContainer>
  );
}

export function SequelChart({ data }: { data: SequelBucket[] }) {
  // Show median + mean as grouped bars per bucket
  return (
    <ResponsiveContainer width="100%" height={320}>
      <BarChart data={data} margin={{ top: 20, right: 20, left: 0, bottom: 5 }}>
        <CartesianGrid stroke={RULE} strokeDasharray="2 4" vertical={false} />
        <XAxis dataKey="label" tick={axisStyle} stroke={RULE} />
        <YAxis domain={[0, 9]} tick={axisStyle} stroke={RULE} label={{ value: "hit/flop score", angle: -90, position: "insideLeft", style: axisStyle, offset: 10 }} />
        <Tooltip contentStyle={tooltipStyle} formatter={(v: number, name: string, p) => {
          if (name === "n") return [p.payload.count, "Films in bucket"];
          return [Number(v).toFixed(2), name];
        }} />
        <Bar dataKey="median" name="Median" fill={NAVY} maxBarSize={56}>
          <LabelList dataKey="median" position="top" formatter={(v: number) => v.toFixed(1)} style={{ fontSize: 11, fill: INK, fontFamily: "Inter" }} />
        </Bar>
        <Bar dataKey="mean" name="Mean" fill={GOLD} maxBarSize={56}>
          <LabelList dataKey="mean" position="top" formatter={(v: number) => v.toFixed(1)} style={{ fontSize: 11, fill: INK, fontFamily: "Inter" }} />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

export function GenreScatter({ data }: { data: GenreBucket[] }) {
  const overallAvg = data.reduce((a, b) => a + b.avgScore, 0) / Math.max(1, data.length);
  return (
    <ResponsiveContainer width="100%" height={360}>
      <ScatterChart margin={{ top: 20, right: 30, left: 10, bottom: 30 }}>
        <CartesianGrid stroke={RULE} strokeDasharray="2 4" />
        <XAxis type="number" dataKey="count" name="Volume" tick={axisStyle} stroke={RULE} label={{ value: "Films in genre", position: "insideBottom", offset: -10, style: axisStyle }} />
        <YAxis type="number" dataKey="avgScore" name="Avg score" domain={[0, 9]} tick={axisStyle} stroke={RULE} label={{ value: "Avg hit/flop", angle: -90, position: "insideLeft", style: axisStyle }} />
        <ZAxis range={[60, 60]} />
        <ReferenceLine y={overallAvg} stroke={GOLD} strokeDasharray="4 4" label={{ value: "Industry avg", position: "right", style: { fontSize: 10, fill: GOLD, fontFamily: "Inter" } }} />
        <Tooltip contentStyle={tooltipStyle} cursor={{ strokeDasharray: "3 3" }} formatter={(v: number, name) => [Number(v).toFixed(2), name]} labelFormatter={() => ""} />
        <Scatter data={data} fill={NAVY}>
          <LabelList dataKey="genre" position="right" style={{ fontSize: 10, fill: INK, fontFamily: "Inter" }} />
        </Scatter>
      </ScatterChart>
    </ResponsiveContainer>
  );
}

export function StarQuadrant({ data }: { data: QuadrantPoint[] }) {
  const xMid = 5;
  const yMid = 5;
  return (
    <ResponsiveContainer width="100%" height={400}>
      <ScatterChart margin={{ top: 20, right: 30, left: 10, bottom: 30 }}>
        <CartesianGrid stroke={RULE} strokeDasharray="2 4" />
        <XAxis type="number" dataKey="google" domain={[0, 10]} tick={axisStyle} stroke={RULE} label={{ value: "Google search rank →", position: "insideBottom", offset: -10, style: axisStyle }} />
        <YAxis type="number" dataKey="rating" domain={[0, 10]} tick={axisStyle} stroke={RULE} label={{ value: "Critical rating →", angle: -90, position: "insideLeft", style: axisStyle }} />
        <ZAxis type="number" dataKey="movies" range={[40, 320]} />
        <ReferenceLine x={xMid} stroke={RULE} />
        <ReferenceLine y={yMid} stroke={RULE} />
        <Tooltip contentStyle={tooltipStyle} formatter={(v: number, name) => [Number(v).toFixed(2), name]} labelFormatter={() => ""} />
        <Scatter data={data} fill={NAVY} fillOpacity={0.7}>
          {data.map((d, i) => (
            <Cell key={i} fill={d.rating >= yMid && d.google >= xMid ? GOLD : NAVY} />
          ))}
          <LabelList dataKey="name" position="top" style={{ fontSize: 9, fill: INK, fontFamily: "Inter" }} />
        </Scatter>
      </ScatterChart>
    </ResponsiveContainer>
  );
}

export function DirectorBar({ data }: { data: Person[] }) {
  const formatted = data.map((d) => ({
    name: d.name,
    rating: d.normalizedRating,
    movies: d.movieCount,
  }));
  return (
    <ResponsiveContainer width="100%" height={Math.max(320, formatted.length * 32)}>
      <BarChart data={formatted} layout="vertical" margin={{ top: 5, right: 60, left: 80, bottom: 5 }}>
        <CartesianGrid stroke={RULE} strokeDasharray="2 4" horizontal={false} />
        <XAxis type="number" domain={[0, 10]} tick={axisStyle} stroke={RULE} />
        <YAxis type="category" dataKey="name" tick={{ ...axisStyle, fontSize: 12 }} stroke={RULE} width={140} />
        <Tooltip contentStyle={tooltipStyle} formatter={(v: number, name) => [Number(v).toFixed(2), name]} />
        <Bar dataKey="rating" fill={NAVY} name="Rating (0–10)" maxBarSize={20}>
          <LabelList
            dataKey="movies"
            position="right"
            formatter={(v: number) => `${v} films`}
            style={{ fontSize: 11, fill: MUTED, fontFamily: "Inter" }}
          />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
