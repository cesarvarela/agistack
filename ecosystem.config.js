module.exports = {
	apps: [
		{
			name: 'frontend',
			cwd: '/app/apps/frontend',
			script: 'pnpm',
			args: 'start',
			env: {
				NODE_ENV: 'production',
				PORT: '3000',
				NEXT_PUBLIC_CP_URL: process.env.NEXT_PUBLIC_CP_URL || 'http://localhost:4002'
			},
			error_file: '/dev/stderr',
			out_file: '/dev/stdout',
			time: true
		},
		{
			name: 'control-plane',
			cwd: '/app/apps/control-plane',
			script: 'pnpm',
			args: 'start',
			env: {
				NODE_ENV: 'production',
				PORT: '4002',
				DATABASE_PATH: process.env.DATABASE_PATH || '/app/data/db.sqlite',
				OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY,
				OPENROUTER_MODEL: process.env.OPENROUTER_MODEL
			},
			error_file: '/dev/stderr',
			out_file: '/dev/stdout',
			time: true
		},
		{
			name: 'agent',
			cwd: '/app/apps/agent',
			script: 'pnpm',
			args: 'start',
			env: {
				NODE_ENV: 'production',
				PORT: '4001'
			},
			error_file: '/dev/stderr',
			out_file: '/dev/stdout',
			time: true
		}
	]
}
