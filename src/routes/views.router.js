import { Router } from 'express'
import ProductManager from '../managers/ProductManager.js'
import CartManager from '../managers/CartManager.js'

const router = Router()
const productManager = new ProductManager()
const cartManager = new CartManager()

// Vista principal - productos con paginación
router.get('/products', async (req, res) => {
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
    
    const result = await productManager.getProducts(query, options)
    
    if (result.status === 'error') {
      return res.render('products', { 
        error: result.message,
        title: 'Error - Productos',
        query: req.query
      })
    }
    
    // Enlaces de Pag
    const queryParams = new URLSearchParams()
    if (category) queryParams.append('category', category)
    if (status) queryParams.append('status', status)  
    if (stock) queryParams.append('stock', stock)
    if (sort) queryParams.append('sort', sort)
    queryParams.append('limit', options.limit)
    
    const baseUrl = '/products'
    const prevLink = result.hasPrevPage ? 
      `${baseUrl}?page=${result.prevPage}&${queryParams.toString()}` : null
    const nextLink = result.hasNextPage ? 
      `${baseUrl}?page=${result.nextPage}&${queryParams.toString()}` : null
    
    res.render('products', {
      ...result,
      prevLink,
      nextLink,
      query: req.query,
      limit: options.limit,
      sort: sort,
      title: `Productos - Página ${result.page}`
    })
    
  } catch (error) {
    console.error('Error en vista productos:', error)
    res.render('products', { 
      error: 'Error interno del servidor',
      title: 'Error - Productos',
      query: req.query
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
    console.error('Error en vista producto:', error)
    res.render('product-detail', {
      error: 'Error al cargar producto',
      title: 'Error - Producto'
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
    
    // Calcular totales
    let totalPrice = 0
    let totalItems = 0
    
    if (cart.products && cart.products.length > 0) {
      cart.products.forEach(item => {
        if (item.product && item.product.price) {
          totalPrice += item.product.price * item.quantity
          totalItems += item.quantity
        }
      })
    }
    
    // Agregar propiedades calculadas
    cart.totalPrice = totalPrice.toFixed(2)
    cart.totalItems = totalItems
    cart.hasProducts = cart.products && cart.products.length > 0
    
    res.render('cart', {
      cart,
      title: `Mi Carrito (${totalItems} items)`
    })
    
  } catch (error) {
    console.error('Error en vista carrito:', error)
    res.render('cart', {
      error: 'Error al cargar carrito',
      title: 'Error - Carrito'
    })
  }
})

// Vista home
router.get('/', (req, res) => {
  res.redirect('/products')
})

// Vista en tiempo real
router.get('/realtimeproducts', async (req, res) => {
  try {
    const products = await productManager.getAllProducts(20)
    res.render('realTimeProducts', {
      products,
      title: 'Gestión en Tiempo Real'
    })
  } catch (error) {
    console.error('Error en vista tiempo real:', error)
    res.render('realTimeProducts', {
      error: 'Error al cargar productos',
      products: [],
      title: 'Error - Tiempo Real'
    })
  }
})

export default router