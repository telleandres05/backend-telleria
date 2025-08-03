import { Router } from 'express'
import CartManager from '../managers/CartManager.js'

const router = Router()
const manager = new CartManager()

router.post('/', async (req, res) => {
  const cart = await manager.createCart()
  res.status(201).json(cart)
})

router.get('/:cid', async (req, res) => {
  const cart = await manager.getCartById(req.params.cid)
  cart ? res.json(cart.products) : res.status(404).send('Carrito no encontrado')
})

router.post('/:cid/product/:pid', async (req, res) => {
  const cart = await manager.addProductToCart(req.params.cid, req.params.pid)
  cart ? res.json(cart) : res.status(404).send('Carrito no encontrado')
})

export default router