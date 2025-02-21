import NodeCache from "node-cache";

// Cache with a standard TTL of 300 seconds (5 minutes)
const cache = new NodeCache({ stdTTL: 300 });
export default cache;
