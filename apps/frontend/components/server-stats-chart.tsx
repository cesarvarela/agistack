"use client"

import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts"

interface ServerStatsChartProps {
	title: string
	data: Array<{ timestamp: number; [key: string]: number }>
	dataKeys: Array<{ key: string; label: string; color: string }>
	unit?: string
	height?: number
	formatValue?: (value: number) => string
	windowSize?: number | "all"
}

export function ServerStatsChart({
	title,
	data,
	dataKeys,
	unit,
	height = 200,
	formatValue,
	windowSize = 60000,
}: ServerStatsChartProps) {
	// Create chart config for shadcn/ui
	const chartConfig = dataKeys.reduce(
		(config, { key, label, color }) => {
			config[key] = { label, color }
			return config
		},
		{} as Record<string, { label: string; color: string }>
	)

	return (
		<div className="space-y-2">
			<div className="flex items-center justify-between">
				<h3 className="text-sm font-medium">{title}</h3>
				{unit && <span className="text-xs text-muted-foreground">{unit}</span>}
			</div>
			<ChartContainer config={chartConfig} className="h-[200px] w-full">
				<LineChart data={data} height={height}>
					<CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
					<XAxis
						dataKey="timestamp"
						type="number"
						scale="time"
						domain={
							windowSize === "all"
								? ["dataMin", "dataMax"]
								: [(dataMin: number) => Math.max(dataMin, Date.now() - windowSize), "dataMax"]
						}
						allowDataOverflow={windowSize !== "all"}
						tickLine={false}
						axisLine={false}
						tickMargin={8}
						minTickGap={32}
						className="text-xs"
						tickFormatter={(unixTime) =>
							new Date(unixTime).toLocaleTimeString([], {
								hour: "2-digit",
								minute: "2-digit",
								second: "2-digit",
							})
						}
					/>
					<YAxis
						tickLine={false}
						axisLine={false}
						tickMargin={8}
						className="text-xs"
						tickFormatter={(value) => (formatValue ? formatValue(value) : value.toString())}
					/>
					<ChartTooltip
						content={
							<ChartTooltipContent
								labelFormatter={(label, payload) => {
									// Label will be the timestamp from XAxis dataKey
									if (payload?.[0]?.payload?.timestamp) {
										return new Date(payload[0].payload.timestamp).toLocaleString()
									}
									// Fallback: try to parse label as timestamp
									const timestamp = typeof label === "number" ? label : Number(label)
									if (!Number.isNaN(timestamp)) {
										return new Date(timestamp).toLocaleString()
									}
									return String(label)
								}}
								formatter={(value) => {
									const numValue = typeof value === "number" ? value : Number(value)
									return formatValue ? formatValue(numValue) : numValue.toFixed(1)
								}}
							/>
						}
					/>
					{dataKeys.map(({ key, color }) => (
						<Line
							key={key}
							type="monotone"
							dataKey={key}
							stroke={color}
							strokeWidth={2}
							dot={false}
							isAnimationActive={false}
						/>
					))}
				</LineChart>
			</ChartContainer>
		</div>
	)
}
