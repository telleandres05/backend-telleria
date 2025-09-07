
import mongoose from 'mongoose'

const connectDB = async () => {
  try {
    await mongoose.connect('mongodb://localhost:27017/ecommerce', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    })
    console.log('✅ Conectado a MongoDB exitosamente')
  } catch (error) {
    console.error('❌ Error al conectar a MongoDB:', error.message)
    process.exit(1)
  }
}

export default connectDB