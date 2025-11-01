import type { NodeRegistry } from "../NodeRegistry"

export abstract class Action<TInput = unknown, TOutput = unknown> {
	constructor(
		protected db: any,
		protected nodeRegistry: NodeRegistry,
	) {}

	protected get metadata(): any {
		return (this.constructor as any).metadata
	}

	abstract execute(input: TInput): Promise<TOutput>
}
