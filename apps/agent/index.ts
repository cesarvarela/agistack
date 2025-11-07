import { Node } from "@agistack/node-api"
import dotenv from "dotenv"
import env from "./env"

dotenv.config({ path: "../../.env.local" })

;(async () => {
	const node = new Node(env.AGENT_PORT)

	await node.start()

	console.log("node started")
})()
