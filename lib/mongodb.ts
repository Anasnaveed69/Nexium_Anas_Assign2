import { MongoClient } from 'mongodb'

let client: MongoClient
let clientPromise: Promise<MongoClient>

function getClientPromise(): Promise<MongoClient> {
  const uri = process.env.MONGODB_URI
  
  if (!uri) {
    return Promise.reject(new Error('MONGODB_URI environment variable is not set'))
  }

  if (process.env.NODE_ENV === 'development') {
    // In development mode, use a global variable so that the value
    // is preserved across module reloads caused by HMR (Hot Module Replacement).
    let globalWithMongo = global as typeof globalThis & {
      _mongoClientPromise?: Promise<MongoClient>
    }

    if (!globalWithMongo._mongoClientPromise) {
      client = new MongoClient(uri)
      globalWithMongo._mongoClientPromise = client.connect()
    }
    return globalWithMongo._mongoClientPromise
  } else {
    // In production mode, it's best to not use a global variable.
    client = new MongoClient(uri)
    return client.connect()
  }
}

// Export a function that returns the promise, not the promise itself
export default getClientPromise 