module.exports = {
	apps: [
		{
			name: "frontend",
			cwd: "/app/apps/frontend",
			script: "pnpm",
			args: "start",
			env: {
				NODE_ENV: "production",
				PORT: "3000",
				AGENT_PORT: "14001",
				CONTROL_PLANE_PORT: "14002",
				NEXT_PUBLIC_CP_PORT: "14002",
				OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY,
				OPENROUTER_MODEL: process.env.OPENROUTER_MODEL,
			},
			time: true,
		},
		{
			name: "control-plane",
			cwd: "/app/apps/control-plane",
			script: "pnpm",
			args: "start",
			env: {
				NODE_ENV: "production",
				PORT: "14002",
				DATABASE_PATH: "/app/data/db.sqlite",
				OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY,
				OPENROUTER_MODEL: process.env.OPENROUTER_MODEL,
				AGENT_PORT: "14001",
				CONTROL_PLANE_PORT: "14002",
			},
			time: true,
		},
		{
			name: "agent",
			cwd: "/app/apps/agent",
			script: "pnpm",
			args: "start",
			env: {
				NODE_ENV: "production",
				PORT: "14001",
				AGENT_PORT: "14001",
			},
			time: true,
		},
	],
}
