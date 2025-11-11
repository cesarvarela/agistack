import { Node } from "@agistack/node-api"
import { NODE_PORT } from "@agistack/node-api/constants"
import dotenv from "dotenv"
import env from "./env"

dotenv.config({ path: "../../.env.local" })

;(async () => {
	const node = new Node(NODE_PORT, env.AGENT_SECRET)

	await node.start()

	console.log("node started")
})()
