import { Router } from 'express'
import ProductManager from '../managers/ProductManager.js'

const router = Router()
const productManager = new ProductManager()

// Vista home
router.get('/', async (req, res) => {
  try {
    const products = await productManager.getProducts()
    res.render('home', { products })
  } catch (error) {
    res.render('home', { products: [] })
  }
})

// Vista realTimeProducts
router.get('/realtimeproducts', async (req, res) => {
  try {
    const products = await productManager.getProducts()
    res.render('realTimeProducts', { products })
  } catch (error) {
    res.render('realTimeProducts', { products: [] })
  }
})

export default router