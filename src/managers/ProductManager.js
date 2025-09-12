import Product from '../models/Product.js'

class ProductManager {
  
  // Método principal - Obtener productos con paginación, filtros y ordenamiento
  async getProducts(query = {}, options = {}) {
    try {
      const {
        limit = 10,
        page = 1,
        sort
      } = options

      // Configurar filtros
      const filter = {}
      
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

      // links de paginación con parámetros
      const queryParams = new URLSearchParams()
      if (query.category) queryParams.append('category', query.category)
      if (query.status) queryParams.append('status', query.status)
      if (query.stock) queryParams.append('stock', query.stock)
      if (sort) queryParams.append('sort', sort)
      queryParams.append('limit', limit)

      const baseUrl = '/api/products'
      const prevLink = result.hasPrevPage ? 
        `${baseUrl}?page=${result.prevPage}&${queryParams.toString()}` : null
      const nextLink = result.hasNextPage ? 
        `${baseUrl}?page=${result.nextPage}&${queryParams.toString()}` : null

      return {
        status: 'success',
        payload: result.docs,
        totalPages: result.totalPages,
        prevPage: result.hasPrevPage ? result.prevPage : null,
        nextPage: result.hasNextPage ? result.nextPage : null,
        page: result.page,
        hasPrevPage: result.hasPrevPage,
        hasNextPage: result.hasNextPage,
        prevLink,
        nextLink
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
      if (!id) {
        throw new Error('ID de producto requerido')
      }
      
      const product = await Product.findById(id).lean()
      if (!product) {
        return null
      }
      
      return product
    } catch (error) {
      if (error.name === 'CastError') {
        throw new Error('ID de producto inválido')
      }
      throw new Error('Error al buscar producto: ' + error.message)
    }
  }

  // Agregar producto
  async addProduct(productData) {
    try {
      // Validar datos requeridos
      const requiredFields = ['title', 'description', 'code', 'price', 'category']
      for (const field of requiredFields) {
        if (!productData[field]) {
          throw new Error(`El campo ${field} es requerido`)
        }
      }

      // Limpiar datos
      const cleanData = {
        title: productData.title.toString().trim(),
        description: productData.description.toString().trim(),
        code: productData.code.toString().trim(),
        price: Number(productData.price),
        category: productData.category.toString().trim(),
        stock: Number(productData.stock) || 0,
        status: productData.status !== undefined ? Boolean(productData.status) : true,
        thumbnails: Array.isArray(productData.thumbnails) ? productData.thumbnails : []
      }

      // Validaciones de negocio
      if (cleanData.price < 0) {
        throw new Error('El precio debe ser mayor o igual a 0')
      }
      if (cleanData.stock < 0) {
        throw new Error('El stock debe ser mayor o igual a 0')
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
        throw new Error('Error de validación: ' + messages.join(', '))
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

      // Limpiar datos de actualización
      const cleanUpdates = {}
      
      if (updates.title !== undefined) {
        cleanUpdates.title = updates.title.toString().trim()
      }
      if (updates.description !== undefined) {
        cleanUpdates.description = updates.description.toString().trim()
      }
      if (updates.code !== undefined) {
        cleanUpdates.code = updates.code.toString().trim()
      }
      if (updates.price !== undefined) {
        const price = Number(updates.price)
        if (price < 0) throw new Error('El precio debe ser mayor o igual a 0')
        cleanUpdates.price = price
      }
      if (updates.stock !== undefined) {
        const stock = Number(updates.stock)
        if (stock < 0) throw new Error('El stock debe ser mayor o igual a 0')
        cleanUpdates.stock = stock
      }
      if (updates.category !== undefined) {
        cleanUpdates.category = updates.category.toString().trim()
      }
      if (updates.status !== undefined) {
        cleanUpdates.status = Boolean(updates.status)
      }
      if (updates.thumbnails !== undefined) {
        cleanUpdates.thumbnails = Array.isArray(updates.thumbnails) ? updates.thumbnails : []
      }

      const updatedProduct = await Product.findByIdAndUpdate(
        id,
        { $set: cleanUpdates },
        { new: true, runValidators: true }
      ).lean()

      if (!updatedProduct) {
        throw new Error('Producto no encontrado')
      }

      return updatedProduct
    } catch (error) {
      if (error.code === 11000) {
        throw new Error('El código del producto ya existe')
      }
      if (error.name === 'CastError') {
        throw new Error('ID de producto inválido')
      }
      if (error.name === 'ValidationError') {
        const messages = Object.values(error.errors).map(err => err.message)
        throw new Error('Error de validación: ' + messages.join(', '))
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
      if (error.name === 'CastError') {
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

  // Verificar si existe un producto
  async productExists(id) {
    try {
      if (!id) return false
      const product = await Product.findById(id).select('_id').lean()
      return !!product
    } catch (error) {
      return false
    }
  }

  // Obtener productos por categoría
  async getProductsByCategory(category, limit = 20) {
    try {
      const products = await Product.find({
        category: { $regex: category, $options: 'i' }
      })
      .limit(limit)
      .sort({ price: 1 })
      .lean()
      
      return products
    } catch (error) {
      throw new Error('Error al obtener productos por categoría: ' + error.message)
    }
  }

  // Obtener productos por disponibilidad
  async getProductsByAvailability(available = true, limit = 20) {
    try {
      const filter = available ? { stock: { $gt: 0 } } : { stock: 0 }
      
      const products = await Product.find(filter)
        .limit(limit)
        .sort({ stock: -1 })
        .lean()
      
      return products
    } catch (error) {
      throw new Error('Error al obtener productos por disponibilidad: ' + error.message)
    }
  }
}

export default ProductManager