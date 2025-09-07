import { Router } from 'express'
import ProductManager from '../managers/ProductManager.js'
import CartManager from '../managers/CartManager.js'

const router = Router()
const productManager = new ProductManager()
const cartManager = new CartManager()

// Vista principal - productos con paginación
router.get('/products', async (req, res) => {
  try {
    const { page = 1, limit = 10, sort, query } = req.query
    
    // Parsear query para filtros
    const queryOptions = {}
    if (query) {
      if (typeof query === 'string' && !['true', 'false', 'available', 'unavailable'].includes(query)) {
        queryOptions.category = query
      } else if (query === 'true' || query === 'false') {
        queryOptions.status = query
      } else if (query === 'available' || query === 'unavailable') {
        queryOptions.stock = query
      }
    }

    const options = {
      limit: parseInt(limit),
      page: parseInt(page),
      sort: sort === 'asc' || sort === 'desc' ? sort : undefined,
      query: Object.keys(queryOptions).length > 0 ? queryOptions : undefined
    }

    const result = await productManager.getProducts(options)
    
    if (result.status === 'error') {
      return res.render('products', { 
        error: 'Error al cargar productos',
        products: [],
        pagination: {}
      })
    }

    // Construir URLs de paginación con parámetros actuales
    const baseQuery = new URLSearchParams()
    if (limit !== '10') baseQuery.set('limit', limit)
    if (sort) baseQuery.set('sort', sort)
    if (query) baseQuery.set('query', query)

    const pagination = {
      page: result.page,
      totalPages: result.totalPages,
      hasPrevPage: result.hasPrevPage,
      hasNextPage: result.hasNextPage,
      prevPage: result.prevPage,
      nextPage: result.nextPage,
      prevLink: result.hasPrevPage ? `/products?${baseQuery.toString()}&page=${result.prevPage}` : null,
      nextLink: result.hasNextPage ? `/products?${baseQuery.toString()}&page=${result.nextPage}` : null
    }

    res.render('products', {
      products: result.payload,
      pagination,
      currentSort: sort,
      currentQuery: query,
      currentLimit: limit
    })
  } catch (error) {
    res.render('products', { 
      error: 'Error interno del servidor',
      products: [],
      pagination: {}
    })
  }
})

// Vista de producto individual
router.get('/products/:pid', async (req, res) => {
  try {
    const product = await productManager.getProductById(req.params.pid)
    if (!product) {
      return res.render('product-detail', { error: 'Producto no encontrado' })
    }
    
    res.render('product-detail', { product })
  } catch (error) {
    res.render('product-detail', { error: 'Error al cargar producto' })
  }
})

// Vista de carrito específico
router.get('/carts/:cid', async (req, res) => {
  try {
    const cart = await cartManager.getCartById(req.params.cid)
    if (!cart) {
      return res.render('cart', { error: 'Carrito no encontrado' })
    }

    // Calcular total del carrito
    const cartTotal = cart.products.reduce((total, item) => {
      return total + (item.product.price * item.quantity)
    }, 0)

    res.render('cart', { 
      cart,
      cartTotal: cartTotal.toFixed(2),
      cartId: req.params.cid
    })
  } catch (error) {
    res.render('cart', { error: 'Error al cargar carrito' })
  }
})

// Vista home (productos estáticos) - mantener compatibilidad
router.get('/', async (req, res) => {
  try {
    const products = await productManager.getAllProducts()
    res.render('home', { products })
  } catch (error) {
    res.render('home', { 
      error: 'Error al cargar productos',
      products: [] 
    })
  }
})

// Vista productos en tiempo real
router.get('/realtimeproducts', async (req, res) => {
  try {
    const products = await productManager.getAllProducts()
    res.render('realTimeProducts', { products })
  } catch (error) {
    res.render('realTimeProducts', { 
      error: 'Error al cargar productos',
      products: [] 
    })
  }
})

export default router