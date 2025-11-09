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
				CONTROL_PLANE_PORT: process.env.CONTROL_PLANE_PORT,
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
				PORT: process.env.CONTROL_PLANE_PORT,
				DATABASE_PATH: "/app/data/db.sqlite",
				OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY,
				OPENROUTER_MODEL: process.env.OPENROUTER_MODEL,
				AGENT_PORT: process.env.AGENT_PORT,
				CONTROL_PLANE_PORT: process.env.CONTROL_PLANE_PORT,
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
				PORT: process.env.AGENT_PORT,
				AGENT_PORT: process.env.AGENT_PORT,
			},
			time: true,
		},
	],
}
