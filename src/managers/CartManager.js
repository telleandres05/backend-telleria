import Cart from '../models/Cart.js'
import Product from '../models/Product.js'

class CartManager {

  // Crear carrito
  async createCart() {
    try {
      const cart = new Cart({ products: [] })
      const savedCart = await cart.save()
      return savedCart.toObject()
    } catch (error) {
      throw new Error('Error al crear carrito: ' + error.message)
    }
  }

  // Obtener carrito por ID con populate
  async getCartById(cartId) {
    try {
      const cart = await Cart.findById(cartId)
        .populate('products.product')
        .lean()
      
      return cart
    } catch (error) {
      throw new Error('Error al buscar carrito: ' + error.message)
    }
  }

  // Agregar producto al carrito
  async addProductToCart(cartId, productId, quantity = 1) {
    try {
      // Verificar que el producto existe
      const productExists = await Product.findById(productId)
      if (!productExists) {
        throw new Error('Producto no encontrado')
      }

      const cart = await Cart.findById(cartId)
      if (!cart) {
        throw new Error('Carrito no encontrado')
      }

      // Buscar si el producto ya está en el carrito
      const existingProductIndex = cart.products.findIndex(
        item => item.product.toString() === productId
      )

      if (existingProductIndex >= 0) {
        // Si existe, incrementar cantidad
        cart.products[existingProductIndex].quantity += quantity
      } else {
        // Si no existe, agregar nuevo producto
        cart.products.push({
          product: productId,
          quantity: quantity
        })
      }

      const updatedCart = await cart.save()
      return updatedCart.toObject()
    } catch (error) {
      throw new Error('Error al agregar producto al carrito: ' + error.message)
    }
  }

  // NUEVO: Eliminar producto específico del carrito
  async removeProductFromCart(cartId, productId) {
    try {
      const cart = await Cart.findById(cartId)
      if (!cart) {
        throw new Error('Carrito no encontrado')
      }

      cart.products = cart.products.filter(
        item => item.product.toString() !== productId
      )

      const updatedCart = await cart.save()
      return updatedCart.toObject()
    } catch (error) {
      throw new Error('Error al eliminar producto del carrito: ' + error.message)
    }
  }

  // NUEVO: Actualizar todo el carrito con un array de productos
  async updateCart(cartId, products) {
    try {
      // Validar que todos los productos existen
      for (const item of products) {
        const productExists = await Product.findById(item.product)
        if (!productExists) {
          throw new Error(`Producto ${item.product} no encontrado`)
        }
      }

      const updatedCart = await Cart.findByIdAndUpdate(
        cartId,
        { products },
        { new: true, runValidators: true }
      )

      if (!updatedCart) {
        throw new Error('Carrito no encontrado')
      }

      return updatedCart.toObject()
    } catch (error) {
      throw new Error('Error al actualizar carrito: ' + error.message)
    }
  }

  // NUEVO: Actualizar cantidad de un producto específico
  async updateProductQuantity(cartId, productId, quantity) {
    try {
      if (quantity <= 0) {
        throw new Error('La cantidad debe ser mayor a 0')
      }

      const cart = await Cart.findById(cartId)
      if (!cart) {
        throw new Error('Carrito no encontrado')
      }

      const productIndex = cart.products.findIndex(
        item => item.product.toString() === productId
      )

      if (productIndex === -1) {
        throw new Error('Producto no encontrado en el carrito')
      }

      cart.products[productIndex].quantity = quantity
      const updatedCart = await cart.save()
      return updatedCart.toObject()
    } catch (error) {
      throw new Error('Error al actualizar cantidad: ' + error.message)
    }
  }

  // NUEVO: Limpiar carrito (eliminar todos los productos)
  async clearCart(cartId) {
    try {
      const updatedCart = await Cart.findByIdAndUpdate(
        cartId,
        { products: [] },
        { new: true }
      )

      if (!updatedCart) {
        throw new Error('Carrito no encontrado')
      }

      return updatedCart.toObject()
    } catch (error) {
      throw new Error('Error al limpiar carrito: ' + error.message)
    }
  }
}

export default CartManager