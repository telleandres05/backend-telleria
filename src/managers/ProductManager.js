import fs from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const PRODUCTS_FILE = path.resolve(__dirname, '../data/products.json')

export default class ProductManager {
  constructor(filePath = PRODUCTS_FILE) {
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
    if (!Array.isArray(items) || items.length === 0) return 1
    const ids = items.map(item => parseInt(item.id)).filter(id => !isNaN(id))
    return ids.length > 0 ? Math.max(...ids) + 1 : 1
  }

  async getProducts() {
    return await this.#readFile()
  }

  async getProductById(pid) {
    const products = await this.#readFile()
    return products.find(p => String(p.id) === String(pid)) || null
  }

  async addProduct(productData) {
    const products = await this.#readFile()
    const id = this.#generateId(products)
    const newProduct = { id, ...productData }
    products.push(newProduct)
    await this.#writeFile(products)
    return newProduct
  }

  async updateProduct(pid, updates) {
    const products = await this.#readFile()
    const index = products.findIndex(p => String(p.id) === String(pid))
    if (index === -1) return null
    products[index] = { ...products[index], ...updates }
    await this.#writeFile(products)
    return products[index]
  }

  async deleteProduct(pid) {
    const products = await this.#readFile()
    const index = products.findIndex(p => String(p.id) === String(pid))
    if (index === -1) return false
    products.splice(index, 1)
    await this.#writeFile(products)
    return true
  }
}