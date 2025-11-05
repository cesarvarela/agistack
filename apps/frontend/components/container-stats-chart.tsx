"use client"

import { useEffect, useRef } from "react"
import {
	createChart,
	LineSeries,
	type IChartApi,
	type ISeriesApi,
	type Time,
} from "lightweight-charts"

interface DataSeries {
	name: string
	data: number[]
	color: string
}

interface ContainerStatsChartProps {
	title: string
	series: DataSeries[]
	timestamps: number[]
	unit: string
	height?: number
}

export function ContainerStatsChart({
	title,
	series,
	timestamps,
	unit,
	height = 200,
}: ContainerStatsChartProps) {
	const chartContainerRef = useRef<HTMLDivElement>(null)
	const chartRef = useRef<IChartApi | null>(null)
	const seriesRefs = useRef<Map<string, ISeriesApi<"Line">>>(new Map())

	// Initialize chart
	useEffect(() => {
		if (!chartContainerRef.current) return

		const chart = createChart(chartContainerRef.current, {
			width: chartContainerRef.current.clientWidth,
			height,
			layout: {
				background: { color: "transparent" },
				textColor: "#9ca3af",
			},
			grid: {
				vertLines: { color: "#374151" },
				horzLines: { color: "#374151" },
			},
			timeScale: {
				timeVisible: true,
				secondsVisible: true,
				borderColor: "#374151",
			},
			rightPriceScale: {
				borderColor: "#374151",
			},
		})

		chartRef.current = chart

		// Create series for each data series
		series.forEach((s) => {
			const lineSeries = chart.addSeries(LineSeries, {
				color: s.color,
				lineWidth: 2,
			})
			seriesRefs.current.set(s.name, lineSeries)
		})

		// Handle resize
		const handleResize = () => {
			if (chartContainerRef.current && chartRef.current) {
				chartRef.current.applyOptions({
					width: chartContainerRef.current.clientWidth,
				})
			}
		}

		window.addEventListener("resize", handleResize)

		return () => {
			window.removeEventListener("resize", handleResize)
			chart.remove()
			seriesRefs.current.clear()
		}
	}, [height, series.length]) // Recreate if number of series changes

	// Update chart data
	useEffect(() => {
		if (!chartRef.current || timestamps.length === 0) return

		series.forEach((s) => {
			const lineSeries = seriesRefs.current.get(s.name)
			if (!lineSeries) return

			// Convert to time series data and deduplicate by keeping the last value for each second
			const dataMap = new Map<number, number>()
			timestamps.forEach((timestamp, i) => {
				const timeInSeconds = Math.floor(timestamp / 1000)
				dataMap.set(timeInSeconds, s.data[i] ?? 0)
			})

			// Convert map to sorted array
			const data = Array.from(dataMap.entries())
				.sort(([a], [b]) => a - b)
				.map(([time, value]) => ({
					time: time as Time,
					value,
				}))

			lineSeries.setData(data)
		})

		// Fit content to visible range
		chartRef.current.timeScale().fitContent()
	}, [series, timestamps])

	return (
		<div className="space-y-2">
			<div className="flex items-center justify-between">
				<h3 className="text-sm font-medium text-gray-300">{title}</h3>
				<span className="text-xs text-gray-500">{unit}</span>
			</div>
			<div ref={chartContainerRef} className="rounded border border-gray-700 bg-gray-900/50" />
		</div>
	)
}
