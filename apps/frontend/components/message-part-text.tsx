"use client"

import type React from "react"
import { useState } from "react"
import ReactMarkdown from "react-markdown"
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter"
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism"
import remarkGfm from "remark-gfm"
import { Button } from "@/components/ui/button"
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table"

interface MessagePartTextProps {
	text: string
}

function LogsRenderer({ content }: { content: string }) {
	const [copied, setCopied] = useState(false)
	const lines = content.split("\n").filter((line) => line.trim())

	const handleCopy = async () => {
		await navigator.clipboard.writeText(content)
		setCopied(true)
		setTimeout(() => setCopied(false), 2000)
	}

	return (
		<div className="not-prose my-2">
			<div className="bg-gray-900 dark:bg-black rounded-lg overflow-hidden border border-gray-700">
				<div className="flex items-center justify-between px-3 py-2 bg-gray-800 dark:bg-gray-900 border-b border-gray-700">
					<span className="text-xs text-gray-400 font-mono">
						{lines.length} {lines.length === 1 ? "line" : "lines"}
					</span>
					<Button
						onClick={handleCopy}
						variant="ghost"
						size="sm"
						className="h-6 px-2 text-xs text-gray-400 hover:text-gray-200"
					>
						{copied ? "Copied!" : "Copy"}
					</Button>
				</div>
				<div className="max-h-96 overflow-auto">
					<pre className="p-4 text-sm font-mono leading-relaxed">
						{lines.map((line, index) => (
							<div key={`${index}-${line.slice(0, 20)}`} className="flex">
								<span
									className="text-gray-500 select-none mr-4 text-right"
									style={{ minWidth: "3ch" }}
								>
									{index + 1}
								</span>
								<span className="text-gray-200">{line}</span>
							</div>
						))}
					</pre>
				</div>
			</div>
		</div>
	)
}

export function MessagePartText({ text }: MessagePartTextProps) {
	return (
		<div className="prose prose-sm dark:prose-invert max-w-none">
			<ReactMarkdown
				remarkPlugins={[remarkGfm]}
				components={{
					code({
						className,
						children,
						...props
					}: React.HTMLProps<HTMLElement> & { className?: string }) {
						const inline = !className
						const match = /language-(\w+)/.exec(className || "")
						const codeContent = String(children).replace(/\n$/, "")

						// Special handling for logs
						if (!inline && match && match[1] === "logs") {
							return <LogsRenderer content={codeContent} />
						}

						return !inline && match ? (
							<div className="not-prose">
								<SyntaxHighlighter
									// biome-ignore lint/suspicious/noExplicitAny: SyntaxHighlighter style type is complex
									style={vscDarkPlus as any}
									language={match[1]}
									PreTag="div"
									customStyle={{
										margin: 0,
										borderRadius: "0.375rem",
										fontSize: "0.875rem",
									}}
								>
									{codeContent}
								</SyntaxHighlighter>
							</div>
						) : (
							<code
								className="px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-sm"
								{...props}
							>
								{children}
							</code>
						)
					},
					a({ children, href, ...props }) {
						return (
							<a
								href={href}
								target="_blank"
								rel="noopener noreferrer"
								className="text-blue-600 dark:text-blue-400 hover:underline"
								{...props}
							>
								{children}
							</a>
						)
					},
					pre({ children }) {
						return <div className="not-prose">{children}</div>
					},
					table({ children }) {
						return (
							<div className="not-prose my-4">
								<Table>{children}</Table>
							</div>
						)
					},
					thead({ children }) {
						return <TableHeader>{children}</TableHeader>
					},
					tbody({ children }) {
						return <TableBody>{children}</TableBody>
					},
					tr({ children }) {
						return <TableRow>{children}</TableRow>
					},
					th({ children }) {
						return <TableHead>{children}</TableHead>
					},
					td({ children }) {
						return <TableCell>{children}</TableCell>
					},
				}}
			>
				{text}
			</ReactMarkdown>
		</div>
	)
}
