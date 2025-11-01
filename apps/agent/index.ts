import { Node } from "@agistack/node-api"

;(async () => {
	const node = new Node()

	await node.start()

	console.log("node started")
})()
