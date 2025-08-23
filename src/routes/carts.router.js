import { Router } from 'express'
import CartManager from '../managers/CartManager.js'
import ProductManager from '../managers/ProductManager.js'

const router = Router()
const cartManager = new CartManager()
const productManager = new ProductManager()

// POST  Crear nuevo carrito
router.post('/', async (req, res) => {
  try {
    const newCart = await cartManager.createCart()
    res.status(201).json(newCart)
  } catch (err) {
    res.status(500).json({ error: 'Error interno del servidor' })
  }
})

// GET 
router.get('/:cid', async (req, res) => {
  try {
    const cart = await cartManager.getCartById(req.params.cid)
    if (!cart) {
      return res.status(404).json({ error: 'Carrito no encontrado' })
    }
    res.json(cart.products)
  } catch (err) {
    res.status(500).json({ error: 'Error interno del servidor' })
  }
})

// POST 
router.post('/:cid/product/:pid', async (req, res) => {
  try {
    // Verificar que el producto existe
    const product = await productManager.getProductById(req.params.pid)
    if (!product) {
      return res.status(404).json({ error: 'Producto no encontrado' })
    }

    // Agregar producto al carrito
    const updatedCart = await cartManager.addProductToCart(req.params.cid, req.params.pid)
    if (!updatedCart) {
      return res.status(404).json({ error: 'Carrito no encontrado' })
    }

    res.json(updatedCart)
  } catch (err) {
    res.status(500).json({ error: 'Error interno del servidor' })
  }
})

export default router