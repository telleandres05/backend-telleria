import { Router } from 'express'
import ProductManager from '../managers/ProductManager.js'

const router = Router()
const manager = new ProductManager()

// GET / - Con paginación, filtros y ordenamiento
router.get('/', async (req, res) => {
  try {
    const { limit, page, sort, category, status, stock } = req.query
    
    // Preparar query object
    const query = {}
    if (category) query.category = category
    if (status) query.status = status
    if (stock) query.stock = stock
    
    // Preparar options object
    const options = {
      limit: limit ? parseInt(limit) : 10,
      page: page ? parseInt(page) : 1,
      sort: sort
    }
    
    const result = await manager.getProducts(query, options)
    
    if (result.status === 'error') {
      return res.status(500).json({
        status: 'error',
        message: result.message
      })
    }
    
    res.json(result)
    
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Error interno del servidor'
    })
  }
})

// GET /:pid 
router.get('/:pid', async (req, res) => {
  try {
    const product = await manager.getProductById(req.params.pid)
    
    if (!product) {
      return res.status(404).json({
        status: 'error',
        message: 'Producto no encontrado'
      })
    }
    
    res.json({
      status: 'success',
      payload: product
    })
  } catch (error) {
    const status = error.message.includes('inválido') ? 400 : 500
    res.status(status).json({
      status: 'error',
      message: error.message
    })
  }
})

// POST 
router.post('/', async (req, res) => {
  try {
    const newProduct = await manager.addProduct(req.body)
    
    res.status(201).json({
      status: 'success',
      payload: newProduct
    })
    
    // Emitir por socket para tiempo real
    if (req.io) {
      req.io.emit('productAdded', newProduct)
    }
    
  } catch (error) {
    const status = error.message.includes('validación') || 
                   error.message.includes('requerido') ||
                   error.message.includes('mayor') ? 400 : 500
    
    res.status(status).json({
      status: 'error',
      message: error.message
    })
  }
})

// PUT /:pid 
router.put('/:pid', async (req, res) => {
  try {
    const updatedProduct = await manager.updateProduct(req.params.pid, req.body)
    
    res.json({
      status: 'success',
      payload: updatedProduct
    })
    
    // Emitir por socket para tiempo real
    if (req.io) {
      req.io.emit('productUpdated', updatedProduct)
    }
    
  } catch (error) {
    let status = 500
    if (error.message.includes('no encontrado')) status = 404
    if (error.message.includes('inválido') || 
        error.message.includes('validación') || 
        error.message.includes('mayor')) status = 400
    
    res.status(status).json({
      status: 'error',
      message: error.message
    })
  }
})

// DELETE /:pid
router.delete('/:pid', async (req, res) => {
  try {
    const deleted = await manager.deleteProduct(req.params.pid)
    
    if (!deleted) {
      return res.status(404).json({
        status: 'error',
        message: 'Producto no encontrado'
      })
    }
    
    res.json({
      status: 'success',
      message: 'Producto eliminado exitosamente'
    })
    
    // Emitir por socket para tiempo real
    if (req.io) {
      req.io.emit('productDeleted', req.params.pid)
    }
    
  } catch (error) {
    const status = error.message.includes('inválido') ? 400 : 500
    res.status(status).json({
      status: 'error',
      message: error.message
    })
  }
})

export default router