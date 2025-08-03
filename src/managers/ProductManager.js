import fs from 'fs/promises'
const path = './src/data/products.json'

export default class ProductManager {
  async getProducts() {
    const data = await fs.readFile(path, 'utf-8')
    return JSON.parse(data)
  }

  async getProductById(id) {
    const products = await this.getProducts()
    return products.find(p => p.id === id)
  }

  async addProduct(product) {
    const products = await this.getProducts()
    const newProduct = { id: Date.now().toString(), ...product }
    products.push(newProduct)
    await fs.writeFile(path, JSON.stringify(products, null, 2))
    return newProduct
  }

  async updateProduct(id, updates) {
    const products = await this.getProducts()
    const index = products.findIndex(p => p.id === id)
    if (index === -1) return null
    products[index] = { ...products[index], ...updates, id }
    await fs.writeFile(path, JSON.stringify(products, null, 2))
    return products[index]
  }

  async deleteProduct(id) {
    const products = await this.getProducts()
    const filtered = products.filter(p => p.id !== id)
    await fs.writeFile(path, JSON.stringify(filtered, null, 2))
  }
}