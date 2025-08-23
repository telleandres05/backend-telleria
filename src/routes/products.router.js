import { Router } from 'express'
import ProductManager from '../managers/ProductManager.js'

const router = Router()
const manager = new ProductManager()

router.get('/', async (req, res) => {
  try {
    const products = await manager.getProducts()
    res.json(products)
  } catch (err) {
    res.status(500).json({ error: 'Error interno del servidor' })
  }
})

router.get('/:pid', async (req, res) => {
  try {
    const product = await manager.getProductById(req.params.pid)
    if (!product) {
      return res.status(404).json({ error: 'Producto no encontrado' })
    }
    res.json(product)
  } catch (err) {
    res.status(500).json({ error: 'Error interno del servidor' })
  }
})

router.post('/', async (req, res) => {
  try {
    const { title, description, code, price, status = true, stock, category, thumbnails = [] } = req.body

    if (!title || !description || !code || price == null || stock == null || !category) {
      return res.status(400).json({ error: 'Todos los campos son obligatorios' })
    }

    const products = await manager.getProducts()
    if (products.some(p => p.code === code)) {
      return res.status(400).json({ error: 'El código ya existe' })
    }

    const productData = { title, description, code, price, status, stock, category, thumbnails }
    const newProduct = await manager.addProduct(productData)
    
    // Emitir cambio
    const io = req.app.get('io')
    if (io) {
      const updatedProducts = await manager.getProducts()
      io.emit('products', updatedProducts)
    }

    res.status(201).json(newProduct)
  } catch (err) {
    res.status(500).json({ error: 'Error interno del servidor' })
  }
})

router.put('/:pid', async (req, res) => {
  try {
    const updates = { ...req.body }
    
    if ('id' in updates) {
      delete updates.id
    }

    if (updates.code) {
      const products = await manager.getProducts()
      const codeExists = products.some(p => p.code === updates.code && String(p.id) !== String(req.params.pid))
      if (codeExists) {
        return res.status(400).json({ error: 'El código ya existe' })
      }
    }

    const updatedProduct = await manager.updateProduct(req.params.pid, updates)
    if (!updatedProduct) {
      return res.status(404).json({ error: 'Producto no encontrado' })
    }

    // Emitir cambio via
    const io = req.app.get('io')
    if (io) {
      const updatedProducts = await manager.getProducts()
      io.emit('products', updatedProducts)
    }

    res.json(updatedProduct)
  } catch (err) {
    res.status(500).json({ error: 'Error interno del servidor' })
  }
})

router.delete('/:pid', async (req, res) => {
  try {
    const deleted = await manager.deleteProduct(req.params.pid)
    if (!deleted) {
      return res.status(404).json({ error: 'Producto no encontrado' })
    }

    // Emitir cambio
    const io = req.app.get('io')
    if (io) {
      const updatedProducts = await manager.getProducts()
      io.emit('products', updatedProducts)
    }

    res.status(204).send()
  } catch (err) {
    res.status(500).json({ error: 'Error interno del servidor' })
  }
})

export default router