import fs from 'fs/promises'
const path = './src/data/carts.json'

export default class CartManager {
  async getCarts() {
    const data = await fs.readFile(path, 'utf-8')
    return JSON.parse(data)
  }

  async getCartById(id) {
    const carts = await this.getCarts()
    return carts.find(c => c.id === id)
  }

  async createCart() {
    const carts = await this.getCarts()
    const newCart = { id: Date.now().toString(), products: [] }
    carts.push(newCart)
    await fs.writeFile(path, JSON.stringify(carts, null, 2))
    return newCart
  }

  async addProductToCart(cid, pid) {
    const carts = await this.getCarts()
    const cart = carts.find(c => c.id === cid)
    if (!cart) return null

    const existing = cart.products.find(p => p.product === pid)
    if (existing) {
      existing.quantity += 1
    } else {
      cart.products.push({ product: pid, quantity: 1 })
    }

    await fs.writeFile(path, JSON.stringify(carts, null, 2))
    return cart;
  }
}