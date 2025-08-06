import fs from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const CARTS_FILE = path.resolve(__dirname, '../data/carts.json')

export default class CartManager {
  constructor(filePath = CARTS_FILE) {
    this.path = filePath
  }

  async #readFile() {
    try {
      const content = await fs.readFile(this.path, 'utf-8')
      return JSON.parse(content)
    } catch (err) {
      if (err.code === 'ENOENT') {
        await fs.writeFile(this.path, JSON.stringify([]))
        return []
      }
      throw err
    }
  }

  async #writeFile(data) {
    await fs.writeFile(this.path, JSON.stringify(data, null, 2))
  }

  #generateId(items) {
    if (!Array.isArray(items) || items.length === 0) return '1'
    const numericIds = items
      .map(i => (typeof i.id === 'number' ? i.id : parseInt(i.id)))
      .filter(Number.isFinite)
    if (numericIds.length > 0) {
      const max = Math.max(...numericIds)
      return String(max + 1)
    }
    return String(Date.now())
  }

  async createCart() {
    const carts = await this.#readFile()
    const id = this.#generateId(carts)
    const newCart = { id, products: [] }
    carts.push(newCart)
    await this.#writeFile(carts)
    return newCart
  }

  async getCartById(cid) {
    const carts = await this.#readFile()
    return carts.find(c => String(c.id) === String(cid)) || null
  }

  async addProductToCart(cid, pid) {
    const carts = await this.#readFile()
    const index = carts.findIndex(c => String(c.id) === String(cid))
    if (index === -1) return null
    const cart = carts[index]
    const prodIndex = cart.products.findIndex(p => String(p.product) === String(pid))
    if (prodIndex === -1) {
      cart.products.push({ product: String(pid), quantity: 1 })
    } else {
      cart.products[prodIndex].quantity = Number(cart.products[prodIndex].quantity) + 1
    }
    carts[index] = cart
    await this.#writeFile(carts)
    return cart
  }
}
