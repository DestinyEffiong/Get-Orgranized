import mongoose from 'mongoose'

export const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/get-organized'
    
    await mongoose.connect(mongoUri)
    
    console.log('✓ MongoDB connected successfully')
    return mongoose.connection
  } catch (error) {
    console.error('✗ MongoDB connection failed:', error.message)
    process.exit(1)
  }
}

export default mongoose
