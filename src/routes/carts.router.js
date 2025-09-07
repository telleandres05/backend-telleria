import { Router } from 'express'
import CartManager from '../managers/CartManager.js'

const router = Router()
const manager = new CartManager()

// POST / - Crear carrito
router.post('/', async (req, res) => {
  try {
    const newCart = await manager.createCart()
    res.status(201).json(newCart)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// GET /:cid - Obtener carrito por ID con productos completos (populate)
router.get('/:cid', async (req, res) => {
  try {
    const cart = await manager.getCartById(req.params.cid)
    if (!cart) {
      return res.status(404).json({ error: 'Carrito no encontrado' })
    }
    res.json(cart)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// POST /:cid/product/:pid - Agregar producto al carrito
router.post('/:cid/product/:pid', async (req, res) => {
  try {
    const { cid, pid } = req.params
    const { quantity = 1 } = req.body

    if (quantity <= 0) {
      return res.status(400).json({ error: 'La cantidad debe ser mayor a 0' })
    }

    const updatedCart = await manager.addProductToCart(cid, pid, Number(quantity))
    res.json(updatedCart)
  } catch (error) {
    const status = error.message.includes('no encontrado') ? 404 : 500
    res.status(status).json({ error: error.message })
  }
})

// DELETE /:cid/products/:pid - Eliminar producto específico del carrito
router.delete('/:cid/products/:pid', async (req, res) => {
  try {
    const { cid, pid } = req.params
    const updatedCart = await manager.removeProductFromCart(cid, pid)
    res.json(updatedCart)
  } catch (error) {
    const status = error.message.includes('no encontrado') ? 404 : 500
    res.status(status).json({ error: error.message })
  }
})

// PUT /:cid - Actualizar todo el carrito con un array de productos
router.put('/:cid', async (req, res) => {
  try {
    const { cid } = req.params
    const { products } = req.body

    if (!Array.isArray(products)) {
      return res.status(400).json({ 
        error: 'Se requiere un array de productos con formato: [{ product: "id", quantity: number }]' 
      })
    }

    // Validar formato de productos
    for (const item of products) {
      if (!item.product || typeof item.quantity !== 'number' || item.quantity <= 0) {
        return res.status(400).json({ 
          error: 'Cada producto debe tener formato: { product: "id", quantity: number }' 
        })
      }
    }

    const updatedCart = await manager.updateCart(cid, products)
    res.json(updatedCart)
  } catch (error) {
    const status = error.message.includes('no encontrado') ? 404 : 500
    res.status(status).json({ error: error.message })
  }
})

// PUT /:cid/products/:pid - Actualizar cantidad de un producto específico
router.put('/:cid/products/:pid', async (req, res) => {
  try {
    const { cid, pid } = req.params
    const { quantity } = req.body

    if (typeof quantity !== 'number' || quantity <= 0) {
      return res.status(400).json({ error: 'La cantidad debe ser un número mayor a 0' })
    }

    const updatedCart = await manager.updateProductQuantity(cid, pid, quantity)
    res.json(updatedCart)
  } catch (error) {
    const status = error.message.includes('no encontrado') ? 404 : 500
    res.status(status).json({ error: error.message })
  }
})

// DELETE /:cid - Eliminar todos los productos del carrito
router.delete('/:cid', async (req, res) => {
  try {
    const { cid } = req.params
    const clearedCart = await manager.clearCart(cid)
    res.json({ message: 'Carrito vaciado exitosamente', cart: clearedCart })
  } catch (error) {
    const status = error.message.includes('no encontrado') ? 404 : 500
    res.status(status).json({ error: error.message })
  }
})

export default router