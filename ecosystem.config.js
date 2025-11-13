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
				NODE_SECRET: process.env.NODE_SECRET,
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
				NODE_SECRET: process.env.NODE_SECRET,
			},
			time: true,
		},
		{
			name: "node",
			cwd: "/app/apps/node",
			script: "pnpm",
			args: "start",
			env: {
				NODE_ENV: "production",
				NODE_SECRET: process.env.NODE_SECRET,
			},
			time: true,
		},
	],
}
