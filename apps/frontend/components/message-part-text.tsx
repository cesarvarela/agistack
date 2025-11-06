"use client"

import type React from "react"
import ReactMarkdown from "react-markdown"
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter"
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism"
import remarkGfm from "remark-gfm"

interface MessagePartTextProps {
	text: string
}

export function MessagePartText({ text }: MessagePartTextProps) {
	return (
		<div className="prose prose-sm dark:prose-invert max-w-none">
			<ReactMarkdown
				remarkPlugins={[remarkGfm]}
				components={{
					code({ className, children, ...props }: any) {
						const inline = !className
						const match = /language-(\w+)/.exec(className || "")
						const codeContent = String(children).replace(/\n$/, "")

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
				}}
			>
				{text}
			</ReactMarkdown>
		</div>
	)
}
