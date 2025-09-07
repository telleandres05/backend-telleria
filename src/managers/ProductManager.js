import Product from '../models/Product.js'

class ProductManager {
  
  // Obtener productos con paginación, filtros y ordenamiento
  async getProducts(options = {}) {
    try {
      const {
        limit = 10,
        page = 1,
        sort,
        query
      } = options

      // Configurar filtros
      const filter = {}
      
      if (query) {
        // Buscar por categoría o disponibilidad
        if (query.category) {
          filter.category = { $regex: query.category, $options: 'i' }
        }
        if (query.status !== undefined) {
          filter.status = query.status === 'true'
        }
        if (query.stock !== undefined) {
          if (query.stock === 'available') {
            filter.stock = { $gt: 0 }
          } else if (query.stock === 'unavailable') {
            filter.stock = 0
          }
        }
      }

      // Configurar ordenamiento
      const sortOptions = {}
      if (sort) {
        if (sort === 'asc') {
          sortOptions.price = 1
        } else if (sort === 'desc') {
          sortOptions.price = -1
        }
      }

      // Opciones de paginación
      const paginateOptions = {
        page: parseInt(page),
        limit: parseInt(limit),
        sort: Object.keys(sortOptions).length > 0 ? sortOptions : undefined,
        lean: true
      }

      const result = await Product.paginate(filter, paginateOptions)
      
      return {
        status: 'success',
        payload: result.docs,
        totalPages: result.totalPages,
        prevPage: result.hasPrevPage ? result.prevPage : null,
        nextPage: result.hasNextPage ? result.nextPage : null,
        page: result.page,
        hasPrevPage: result.hasPrevPage,
        hasNextPage: result.hasNextPage,
        prevLink: result.hasPrevPage ? `/api/products?page=${result.prevPage}&limit=${limit}` : null,
        nextLink: result.hasNextPage ? `/api/products?page=${result.nextPage}&limit=${limit}` : null
      }
    } catch (error) {
      return {
        status: 'error',
        message: error.message
      }
    }
  }

  // Obtener producto por ID
  async getProductById(id) {
    try {
      const product = await Product.findById(id).lean()
      return product
    } catch (error) {
      throw new Error('Error al buscar producto: ' + error.message)
    }
  }

  // Agregar producto
  async addProduct(productData) {
    try {
      const product = new Product(productData)
      const savedProduct = await product.save()
      return savedProduct.toObject()
    } catch (error) {
      if (error.code === 11000) {
        throw new Error('El código del producto ya existe')
      }
      throw new Error('Error al crear producto: ' + error.message)
    }
  }

  // Actualizar producto
  async updateProduct(id, updates) {
    try {
      const updatedProduct = await Product.findByIdAndUpdate(
        id,
        { $set: updates },
        { new: true, runValidators: true }
      ).lean()
      
      return updatedProduct
    } catch (error) {
      if (error.code === 11000) {
        throw new Error('El código del producto ya existe')
      }
      throw new Error('Error al actualizar producto: ' + error.message)
    }
  }

  // Eliminar producto
  async deleteProduct(id) {
    try {
      const deletedProduct = await Product.findByIdAndDelete(id)
      return !!deletedProduct
    } catch (error) {
      throw new Error('Error al eliminar producto: ' + error.message)
    }
  }

  // Obtener productos simples (para vistas)
  async getAllProducts() {
    try {
      const products = await Product.find().lean()
      return products
    } catch (error) {
      throw new Error('Error al obtener productos: ' + error.message)
    }
  }
}

export default ProductManager