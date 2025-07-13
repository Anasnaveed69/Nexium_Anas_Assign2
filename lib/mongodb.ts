// Lazy MongoDB connection to avoid build-time issues
async function getClientPromise() {
  // Only import MongoDB when this function is called
  const { MongoClient } = await import('mongodb')
  
  const uri = process.env.MONGODB_URI
  
  if (!uri) {
    throw new Error('MONGODB_URI environment variable is not set')
  }

  // MongoDB Atlas connection options with proper SSL configuration
  const options = {
    maxPoolSize: 10,
    serverSelectionTimeoutMS: 10000,
    socketTimeoutMS: 45000,
    // Modern TLS options for MongoDB Atlas
    tls: true,
    tlsAllowInvalidHostnames: false,
  }

  if (process.env.NODE_ENV === 'development') {
    // In development mode, use a global variable so that the value
    // is preserved across module reloads caused by HMR (Hot Module Replacement).
    let globalWithMongo = global as typeof globalThis & {
      _mongoClientPromise?: Promise<any>
    }

    if (!globalWithMongo._mongoClientPromise) {
      const client = new MongoClient(uri, options)
      globalWithMongo._mongoClientPromise = client.connect()
    }
    return globalWithMongo._mongoClientPromise
  } else {
    // In production mode, it's best to not use a global variable.
    const client = new MongoClient(uri, options)
    return client.connect()
  }
}

// Export the async function
export default getClientPromise 