const { Order } = require("../models");

exports.createOrder = async (req, res) => {
  try {
    const { customerName, customerRegion, product, quantity, price, total, status } = req.body;
    
    // Input validation
    if (!customerName || !customerRegion || !product) {
      return res.status(400).json({ message: "Customer name, region and product are required" });
    }
    
    if (!quantity || quantity < 1) {
      return res.status(400).json({ message: "Quantity must be at least 1" });
    }
    
    if (!price || price < 0) {
      return res.status(400).json({ message: "Price cannot be negative" });
    }
    
    // Create items array from single product input
    const items = [
      {
        product: product.trim(),
        quantity: Number(quantity),
        price: Number(price),
        total: Number(quantity) * Number(price)
      }
    ];
    
    // Validate status
    const validStatuses = ['pending', 'processing', 'completed', 'cancelled'];
    const orderStatus = status && validStatuses.includes(status.toLowerCase()) 
      ? status.toLowerCase() 
      : 'pending';
    
    const orderData = {
      customerName: customerName.trim(),
      customerRegion: customerRegion.trim(),
      items: items, // Model setter will stringify this
      total: Number(total) || Number(quantity) * Number(price),
      status: orderStatus,
      userId: req.user?.id || null
    };
    
    console.log("Creating order with data:", orderData);
    
    const order = await Order.create(orderData);
    
    // Parse items back for response
    const response = order.toJSON();
    response.items = items;
    
    res.status(201).json(response);
  } catch (err) {
    console.error("Create order error:", err);
    
    // Handle specific Sequelize errors
    if (err.name === 'SequelizeValidationError') {
      const messages = err.errors.map(e => e.message);
      return res.status(400).json({ 
        message: "Validation error", 
        errors: messages 
      });
    }
    
    if (err.name === 'SequelizeDatabaseError') {
      return res.status(500).json({ 
        message: "Database error. Please check your data and try again." 
      });
    }
    
    res.status(500).json({ 
      message: err.message || "Failed to create order" 
    });
  }
};

exports.getOrders = async (req, res) => {
  try {
    const orders = await Order.findAll({ 
      order: [["createdAt", "DESC"]]
    });
    
    // Parse items JSON string back to array for each order
    const parsedOrders = orders.map(order => {
      const orderData = order.toJSON();
      try {
        if (typeof orderData.items === 'string') {
          orderData.items = JSON.parse(orderData.items);
        }
      } catch (e) {
        console.error("Error parsing items for order:", order.id, e);
        orderData.items = [];
      }
      return orderData;
    });
    
    res.json(parsedOrders);
  } catch (err) {
    console.error("Get orders error:", err);
    res.status(500).json({ message: err.message || "Failed to fetch orders" });
  }
};

exports.getOrderById = async (req, res) => {
  try {
    const order = await Order.findByPk(req.params.id);
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }
    
    // Parse items JSON string for single order
    const orderData = order.toJSON();
    try {
      if (typeof orderData.items === 'string') {
        orderData.items = JSON.parse(orderData.items);
      }
    } catch (e) {
      console.error("Error parsing items for order:", order.id, e);
      orderData.items = [];
    }
    
    res.json(orderData);
  } catch (err) {
    console.error("Get order by id error:", err);
    res.status(500).json({ message: err.message || "Failed to fetch order" });
  }
};

// Add this new function for updating orders
exports.updateOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const { customerName, customerRegion, product, quantity, price, total, status } = req.body;
    
    // Find the order first
    const order = await Order.findByPk(id);
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }
    
    // Input validation
    if (customerName !== undefined && !customerName.trim()) {
      return res.status(400).json({ message: "Customer name cannot be empty" });
    }
    
    if (customerRegion !== undefined && !customerRegion.trim()) {
      return res.status(400).json({ message: "Region cannot be empty" });
    }
    
    if (product !== undefined && !product.trim()) {
      return res.status(400).json({ message: "Product cannot be empty" });
    }
    
    if (quantity !== undefined && (quantity < 1 || isNaN(quantity))) {
      return res.status(400).json({ message: "Quantity must be at least 1" });
    }
    
    if (price !== undefined && (price < 0 || isNaN(price))) {
      return res.status(400).json({ message: "Price cannot be negative" });
    }
    
    // Build update data
    const updateData = {};
    
    if (customerName) updateData.customerName = customerName.trim();
    if (customerRegion) updateData.customerRegion = customerRegion.trim();
    
    // Update items if product, quantity, or price is provided
    if (product || quantity !== undefined || price !== undefined) {
      // Get existing items or parse them if stored as JSON string
      let existingItems = [];
      try {
        const orderData = order.toJSON();
        if (typeof orderData.items === 'string') {
          existingItems = JSON.parse(orderData.items);
        } else if (Array.isArray(orderData.items)) {
          existingItems = orderData.items;
        }
      } catch (e) {
        console.error("Error parsing existing items:", e);
        existingItems = [];
      }
      
      // Update the first item or create new items array
      const updatedItems = existingItems.length > 0 ? [...existingItems] : [{}];
      updatedItems[0] = {
        ...updatedItems[0],
        product: product ? product.trim() : updatedItems[0].product,
        quantity: quantity !== undefined ? Number(quantity) : updatedItems[0].quantity,
        price: price !== undefined ? Number(price) : updatedItems[0].price,
        total: (quantity !== undefined && price !== undefined) 
          ? Number(quantity) * Number(price)
          : (quantity !== undefined ? Number(quantity) * (updatedItems[0].price || 0)
            : (price !== undefined ? (updatedItems[0].quantity || 0) * Number(price)
              : updatedItems[0].total))
      };
      
      updateData.items = updatedItems;
      updateData.total = updatedItems[0].total || 0;
    }
    
    // Validate and update status if provided
    if (status) {
      const validStatuses = ['pending', 'processing', 'completed', 'cancelled'];
      if (validStatuses.includes(status.toLowerCase())) {
        updateData.status = status.toLowerCase();
      }
    }
    
    // Update total if explicitly provided
    if (total !== undefined && !isNaN(total)) {
      updateData.total = Number(total);
    }
    
    console.log("Updating order with data:", updateData);
    
    // Perform the update
    await order.update(updateData);
    
    // Reload the order to get fresh data
    await order.reload();
    
    // Parse items for response
    const response = order.toJSON();
    try {
      if (typeof response.items === 'string') {
        response.items = JSON.parse(response.items);
      }
    } catch (e) {
      console.error("Error parsing items for response:", e);
      response.items = [];
    }
    
    res.json(response);
  } catch (err) {
    console.error("Update order error:", err);
    
    // Handle specific Sequelize errors
    if (err.name === 'SequelizeValidationError') {
      const messages = err.errors.map(e => e.message);
      return res.status(400).json({ 
        message: "Validation error", 
        errors: messages 
      });
    }
    
    if (err.name === 'SequelizeDatabaseError') {
      return res.status(500).json({ 
        message: "Database error. Please check your data and try again." 
      });
    }
    
    res.status(500).json({ 
      message: err.message || "Failed to update order" 
    });
  }
};

// controllers/orderController.js - Add this function
exports.deleteOrder = async (req, res) => {
  try {
    const { id } = req.params;
    
    const order = await Order.findByPk(id);
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }
    
    await order.destroy();
    
    res.json({ message: `Order #${id} deleted successfully` });
  } catch (err) {
    console.error("Delete order error:", err);
    res.status(500).json({ message: err.message || "Failed to delete order" });
  }
};