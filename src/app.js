import express from 'express'
import handlebars from 'express-handlebars'
import { Server } from 'socket.io'
import { createServer } from 'http'
import productsRouter from './routes/products.router.js'
import cartsRouter from './routes/carts.router.js'
import viewsRouter from './routes/views.router.js'
import ProductManager from './managers/ProductManager.js'

const app = express()
const PORT = 8080
const server = createServer(app)
const io = new Server(server)
const productManager = new ProductManager()

// Handlebars
app.engine('handlebars', handlebars.engine())
app.set('views', './src/views')
app.set('view engine', 'handlebars')

// Middlewares
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(express.static('./src/public'))

// Rutas
app.use('/api/products', productsRouter)
app.use('/api/carts', cartsRouter)
app.use('/', viewsRouter)

// Socket
io.on('connection', (socket) => {
  console.log('Cliente conectado')

  // Enviar productos al conectar
  socket.on('requestProducts', async () => {
    try {
      const products = await productManager.getProducts()
      socket.emit('products', products)
    } catch (error) {
      socket.emit('error', 'Error al obtener productos')
    }
  })

  // Crear producto
  socket.on('createProduct', async (productData) => {
    try {
      const { title, description, code, price, status = true, stock, category, thumbnails = [] } = productData


      if (!title || !description || !code || price == null || stock == null || !category) {
        socket.emit('error', 'Todos los campos son obligatorios')
        return
      }

      // código duplicado
      const products = await productManager.getProducts()
      if (products.some(p => p.code === code)) {
        socket.emit('error', 'El código ya existe')
        return
      }

      const newProduct = await productManager.addProduct({
        title,
        description,
        code,
        price: Number(price),
        status,
        stock: Number(stock),
        category,
        thumbnails
      })

      // Emitir a todos los clientes
      const updatedProducts = await productManager.getProducts()
      io.emit('products', updatedProducts)
    } catch (error) {
      socket.emit('error', 'Error al crear producto')
    }
  })

  // Eliminar producto
  socket.on('deleteProduct', async (productId) => {
    try {
      const deleted = await productManager.deleteProduct(productId)
      if (deleted) {
        const updatedProducts = await productManager.getProducts()
        io.emit('products', updatedProducts)
      } else {
        socket.emit('error', 'Producto no encontrado')
      }
    } catch (error) {
      socket.emit('error', 'Error al eliminar producto')
    }
  })
})

// io globalmente para los routers
app.set('io', io)

server.listen(PORT, () => {
  console.log(`Servidor escuchando en puerto ${PORT}`)
})