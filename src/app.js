import express from 'express'
import { engine } from 'express-handlebars'
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

// Configurar Handlebars con helpers necesarios
const hbs = engine({
  helpers: {
    eq: (a, b) => a === b,
    gt: (a, b) => a > b,
    gte: (a, b) => a >= b,
    lt: (a, b) => a < b,
    lte: (a, b) => a <= b,
    and: (a, b) => a && b,
    or: (a, b) => a || b,
    not: (a) => !a
  }
})

app.engine('handlebars', hbs)
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

// Socket - SOLO para escuchar conexiones y enviar datos iniciales
io.on('connection', (socket) => {
  console.log('Cliente conectado')
  
  // SOLO enviar productos al conectar
  socket.on('requestProducts', async () => {
    try {
      const products = await productManager.getAllProducts()
      socket.emit('products', products)
    } catch (error) {
      socket.emit('error', 'Error al obtener productos')
    }
  })
})

server.listen(PORT, () => {
  console.log(`🚀 Servidor escuchando en puerto ${PORT}`)
  console.log(`📱 Vistas: http://localhost:${PORT}`)
  console.log(`🔌 API: http://localhost:${PORT}/api/products`)
})