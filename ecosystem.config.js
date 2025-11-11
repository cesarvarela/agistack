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
				OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY,
				OPENROUTER_MODEL: process.env.OPENROUTER_MODEL,
				AGENT_SECRET: process.env.AGENT_SECRET,
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
				DATABASE_PATH: "/app/data/db.sqlite",
				OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY,
				OPENROUTER_MODEL: process.env.OPENROUTER_MODEL,
				AGENT_SECRET: process.env.AGENT_SECRET,
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
				AGENT_SECRET: process.env.AGENT_SECRET,
			},
			time: true,
		},
	],
}
