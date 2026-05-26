const Product = require('../models/Product'); 

const createProduct = async (req, res) => {
  try {
    const { 
      name, slug, sku, description, short_description, 
      price, cost_per_item, stock_quantity, tags 
    } = req.body;

    if (!name || !slug || !price) {
      return res.status(400).json({ 
        success: false, 
        message: 'Name, slug, and price are required fields.' 
      });
    }

    const newProduct = await Product.create({
      name,
      slug,
      sku,
      description,
      short_description,
      price,
      cost_per_item,
      stock_quantity: stock_quantity || 0, 
      tags: tags || []                     
    });

    return res.status(201).json({
      success: true,
      message: 'Product created successfully!',
      product: newProduct
    });

  } catch (error) {
    console.error('Error creating product:', error);
    
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({ 
        success: false, 
        message: 'A product with this slug or SKU already exists.' 
      });
    }

    return res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    });
  }
};

module.exports = { createProduct };