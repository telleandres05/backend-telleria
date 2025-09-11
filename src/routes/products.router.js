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
        query.status = queryParam === 'true'
      }
      // Si es disponibilidad por stock
      else if (queryParam === 'available') {
        query.stock = { $gt: 0 }
      }
      else if (queryParam === 'unavailable') {
        query.stock = 0
      }
    }

    const options = {
      limit: limit ? parseInt(limit) : 10,
      page: page ? parseInt(page) : 1,
      sort: sort === 'asc' || sort === 'desc' ? { price: sort === 'asc' ? 1 : -1 } : {},
      lean: true
    }

    const result = await manager.getProducts(query, options)
    
    if (result.status === 'error') {
      return res.status(500).json(result)
    }

    // Construir parámetros para los links
    const queryParams = new URLSearchParams()
    if (limit) queryParams.set('limit', limit)
    if (sort) queryParams.set('sort', sort)
    if (queryParam) queryParams.set('query', queryParam)
    
    const baseUrl = '/api/products'
    const queryString = queryParams.toString()

    // Construir response según formato requerido
    const response = {
      status: 'success',
      payload: result.docs,
      totalPages: result.totalPages,
      prevPage: result.prevPage,
      nextPage: result.nextPage,
      page: result.page,
      hasPrevPage: result.hasPrevPage,
      hasNextPage: result.hasNextPage,
      prevLink: result.hasPrevPage ? 
        `${baseUrl}?${queryString ? queryString + '&' : ''}page=${result.prevPage}` : null,
      nextLink: result.hasNextPage ? 
        `${baseUrl}?${queryString ? queryString + '&' : ''}page=${result.nextPage}` : null
    }

    res.json(response)
  } catch (error) {
    res.status(500).json({ 
      status: 'error',
      message: 'Error interno del servidor',
      error: error.message
    })
  }
})

// GET /:pid - Obtener producto por ID
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
    res.status(500).json({ 
      status: 'error',
      message: 'Error interno del servidor',
      error: error.message
    })
  }
})

// POST / - Crear producto
router.post('/', async (req, res) => {
  try {
    const { title, description, code, price, status = true, stock, category, thumbnails = [] } = req.body

    // Validaciones
    if (!title || !description || !code || price == null || stock == null || !category) {
      return res.status(400).json({ 
        status: 'error',
        message: 'Todos los campos son obligatorios: title, description, code, price, stock, category' 
      })
    }

    // Validar tipos de datos
    if (typeof price !== 'number' || price < 0) {
      return res.status(400).json({ 
        status: 'error',
        message: 'El precio debe ser un número mayor o igual a 0' 
      })
    }

    if (typeof stock !== 'number' || stock < 0) {
      return res.status(400).json({ 
        status: 'error',
        message: 'El stock debe ser un número mayor o igual a 0' 
      })
    }

    const productData = { 
      title: title.trim(), 
      description: description.trim(), 
      code: code.trim(), 
      price: Number(price), 
      status, 
      stock: Number(stock), 
      category: category.trim(), 
      thumbnails: Array.isArray(thumbnails) ? thumbnails : []
    }
    
    const newProduct = await manager.addProduct(productData)
    
    // Emitir cambio via socket
    if (req.io) {
      const updatedProducts = await manager.getAllProducts()
      req.io.emit('products', updatedProducts)
    }

    res.status(201).json({
      status: 'success',
      message: 'Producto creado exitosamente',
      payload: newProduct
    })
  } catch (error) {
    const status = error.message.includes('código') || error.message.includes('E11000') ? 400 : 500
    res.status(status).json({ 
      status: 'error',
      message: error.message.includes('E11000') ? 'El código del producto ya existe' : error.message
    })
  }
})

// PUT /:pid - Actualizar producto
router.put('/:pid', async (req, res) => {
  try {
    const updates = { ...req.body }
    
    // No permitir actualizar campos protegidos
    delete updates.id
    delete updates._id
    delete updates.__v
    delete updates.createdAt
    delete updates.updatedAt

    // Validar datos si se envían
    if (updates.price !== undefined) {
      if (typeof updates.price !== 'number' || updates.price < 0) {
        return res.status(400).json({ 
          status: 'error',
          message: 'El precio debe ser un número mayor o igual a 0' 
        })
      }
    }

    if (updates.stock !== undefined) {
      if (typeof updates.stock !== 'number' || updates.stock < 0) {
        return res.status(400).json({ 
          status: 'error',
          message: 'El stock debe ser un número mayor o igual a 0' 
        })
      }
    }

    const updatedProduct = await manager.updateProduct(req.params.pid, updates)
    
    if (!updatedProduct) {
      return res.status(404).json({ 
        status: 'error',
        message: 'Producto no encontrado' 
      })
    }

    // Emitir cambio via socket
    if (req.io) {
      const updatedProducts = await manager.getAllProducts()
      req.io.emit('products', updatedProducts)
    }

    res.json({
      status: 'success',
      message: 'Producto actualizado exitosamente',
      payload: updatedProduct
    })
  } catch (error) {
    const status = error.message.includes('código') || error.message.includes('E11000') ? 400 : 500
    res.status(status).json({ 
      status: 'error',
      message: error.message.includes('E11000') ? 'El código del producto ya existe' : error.message
    })
  }
})

// DELETE /:pid - Eliminar producto
router.delete('/:pid', async (req, res) => {
  try {
    const deleted = await manager.deleteProduct(req.params.pid)
    
    if (!deleted) {
      return res.status(404).json({ 
        status: 'error',
        message: 'Producto no encontrado' 
      })
    }

    // Emitir cambio via socket
    if (req.io) {
      const updatedProducts = await manager.getAllProducts()
      req.io.emit('products', updatedProducts)
    }

    res.json({
      status: 'success',
      message: 'Producto eliminado exitosamente'
    })
  } catch (error) {
    res.status(500).json({ 
      status: 'error',
      message: 'Error interno del servidor',
      error: error.message
    })
  }
})

export default router