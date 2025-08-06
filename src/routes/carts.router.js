import { Router } from 'express'
import CartManager from '../managers/CartManager.js'
import ProductManager from '../managers/ProductManager.js'

const router = Router()
const cartManager = new CartManager()
const productManager = new ProductManager()

router.post('/', async (req, res) => {
  try {
    const cart = await cartManager.createCart()
    res.status(201).json(cart)
  } catch (err) {
    res.status(500).json({ error: 'Error creando carrito' })
  }
})

router.get('/:cid', async (req, res) => {
  try {
    const cart = await cartManager.getCartById(req.params.cid)
    if (!cart) return res.status(404).json({ error: 'Carrito no encontrado' })
    res.json(cart.products)
  } catch (err) {
    res.status(500).json({ error: 'Error leyendo carrito' })
  }
})

router.post('/:cid/product/:pid', async (req, res) => {
  try {
    const product = await productManager.getProductById(req.params.pid)
    if (!product) return res.status(404).json({ error: 'Producto no encontrado' })
    if (product.stock <= 0) return res.status(400).json({ error: 'Producto sin stock' })
    const updatedCart = await cartManager.addProductToCart(req.params.cid, req.params.pid)
    if (!updatedCart) return res.status(404).json({ error: 'Carrito no encontrado' })
    res.json(updatedCart)
  } catch (err) {
    res.status(500).json({ error: 'Error agregando producto al carrito' })
  }
})

export default router
