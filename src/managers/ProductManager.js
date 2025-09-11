import Product from '../models/Product.js'

class ProductManager {
  
  // Obtener productos con paginación, filtros y ordenamiento
  async getProducts(query = {}, options = {}) {
    try {
      const {
        limit = 10,
        page = 1,
        sort = {},
        lean = true
      } = options

      // Configurar ordenamiento
      const sortOptions = {}
      if (Object.keys(sort).length > 0) {
        sortOptions.price = sort.price
      }

      // Opciones de paginación
      const paginateOptions = {
        page: parseInt(page),
        limit: parseInt(limit),
        sort: Object.keys(sortOptions).length > 0 ? sortOptions : undefined,
        lean: lean
      }

      const result = await Product.paginate(query, paginateOptions)
      
      // Construir parámetros de query para los links
      const queryParams = new URLSearchParams()
      if (limit !== 10) queryParams.set('limit', limit)
      if (Object.keys(sort).length > 0) {
        queryParams.set('sort', sort.price === 1 ? 'asc' : 'desc')
      }
      
      // Agregar parámetros de filtro a los links
      if (query.category) queryParams.set('query', query.category)
      if (query.status !== undefined) queryParams.set('query', query.status.toString())
      if (query.stock !== undefined) {
        if (query.stock.$gt === 0) queryParams.set('query', 'available')
        if (query.stock === 0) queryParams.set('query', 'unavailable')
      }

      const baseUrl = '/api/products'
      const queryString = queryParams.toString()
      
      return {
        status: 'success',
        payload: result.docs,
        totalPages: result.totalPages,
        prevPage: result.hasPrevPage ? result.prevPage : null,
        nextPage: result.hasNextPage ? result.nextPage : null,
        page: result.page,
        hasPrevPage: result.hasPrevPage,
        hasNextPage: result.hasNextPage,
        prevLink: result.hasPrevPage ? 
          `${baseUrl}?${queryString ? queryString + '&' : ''}page=${result.prevPage}` : null,
        nextLink: result.hasNextPage ? 
          `${baseUrl}?${queryString ? queryString + '&' : ''}page=${result.nextPage}` : null
      }
    } catch (error) {
      return {
        status: 'error',
        message: error.message,
        payload: [],
        totalPages: 0,
        prevPage: null,
        nextPage: null,
        page: 1,
        hasPrevPage: false,
        hasNextPage: false,
        prevLink: null,
        nextLink: null
      }
    }
  }

  async getProductsLegacy(options = {}) {
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

      return await this.getProducts(filter, {
        limit,
        page,
        sort: sortOptions,
        lean: true
      })
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
      if (!id) {
        throw new Error('ID de producto requerido')
      }

      const product = await Product.findById(id).lean()
      return product
    } catch (error) {
      if (error.kind === 'ObjectId') {
        throw new Error('ID de producto inválido')
      }
      throw new Error('Error al buscar producto: ' + error.message)
    }
  }

  // Agregar producto
  async addProduct(productData) {
    try {
      if (!productData) {
        throw new Error('Datos del producto requeridos')
      }

      // Limpiar datos
      const cleanData = {
        ...productData,
        title: productData.title?.trim(),
        description: productData.description?.trim(),
        code: productData.code?.trim(),
        category: productData.category?.trim(),
        price: Number(productData.price),
        stock: Number(productData.stock)
      }

      const product = new Product(cleanData)
      const savedProduct = await product.save()
      return savedProduct.toObject()
    } catch (error) {
      if (error.code === 11000) {
        throw new Error('El código del producto ya existe')
      }
      if (error.name === 'ValidationError') {
        const messages = Object.values(error.errors).map(err => err.message)
        throw new Error('Errores de validación: ' + messages.join(', '))
      }
      throw new Error('Error al crear producto: ' + error.message)
    }
  }

  // Actualizar producto
  async updateProduct(id, updates) {
    try {
      if (!id) {
        throw new Error('ID de producto requerido')
      }

      if (!updates || Object.keys(updates).length === 0) {
        throw new Error('Datos de actualización requeridos')
      }

      // Limpiar datos de actualización
      const cleanUpdates = { ...updates }
      if (cleanUpdates.title) cleanUpdates.title = cleanUpdates.title.trim()
      if (cleanUpdates.description) cleanUpdates.description = cleanUpdates.description.trim()
      if (cleanUpdates.code) cleanUpdates.code = cleanUpdates.code.trim()
      if (cleanUpdates.category) cleanUpdates.category = cleanUpdates.category.trim()
      if (cleanUpdates.price !== undefined) cleanUpdates.price = Number(cleanUpdates.price)
      if (cleanUpdates.stock !== undefined) cleanUpdates.stock = Number(cleanUpdates.stock)

      const updatedProduct = await Product.findByIdAndUpdate(
        id,
        { $set: cleanUpdates },
        { 
          new: true, 
          runValidators: true,
          lean: true
        }
      )
      
      return updatedProduct
    } catch (error) {
      if (error.kind === 'ObjectId') {
        throw new Error('ID de producto inválido')
      }
      if (error.code === 11000) {
        throw new Error('El código del producto ya existe')
      }
      if (error.name === 'ValidationError') {
        const messages = Object.values(error.errors).map(err => err.message)
        throw new Error('Errores de validación: ' + messages.join(', '))
      }
      throw new Error('Error al actualizar producto: ' + error.message)
    }
  }

  // Eliminar producto
  async deleteProduct(id) {
    try {
      if (!id) {
        throw new Error('ID de producto requerido')
      }

      const deletedProduct = await Product.findByIdAndDelete(id)
      return !!deletedProduct
    } catch (error) {
      if (error.kind === 'ObjectId') {
        throw new Error('ID de producto inválido')
      }
      throw new Error('Error al eliminar producto: ' + error.message)
    }
  }

  // Obtener productos simples
  async getAllProducts(limit = 50) {
    try {
      const products = await Product.find()
        .limit(limit)
        .sort({ createdAt: -1 })
        .lean()
      return products
    } catch (error) {
      throw new Error('Error al obtener productos: ' + error.message)
    }
  }

  // Verificar si un producto existe
  async productExists(id) {
    try {
      const product = await Product.findById(id).select('_id').lean()
      return !!product
    } catch (error) {
      return false
    }
  }

  // Obtener productos por categoría
  async getProductsByCategory(category, options = {}) {
    try {
      const filter = { 
        category: { $regex: category, $options: 'i' } 
      }
      return await this.getProducts(filter, options)
    } catch (error) {
      throw new Error('Error al obtener productos por categoría: ' + error.message)
    }
  }

  // Obtener productos disponibles/no disponibles
  async getProductsByAvailability(available = true, options = {}) {
    try {
      const filter = available 
        ? { stock: { $gt: 0 }, status: true }
        : { $or: [{ stock: 0 }, { status: false }] }
      
      return await this.getProducts(filter, options)
    } catch (error) {
      throw new Error('Error al obtener productos por disponibilidad: ' + error.message)
    }
  }
}

export default ProductManager