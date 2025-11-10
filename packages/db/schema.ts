import { relations } from "drizzle-orm"
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core"

export const nodes = sqliteTable("nodes", {
	id: text("id").primaryKey(),
	name: text("name").notNull(),
	url: text("url").notNull(),
	createdAt: integer("created_at", { mode: "timestamp" })
		.notNull()
		.$defaultFn(() => new Date()),
	updatedAt: integer("updated_at", { mode: "timestamp" })
		.notNull()
		.$defaultFn(() => new Date()),
})

export const containers = sqliteTable("containers", {
	id: text("id").primaryKey(),
	nodeId: text("node_id")
		.notNull()
		.references(() => nodes.id, { onDelete: "cascade" }),
	dockerId: text("docker_id").notNull().unique(),
	deployedBy: text("deployed_by"),
	deploymentConfig: text("deployment_config", { mode: "json" }).$type<{
		image?: string
		name?: string
		ports?: Record<string, number>
		env?: Record<string, string>
		volumes?: string[]
		labels?: Record<string, string>
	}>(),
	tags: text("tags", { mode: "json" }).$type<string[]>().default([]),
	notes: text("notes"),
	createdAt: integer("created_at", { mode: "timestamp" })
		.notNull()
		.$defaultFn(() => new Date()),
	updatedAt: integer("updated_at", { mode: "timestamp" })
		.notNull()
		.$defaultFn(() => new Date()),
})

export const conversations = sqliteTable("conversations", {
	id: text("id").primaryKey(),
	userId: text("user_id"),
	title: text("title").notNull(),
	createdAt: integer("created_at", { mode: "timestamp" })
		.notNull()
		.$defaultFn(() => new Date()),
	updatedAt: integer("updated_at", { mode: "timestamp" })
		.notNull()
		.$defaultFn(() => new Date()),
})

export const messages = sqliteTable("messages", {
	id: text("id").primaryKey(),
	conversationId: text("conversation_id")
		.notNull()
		.references(() => conversations.id, { onDelete: "cascade" }),
	role: text("role", { enum: ["user", "assistant", "system", "tool"] }).notNull(),
	content: text("content").notNull(),
	toolCalls: text("tool_calls", { mode: "json" }).$type<
		Array<{ id: string; name: string; arguments: Record<string, unknown>; result?: unknown }>
	>(),
	createdAt: integer("created_at", { mode: "timestamp" })
		.notNull()
		.$defaultFn(() => new Date()),
})

export const settings = sqliteTable("settings", {
	id: integer("id")
		.primaryKey({ autoIncrement: false })
		.$default(() => 1),
	allowedCommands: text("allowed_commands", { mode: "json" })
		.$type<string[]>()
		.notNull()
		.$default(() => [
			"docker",
			"ls",
			"cat",
			"grep",
			"ps",
			"df",
			"du",
			"pwd",
			"whoami",
			"uname",
			"tail",
			"head",
			"find",
			"wc",
			"curl",
			"ping",
			"netstat",
			"free",
			"uptime",
			"hostname",
			"which",
			"env",
		]),
	updatedAt: integer("updated_at", { mode: "timestamp" })
		.notNull()
		.$defaultFn(() => new Date()),
})

export const nodesRelations = relations(nodes, ({ many }) => ({ containers: many(containers) }))
export const containersRelations = relations(containers, ({ one }) => ({
	node: one(nodes, { fields: [containers.nodeId], references: [nodes.id] }),
}))
export const conversationsRelations = relations(conversations, ({ many }) => ({
	messages: many(messages),
}))
export const messagesRelations = relations(messages, ({ one }) => ({
	conversation: one(conversations, {
		fields: [messages.conversationId],
		references: [conversations.id],
	}),
}))

export type DBNode = typeof nodes.$inferSelect
export type NewDBNode = typeof nodes.$inferInsert
export type Container = typeof containers.$inferSelect
export type NewContainer = typeof containers.$inferInsert
export type Conversation = typeof conversations.$inferSelect
export type NewConversation = typeof conversations.$inferInsert
export type Message = typeof messages.$inferSelect
export type NewMessage = typeof messages.$inferInsert
export type Settings = typeof settings.$inferSelect
export type NewSettings = typeof settings.$inferInsert
