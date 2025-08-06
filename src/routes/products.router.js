import { Router } from 'express'
import ProductManager from '../managers/ProductManager.js'

const router = Router()
const manager = new ProductManager()

router.get('/', async (req, res) => {
  try {
    const products = await manager.getProducts()
    res.json(products)
  } catch (err) {
    res.status(500).json({ error: 'Error leyendo productos' })
  }
})

router.get('/:pid', async (req, res) => {
  try {
    const product = await manager.getProductById(req.params.pid)
    if (!product) return res.status(404).json({ error: 'Producto no encontrado' })
    res.json(product)
  } catch (err) {
    res.status(500).json({ error: 'Error buscando producto' })
  }
})

router.post('/', async (req, res) => {
  try {
    const { title, description, code, price, status = true, stock, category, thumbnails = [] } = req.body
    if (!title || !description || !code || price == null || stock == null || !category) {
      return res.status(400).json({ error: 'Faltan campos requeridos' })
    }
    if (typeof price !== 'number' || typeof stock !== 'number') {
      return res.status(400).json({ error: 'price y stock deben ser números' })
    }
    const created = await manager.addProduct({ title, description, code, price, status, stock, category, thumbnails })
    res.status(201).json(created)
  } catch (err) {
    if (err.message === 'Codigo de producto duplicado') return res.status(400).json({ error: err.message })
    res.status(500).json({ error: 'Error creando producto' })
  }
})

router.put('/:pid', async (req, res) => {
  try {
    const updates = { ...req.body }
    if ('id' in updates) delete updates.id
    const updated = await manager.updateProduct(req.params.pid, updates)
    if (!updated) return res.status(404).json({ error: 'Producto no encontrado' })
    res.json(updated)
  } catch (err) {
    if (err.message === 'Codigo de producto duplicado') return res.status(400).json({ error: err.message })
    res.status(500).json({ error: 'Error actualizando producto' })
  }
})

router.delete('/:pid', async (req, res) => {
  try {
    const deleted = await manager.deleteProduct(req.params.pid)
    if (!deleted) return res.status(404).json({ error: 'Producto no encontrado' })
    res.status(204).send()
  } catch (err) {
    res.status(500).json({ error: 'Error eliminando producto' })
  }
})

export default router
