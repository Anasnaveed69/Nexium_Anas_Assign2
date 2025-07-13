import { MongoClient } from 'mongodb'

// Test MongoDB connection with detailed error reporting
export async function testMongoDBConnection() {
  const uri = process.env.MONGODB_URI
  
  if (!uri) {
    console.error('❌ MONGODB_URI environment variable is not set')
    return false
  }

  console.log('🔍 Testing MongoDB connection...')
  console.log('📍 URI format check:', uri.includes('mongodb+srv://') ? '✅ Atlas format' : '❌ Not Atlas format')
  
  const options = {
    maxPoolSize: 10,
    serverSelectionTimeoutMS: 10000,
    socketTimeoutMS: 45000,
    // Modern TLS options for MongoDB Atlas
    tls: true,
    tlsAllowInvalidHostnames: false,
  }

  try {
    console.log('🔌 Attempting to connect...')
    const client = new MongoClient(uri, options)
    await client.connect()
    
    console.log('✅ Connected successfully!')
    
    // Test database access
    const db = client.db('blog_summarizer')
    await db.command({ ping: 1 })
    console.log('✅ Database ping successful!')
    
    await client.close()
    console.log('✅ Connection closed successfully!')
    return true
    
  } catch (error) {
    const err = error as Error
    console.error('❌ Connection failed:', err.message)
    
    // Provide specific troubleshooting advice
    if (err.message.includes('SSL') || err.message.includes('TLS')) {
      console.log('💡 SSL/TLS Issue - Try these solutions:')
      console.log('   1. Ensure your MongoDB Atlas cluster supports TLS 1.2+')
      console.log('   2. Check if your connection string includes ?ssl=true')
      console.log('   3. Verify your MongoDB driver version is up to date')
    } else if (err.message.includes('timeout')) {
      console.log('💡 Timeout Issue - Try these solutions:')
      console.log('   1. Check your network access settings in MongoDB Atlas')
      console.log('   2. Ensure your IP address is whitelisted')
      console.log('   3. Try connecting from a different network')
    } else if (err.message.includes('authentication')) {
      console.log('💡 Authentication Issue - Try these solutions:')
      console.log('   1. Verify your username and password in the connection string')
      console.log('   2. Check if your database user has the correct permissions')
      console.log('   3. Ensure the database name in the connection string is correct')
    }
    
    return false
  }
} 