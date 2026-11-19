/**
 * Product Model
 */

const { query, inMemoryStore, pool } = require('../config/db');

async function getProducts({ search, category, minPrice, maxPrice, sort = 'newest', page = 1, limit = 20 }) {
  if (process.env.USE_MOCK_DB === 'true' || !pool) {
    let list = [...inMemoryStore.products];
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(p => p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q));
    }
    if (category && category !== 'all') {
      list = list.filter(p => p.category.toLowerCase() === category.toLowerCase());
    }
    if (minPrice) list = list.filter(p => p.price >= parseFloat(minPrice));
    if (maxPrice) list = list.filter(p => p.price <= parseFloat(maxPrice));

    if (sort === 'price-low') list.sort((a, b) => a.price - b.price);
    else if (sort === 'price-high') list.sort((a, b) => b.price - a.price);
    else if (sort === 'name') list.sort((a, b) => a.name.localeCompare(b.name));

    const total = list.length;
    const startIndex = (page - 1) * limit;
    const paginated = list.slice(startIndex, startIndex + limit);
    return { products: paginated, total, page, totalPages: Math.ceil(total / limit) };
  }

  const conditions = [];
  const params = [];
  let paramIdx = 1;

  if (search) {
    conditions.push(`(name ILIKE $${paramIdx} OR description ILIKE $${paramIdx})`);
    params.push(`%${search}%`);
    paramIdx++;
  }
  if (category && category !== 'all') {
    conditions.push(`category ILIKE $${paramIdx}`);
    params.push(category);
    paramIdx++;
  }
  if (minPrice) {
    conditions.push(`price >= $${paramIdx}`);
    params.push(parseFloat(minPrice));
    paramIdx++;
  }
  if (maxPrice) {
    conditions.push(`price <= $${paramIdx}`);
    params.push(parseFloat(maxPrice));
    paramIdx++;
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  let orderBy = 'ORDER BY created_at DESC';
  if (sort === 'price-low') orderBy = 'ORDER BY price ASC';
  else if (sort === 'price-high') orderBy = 'ORDER BY price DESC';
  else if (sort === 'name') orderBy = 'ORDER BY name ASC';

  const countRes = await query(`SELECT COUNT(*) as total FROM products ${whereClause}`, params);
  const total = parseInt(countRes.rows[0].total, 10);

  const offset = (page - 1) * limit;
  const dataParams = [...params, limit, offset];
  const dataRes = await query(
    `SELECT * FROM products ${whereClause} ${orderBy} LIMIT $${paramIdx} OFFSET $${paramIdx + 1}`,
    dataParams
  );

  return {
    products: dataRes.rows,
    total,
    page: parseInt(page, 10),
    totalPages: Math.ceil(total / limit)
  };
}

async function getProductById(id) {
  if (process.env.USE_MOCK_DB === 'true' || !pool) {
    return inMemoryStore.products.find(p => p.id === id) || null;
  }
  const res = await query('SELECT * FROM products WHERE id = $1', [id]);
  return res.rows[0] || null;
}

async function createProduct({ name, slug, description, price, stockQuantity, category, imageUrl }) {
  const generatedSlug = slug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
  if (process.env.USE_MOCK_DB === 'true' || !pool) {
    const newProduct = {
      id: `p-${Date.now()}`,
      name,
      slug: generatedSlug,
      description,
      price: parseFloat(price),
      stock_quantity: parseInt(stockQuantity, 10),
      category,
      image_url: imageUrl || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600',
      created_at: new Date().toISOString()
    };
    inMemoryStore.products.push(newProduct);
    return newProduct;
  }
  const res = await query(
    `INSERT INTO products (name, slug, description, price, stock_quantity, category, image_url)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING *`,
    [name, generatedSlug, description, price, stockQuantity, category, imageUrl]
  );
  return res.rows[0];
}

async function updateProduct(id, fields) {
  if (process.env.USE_MOCK_DB === 'true' || !pool) {
    const p = inMemoryStore.products.find(x => x.id === id);
    if (!p) return null;
    Object.assign(p, fields);
    return p;
  }
  const updates = [];
  const params = [id];
  let idx = 2;
  for (const [key, val] of Object.entries(fields)) {
    updates.push(`${key} = $${idx}`);
    params.push(val);
    idx++;
  }
  const res = await query(`UPDATE products SET ${updates.join(', ')}, updated_at = NOW() WHERE id = $1 RETURNING *`, params);
  return res.rows[0] || null;
}

async function deleteProduct(id) {
  if (process.env.USE_MOCK_DB === 'true' || !pool) {
    const idx = inMemoryStore.products.findIndex(x => x.id === id);
    if (idx !== -1) {
      inMemoryStore.products.splice(idx, 1);
      return true;
    }
    return false;
  }
  const res = await query('DELETE FROM products WHERE id = $1 RETURNING id', [id]);
  return (res.rows && res.rows.length > 0);
}

module.exports = {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct
};
