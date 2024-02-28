import Customer from '../models/Customer.js';
import Product from '../models/Product.js';

export const home = async (req, res) => {
  const products = await Product.find();
  res.render('index', { products });
};

export const getProducts = async (req, res) => {
  const { name } = req.body;
  let query = {};

  if (name) {
    query.name = { $regex: name, $options: 'i' }; // Case-insensitive search
  }

  try {
    const products = await Product.find(query).sort({price: -1});
    res.json(products); // Send back JSON response
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).send(error);
  }
};

export const addToCart = async (req, res) => {
  try {
    let { productId, quantity } = req.body;
    quantity = parseInt(quantity);
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).send('Product not found');
    }
    const price = product.price;
  
    const userId = req.user._id;
    let customer = await Customer.findOne({ _id: userId });
    console.log(customer);
    if (!customer.cart) {
      customer.cart = { items: [], totalQuantity: 0, totalPrice: 0 };
    } else {
      const itemIndex = customer.cart.items.findIndex(item => item.productId.toString() === productId);
      if (itemIndex > -1) {
        customer.cart.items[itemIndex].quantity += quantity;
        customer.cart.items[itemIndex].price = price;
      } else {
        customer.cart.items.push({ productId, quantity, price });
      }
      customer.cart.totalQuantity += quantity;
      customer.cart.totalPrice += price * quantity;
    }

    await customer.save();
    const populatedCustomer = await Customer.findOne({ _id: userId })
                                            .populate('cart.items.productId');
    res.render('cart', {user: populatedCustomer});
  } catch (error) {
    console.error(error);
    res.status(500).send('An error occurred');
  }
};