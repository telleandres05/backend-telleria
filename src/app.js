import express from 'express'
import productsRouter from './routes/products.router.js'
import cartsRouter from './routes/carts.router.js'

const app = express()
app.use(express.json())

app.use('/api/products', productsRouter)
app.use('/api/carts', cartsRouter)

app.listen(8080, () => {
  console.log('Servidor escuchando en puerto 8080')
});

app.get('/', (req, res) => {
  res.send('🚀 API de productos y carritos funcionando')
});