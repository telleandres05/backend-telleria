import express from 'express'
import handlebars from 'express-handlebars'
import { Server } from 'socket.io'
import { createServer } from 'http'
import connectDB from './config/database.js'
import productsRouter from './routes/products.router.js'
import cartsRouter from './routes/carts.router.js'
import viewsRouter from './routes/views.router.js'
import ProductManager from './managers/ProductManager.js'

const app = express()
const PORT = 8080
const server = createServer(app)
const io = new Server(server)
const productManager = new ProductManager()

// Conectar a MongoDB
connectDB()

// Configuración Handlebars con helpers mínimos
const hbs = handlebars.create({
  helpers: {
    eq: (a, b) => a === b,
    multiply: (a, b) => a * b
  }
})

app.engine('handlebars', hbs.engine)
app.set('views', './src/views')
app.set('view engine', 'handlebars')

// Middlewares
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(express.static('./src/public'))

// Middleware para pasar el socket server a los routers
app.use((req, res, next) => {
  req.io = io
  next()
})

// Rutas
app.use('/api/products', productsRouter)
app.use('/api/carts', cartsRouter)
app.use('/', viewsRouter)

// Socket.io
io.on('connection', (socket) => {
  console.log('Cliente conectado')

  socket.on('requestProducts', async () => {
    try {
      const products = await productManager.getAllProducts()
      socket.emit('products', products)
    } catch (error) {
      socket.emit('error', 'Error al obtener productos')
    }
  })
})

// Servidor
server.listen(PORT, () => {
  console.log(`🚀 Servidor escuchando en puerto ${PORT}`)
  console.log(`📱 Vistas: http://localhost:${PORT}`)
  console.log(`🔌 API: http://localhost:${PORT}/api/products`)
})
