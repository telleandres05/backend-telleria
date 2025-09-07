import { Router } from 'express'
import ProductManager from '../managers/ProductManager.js'

const router = Router()
const manager = new ProductManager()

// GET / - Con paginación, filtros y ordenamiento
router.get('/', async (req, res) => {
  try {
    const { limit, page, sort, query: queryParam } = req.query
    
    // Parsear query para filtros
    const query = {}
    if (queryParam) {
      // Si es una categoría
      if (typeof queryParam === 'string' && !['true', 'false', 'available', 'unavailable'].includes(queryParam)) {
        query.category = queryParam
      }
      // Si es disponibilidad por status
      else if (queryParam === 'true' || queryParam === 'false') {
        query.status = queryParam
      }
      // Si es disponibilidad por stock
      else if (queryParam === 'available' || queryParam === 'unavailable') {
        query.stock = queryParam
      }
    }

    const options = {
      limit: limit ? parseInt(limit) : 10,
      page: page ? parseInt(page) : 1,
      sort: sort === 'asc' || sort === 'desc' ? sort : undefined,
      query: Object.keys(query).length > 0 ? query : undefined
    }

    const result = await manager.getProducts(options)
    
    if (result.status === 'error') {
      return res.status(500).json(result)
    }

    // Agregar parámetros de query a los links si existen
    let baseUrl = '/api/products?'
    const params = []
    
    if (limit) params.push(`limit=${limit}`)
    if (sort) params.push(`sort=${sort}`)
    if (queryParam) params.push(`query=${queryParam}`)
    
    if (params.length > 0) {
      baseUrl += params.join('&') + '&'
    }

    // Actualizar links con parámetros
    if (result.prevLink) {
      result.prevLink = result.prevLink.replace('/api/products?', baseUrl)
    }
    if (result.nextLink) {
      result.nextLink = result.nextLink.replace('/api/products?', baseUrl)
    }

    res.json(result)
  } catch (error) {
    res.status(500).json({ 
      status: 'error',
      message: 'Error interno del servidor' 
    })
  }
})

// GET /:pid - Obtener producto por ID
router.get('/', async (req, res) => {
  try {
    const { limit, page, sort, query: queryParam } = req.query
    // ... resto del código
    res.json(result)
  } catch (error) {
    res.status(500).json({ 
      status: 'error',
      message: 'Error interno del servidor' 
    })
  }
})

// POST / - Crear producto
router.post('/', async (req, res) => {
  try {
    const { title, description, code, price, status = true, stock, category, thumbnails = [] } = req.body

    if (!title || !description || !code || price == null || stock == null || !category) {
      return res.status(400).json({ error: 'Todos los campos son obligatorios' })
    }

    const productData = { 
      title, 
      description, 
      code, 
      price: Number(price), 
      status, 
      stock: Number(stock), 
      category, 
      thumbnails 
    }
    
    const newProduct = await manager.addProduct(productData)
    
    // Emitir cambio via socket
    if (req.io) {
      const updatedProducts = await manager.getAllProducts()
      req.io.emit('products', updatedProducts)
    }

    res.status(201).json(newProduct)
  } catch (error) {
    const status = error.message.includes('código') ? 400 : 500
    res.status(status).json({ error: error.message })
  }
})

// PUT /:pid - Actualizar producto
router.put('/:pid', async (req, res) => {
  try {
    const updates = { ...req.body }
    
    // No permitir actualizar el ID
    if ('id' in updates) delete updates.id
    if ('_id' in updates) delete updates._id

    const updatedProduct = await manager.updateProduct(req.params.pid, updates)
    if (!updatedProduct) {
      return res.status(404).json({ error: 'Producto no encontrado' })
    }

    // Emitir cambio via socket
    if (req.io) {
      const updatedProducts = await manager.getAllProducts()
      req.io.emit('products', updatedProducts)
    }

    res.json(updatedProduct)
  } catch (error) {
    const status = error.message.includes('código') ? 400 : 500
    res.status(status).json({ error: error.message })
  }
})

// DELETE /:pid - Eliminar producto
router.delete('/:pid', async (req, res) => {
  try {
    const deleted = await manager.deleteProduct(req.params.pid)
    if (!deleted) {
      return res.status(404).json({ error: 'Producto no encontrado' })
    }

    // Emitir cambio via socket
    if (req.io) {
      const updatedProducts = await manager.getAllProducts()
      req.io.emit('products', updatedProducts)
    }

    res.status(204).send()
  } catch (error) {
    res.status(500).json({ error: 'Error interno del servidor' })
  }
})

export default router