import { Router } from 'express'
import ProductManager from '../managers/ProductManager.js'
import CartManager from '../managers/CartManager.js'

const router = Router()
const productManager = new ProductManager()
const cartManager = new CartManager()

// Vista principal - productos con paginación
router.get('/products', async (req, res) => {
  try {
    const { page = 1, limit = 10, sort, query: queryParam } = req.query
    
    // Parsear query para filtros
    const query = {}
    if (queryParam) {
      // categoría
      if (typeof queryParam === 'string' && !['true', 'false', 'available', 'unavailable'].includes(queryParam)) {
        query.category = { $regex: queryParam, $options: 'i' }
      }
      // disponibilidad por status
      else if (queryParam === 'true' || queryParam === 'false') {
        query.status = queryParam === 'true'
      }
      // disponibilidad por stock
      else if (queryParam === 'available') {
        query.stock = { $gt: 0 }
      }
      else if (queryParam === 'unavailable') {
        query.stock = 0
      }
    }

    // Configurar opciones
    const options = {
      limit: parseInt(limit),
      page: parseInt(page),
      sort: sort === 'asc' || sort === 'desc' ? { price: sort === 'asc' ? 1 : -1 } : {},
      lean: true
    }

    
    const result = await productManager.getProducts(query, options)
    
    if (result.status === 'error') {
      return res.render('products', { 
        error: 'Error al cargar productos',
        products: [],
        pagination: {},
        currentSort: sort,
        currentQuery: queryParam,
        currentLimit: limit
      })
    }

    // Construir URLs de paginación con parámetros actuales
    const baseQuery = new URLSearchParams()
    if (limit !== '10') baseQuery.set('limit', limit)
    if (sort) baseQuery.set('sort', sort)
    if (queryParam) baseQuery.set('query', queryParam)

    const queryString = baseQuery.toString()
    const separator = queryString ? '&' : ''

    const pagination = {
      page: result.page,
      totalPages: result.totalPages,
      hasPrevPage: result.hasPrevPage,
      hasNextPage: result.hasNextPage,
      prevPage: result.prevPage,
      nextPage: result.nextPage,
      prevLink: result.hasPrevPage ? `/products?${queryString}${separator}page=${result.prevPage}` : null,
      nextLink: result.hasNextPage ? `/products?${queryString}${separator}page=${result.nextPage}` : null
    }

    // Obtener categorías para el filtro
    const categories = await productManager.getDistinctCategories()

    res.render('products', {
      products: result.payload,
      pagination,
      categories,
      currentSort: sort,
      currentQuery: queryParam,
      currentLimit: limit,
      title: 'Productos'
    })
  } catch (error) {
    console.error('Error en vista productos:', error)
    res.render('products', { 
      error: 'Error interno del servidor',
      products: [],
      pagination: {},
      currentSort: sort,
      currentQuery: queryParam,
      currentLimit: limit,
      title: 'Productos'
    })
  }
})

// Vista de producto individual
router.get('/products/:pid', async (req, res) => {
  try {
    const product = await productManager.getProductById(req.params.pid)
    
    if (!product) {
      return res.render('product-detail', { 
        error: 'Producto no encontrado',
        title: 'Producto no encontrado'
      })
    }
    
    res.render('product-detail', { 
      product,
      title: product.title
    })
  } catch (error) {
    console.error('Error en vista producto individual:', error)
    res.render('product-detail', { 
      error: 'Error al cargar producto',
      title: 'Error'
    })
  }
})

// Vista de carrito específico
router.get('/carts/:cid', async (req, res) => {
  try {
    const cart = await cartManager.getCartById(req.params.cid)
    
    if (!cart) {
      return res.render('cart', { 
        error: 'Carrito no encontrado',
        title: 'Carrito no encontrado'
      })
    }

    // Calcular total del carrito y cantidad total de productos
    let cartTotal = 0
    let totalItems = 0

    if (cart.products && cart.products.length > 0) {
      cart.products.forEach(item => {
        if (item.product && item.product.price) {
          cartTotal += (item.product.price * item.quantity)
          totalItems += item.quantity
        }
      })
    }

    res.render('cart', { 
      cart,
      cartTotal: cartTotal.toFixed(2),
      totalItems,
      cartId: req.params.cid,
      title: `Carrito - ${totalItems} productos`,
      hasProducts: cart.products && cart.products.length > 0
    })
  } catch (error) {
    console.error('Error en vista carrito:', error)
    res.render('cart', { 
      error: 'Error al cargar carrito',
      title: 'Error'
    })
  }
})

// Vista home 
router.get('/', async (req, res) => {
  try {
    const products = await productManager.getAllProducts(20) // Limitar a 20 
    res.render('home', { 
      products,
      title: 'Inicio'
    })
  } catch (error) {
    console.error('Error en vista home:', error)
    res.render('home', { 
      error: 'Error al cargar productos',
      products: [],
      title: 'Inicio'
    })
  }
})

// Vista productos en tiempo real
router.get('/realtimeproducts', async (req, res) => {
  try {
    const products = await productManager.getAllProducts(50) 
    res.render('realTimeProducts', { 
      products,
      title: 'Productos en Tiempo Real'
    })
  } catch (error) {
    console.error('Error en vista tiempo real:', error)
    res.render('realTimeProducts', { 
      error: 'Error al cargar productos',
      products: [],
      title: 'Productos en Tiempo Real'
    })
  }
})

export default router