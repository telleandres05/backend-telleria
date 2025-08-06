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

  async getProducts() {
    return await this.#readFile()
  }

  async getProductById(pid) {
    const products = await this.#readFile()
    return products.find(p => String(p.id) === String(pid)) || null
  }

  async addProduct(productData) {
    const products = await this.#readFile()
    if (products.some(p => p.code === productData.code)) {
      throw new Error('Codigo de producto duplicado')
    }
    const id = this.#generateId(products)
    const newProduct = {
      id,
      title: productData.title,
      description: productData.description,
      code: productData.code,
      price: productData.price,
      status: productData.status ?? true,
      stock: productData.stock,
      category: productData.category,
      thumbnails: Array.isArray(productData.thumbnails) ? productData.thumbnails : []
    }
    products.push(newProduct)
    await this.#writeFile(products)
    return newProduct
  }

  async updateProduct(pid, updates) {
    const products = await this.#readFile()
    const index = products.findIndex(p => String(p.id) === String(pid))
    if (index === -1) return null
    if ('id' in updates) delete updates.id
    if (updates.code) {
      const exists = products.some((p, i) => p.code === updates.code && i !== index)
      if (exists) throw new Error('Codigo de producto duplicado')
    }
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
