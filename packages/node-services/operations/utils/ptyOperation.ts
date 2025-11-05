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
	buildCommand: (input: TInput) => { command: string; args: string[] },
	options: PtyOptions = {},
): (input: TInput, signal?: AbortSignal) => AsyncGenerator<{ output: string }> {
	const { cols = 120, rows = 30 } = options

	return async function* (input: TInput, signal?: AbortSignal): AsyncGenerator<{ output: string }> {
		let ptyProcess: pty.IPty | null = null

		try {
			// Build command and arguments
			const { command, args } = buildCommand(input)

			// Create PTY process
			ptyProcess = pty.spawn(command, args, {
				name: "xterm-color",
				cols,
				rows,
				cwd: process.cwd(),
				env: process.env as Record<string, string>,
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
					chunk = chunks.shift()!
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
 * Creates an execute function for PTY-based JSON operations
 *
 * Spawns a PTY, collects all stdout, then parses it with the provided parser.
 * Use for operations that return JSON (like `docker inspect`).
 *
 * @example
 * ```ts
 * export const inspectOperation: HttpOperation = {
 *   metadata: { name, description, inputSchema, outputSchema },
 *   execute: createPtyExecute(
 *     (input) => ({ command: "docker", args: ["inspect", input.dockerId] }),
 *     (input, stdout) => ({ dockerId: input.dockerId, inspect: JSON.parse(stdout)[0] })
 *   )
 * }
 * ```
 */
export function createPtyExecute<TInput, TOutput>(
	buildCommand: (input: TInput) => { command: string; args: string[] },
	parseOutput: (input: TInput, stdout: string) => TOutput,
	options: PtyOptions = {},
): (input: TInput) => Promise<TOutput> {
	const { cols = 120, rows = 30 } = options

	return async (input: TInput): Promise<TOutput> => {
		return new Promise((resolve, reject) => {
			const { command, args } = buildCommand(input)
			let stdout = ""
			const stderr = ""

			// Create PTY process
			const ptyProcess = pty.spawn(command, args, {
				name: "xterm-color",
				cols,
				rows,
				cwd: process.cwd(),
				env: process.env as Record<string, string>,
			})

			// Collect stdout
			ptyProcess.onData((data) => {
				stdout += data
			})

			// Handle exit
			ptyProcess.onExit(({ exitCode }) => {
				if (exitCode === 0) {
					try {
						const result = parseOutput(input, stdout)
						resolve(result)
					} catch (error) {
						reject(
							new Error(
								`Failed to parse output: ${error instanceof Error ? error.message : "Unknown error"}`,
							),
						)
					}
				} else {
					reject(new Error(`Command failed with exit code ${exitCode}: ${stderr || stdout}`))
				}
			})
		})
	}
}
