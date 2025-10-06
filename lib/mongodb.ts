import { MongoClient, ServerApiVersion } from "mongodb"

if (!process.env.MONGODB_URI) {
  throw new Error("Please add your Mongo URI to .env.local")
}

const uri = process.env.MONGODB_URI

const options = {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
  // Add connection timeout settings
  connectTimeoutMS: 10000, // 10 seconds
  socketTimeoutMS: 45000,  // 45 seconds
  // Add retry settings
  retryWrites: true,
  retryReads: true,
  // Connection pool settings
  maxPoolSize: 50,
  minPoolSize: 10,
  maxIdleTimeMS: 60000,
}

let client: MongoClient
let clientPromise: Promise<MongoClient>

async function connectWithRetry(): Promise<MongoClient> {
  const maxRetries = 3
  let lastError
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      const client = new MongoClient(uri, options)
      await client.connect()
      await client.db("admin").command({ ping: 1 }) // Test the connection
      return client
    } catch (error) {
      lastError = error
      console.warn(`MongoDB connection attempt ${i + 1} failed:`, error)
      // Wait before retrying (exponential backoff)
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, i) * 1000))
    }
  }
  
  throw new Error(`Failed to connect to MongoDB after ${maxRetries} attempts: ${lastError}`)
}

if (process.env.NODE_ENV === "development") {
  const globalWithMongo = global as typeof globalThis & {
    _mongoClientPromise?: Promise<MongoClient>
  }

  if (!globalWithMongo._mongoClientPromise) {
    globalWithMongo._mongoClientPromise = connectWithRetry()
  }
  clientPromise = globalWithMongo._mongoClientPromise
} else {
  clientPromise = connectWithRetry()
}

export default clientPromise
