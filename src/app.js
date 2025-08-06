import express from 'express'
import productsRouter from './routes/products.router.js'
import cartsRouter from './routes/carts.router.js'

const app = express()
const PORT = 8080

app.use(express.json())
app.use('/api/products', productsRouter)
app.use('/api/carts', cartsRouter)

app.get('/', (req, res) => {
  res.send('API de productos y carritos funcionando')
})

app.listen(PORT, () => {
  console.log(`Servidor escuchando en puerto ${PORT}`)
})
