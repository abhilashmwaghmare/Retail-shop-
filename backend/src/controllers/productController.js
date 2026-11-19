/**
 * Product Controller
 */

const productModel = require('../models/productModel');

async function listProducts(req, res) {
  try {
    const { search, category, minPrice, maxPrice, sort, page, limit } = req.query;
    const result = await productModel.getProducts({
      search,
      category,
      minPrice,
      maxPrice,
      sort,
      page: parseInt(page || '1', 10),
      limit: parseInt(limit || '20', 10)
    });
    res.json({ success: true, ...result });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}

async function getProduct(req, res) {
  try {
    const product = await productModel.getProductById(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, error: 'Product not found' });
    }
    res.json({ success: true, data: product });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}

async function createProduct(req, res) {
  try {
    const { name, description, price, stockQuantity, category, imageUrl } = req.body || {};
    if (!name || price === undefined || stockQuantity === undefined || !category) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed: name, price, stockQuantity, and category are required'
      });
    }

    const newProduct = await productModel.createProduct({
      name,
      description,
      price,
      stockQuantity,
      category,
      imageUrl
    });

    res.status(201).json({
      success: true,
      message: 'Product created successfully',
      data: newProduct
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}

async function updateProduct(req, res) {
  try {
    const updated = await productModel.updateProduct(req.params.id, req.body);
    if (!updated) {
      return res.status(404).json({ success: false, error: 'Product not found or update failed' });
    }
    res.json({ success: true, message: 'Product updated successfully', data: updated });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}

async function deleteProduct(req, res) {
  try {
    const deleted = await productModel.deleteProduct(req.params.id);
    if (!deleted) {
      return res.status(404).json({ success: false, error: 'Product not found or delete failed' });
    }
    res.json({ success: true, message: 'Product deleted successfully' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}

module.exports = {
  listProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct
};
