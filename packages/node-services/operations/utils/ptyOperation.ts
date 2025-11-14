import * as pty from "node-pty"

/**
 * Options for PTY execution
 */
export interface PtyOptions {
	/** Terminal columns (defaults to 120) */
	cols?: number
	/** Terminal rows (defaults to 30) */
	rows?: number
}

/**
 * Command configuration returned by buildCommand
 */
export interface CommandConfig {
	command: string
	args: string[]
	cwd?: string
	env?: Record<string, string>
}

/**
 * Creates a stream function for PTY-based streaming operations
 *
 * Returns only the stream function - the operation object is constructed in the operation file.
 * This keeps metadata visible and the factory focused on execution logic.
 *
 * @example
 * ```ts
 * export const streamLogsOperation: StreamOperation = {
 *   metadata: { name, description, inputSchema, outputSchema, cancellable: true },
 *   stream: createPtyStream((input) => ({
 *     command: "docker",
 *     args: ["logs", "--follow", input.dockerId]
 *   }))
 * }
 * ```
 */
export function createPtyStream<TInput>(
	buildCommand: (input: TInput) => CommandConfig,
	options: PtyOptions = {},
): (input: TInput, signal?: AbortSignal) => AsyncGenerator<{ output: string }> {
	const { cols = 120, rows = 30 } = options

	return async function* (input: TInput, signal?: AbortSignal): AsyncGenerator<{ output: string }> {
		let ptyProcess: pty.IPty | null = null

		try {
			// Build command and arguments
			const { command, args, cwd, env } = buildCommand(input)

			// Create PTY process
			ptyProcess = pty.spawn(command, args, {
				name: "xterm-color",
				cols,
				rows,
				cwd: cwd || process.cwd(),
				env: (env || process.env) as Record<string, string>,
			})

			// Create a promise-based queue for chunks
			const chunks: string[] = []
			let resolveNext: ((value: string | null) => void) | null = null
			let finished = false

			// Set up data handler
			ptyProcess.onData((data) => {
				if (resolveNext) {
					resolveNext(data)
					resolveNext = null
				} else {
					chunks.push(data)
				}
			})

			// Set up exit handler
			ptyProcess.onExit(() => {
				finished = true
				if (resolveNext) {
					resolveNext(null)
					resolveNext = null
				}
			})

			// Set up abort handler
			const abortHandler = () => {
				if (ptyProcess) {
					ptyProcess.kill()
				}
			}

			signal?.addEventListener("abort", abortHandler)

			// Async generator loop
			while (!finished || chunks.length > 0) {
				let chunk: string | null

				if (chunks.length > 0) {
					const shiftedChunk = chunks.shift()
					chunk = shiftedChunk ?? null
				} else if (!finished) {
					chunk = await new Promise<string | null>((resolve) => {
						resolveNext = resolve
					})
				} else {
					break
				}

				if (chunk) {
					yield { output: chunk }
				}
			}

			signal?.removeEventListener("abort", abortHandler)
		} catch (error) {
			// PTY process was killed or errored
			if (signal?.aborted) {
				// Operation cancelled by user
			} else {
				throw error
			}
		} finally {
			// Cleanup
			if (ptyProcess) {
				ptyProcess.kill()
			}
		}
	}
}

/**
 * Output context passed to parseOutput
 */
export interface OutputContext {
	stdout: string
	stderr: string
	exitCode: number
}

/**
 * Creates an execute function for PTY-based JSON operations
 *
 * Spawns a PTY, collects all stdout and stderr, then parses it with the provided parser.
 * Use for operations that return JSON (like `docker inspect`).
 *
 * @example
 * ```ts
 * export const inspectOperation: HttpOperation = {
 *   metadata: { name, description, inputSchema, outputSchema },
 *   execute: createPtyExecute(
 *     (input) => ({ command: "docker", args: ["inspect", input.dockerId] }),
 *     (input, { stdout }) => ({ dockerId: input.dockerId, inspect: JSON.parse(stdout)[0] })
 *   )
 * }
 * ```
 */
export function createPtyExecute<TInput, TOutput>(
	buildCommand: (input: TInput) => CommandConfig,
	parseOutput: (input: TInput, output: OutputContext) => TOutput,
	options: PtyOptions = {},
): (input: TInput) => Promise<TOutput> {
	const { cols = 120, rows = 30 } = options

	return async (input: TInput): Promise<TOutput> => {
		return new Promise((resolve, reject) => {
			const { command, args, cwd, env } = buildCommand(input)
			let stdout = ""
			const stderr = ""

			// Create PTY process
			const ptyProcess = pty.spawn(command, args, {
				name: "xterm-color",
				cols,
				rows,
				cwd: cwd || process.cwd(),
				env: (env || process.env) as Record<string, string>,
			})

			// Collect stdout (PTY combines stdout and stderr into one stream)
			// For true stderr separation, we'd need to spawn without PTY
			// But PTY is needed for proper terminal emulation (colors, formatting)
			ptyProcess.onData((data) => {
				stdout += data
			})

			// Handle exit
			ptyProcess.onExit(({ exitCode }) => {
				try {
					const result = parseOutput(input, { stdout, stderr, exitCode })
					resolve(result)
				} catch (error) {
					// Truncate stdout if too long (keep first 500 chars)
					const truncatedOutput = stdout.length > 500 ? `${stdout.slice(0, 500)}... (truncated)` : stdout
					const commandStr = `${command} ${args.join(" ")}`

					reject(
						new Error(
							`Failed to parse output from command '${commandStr}'\n` +
							`Exit code: ${exitCode}\n` +
							`Output: ${truncatedOutput}\n` +
							`Parse error: ${error instanceof Error ? error.message : "Unknown error"}`,
						),
					)
				}
			})
		})
	}
}
