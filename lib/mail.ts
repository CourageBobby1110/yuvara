import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_SERVER_HOST,
  port: Number(process.env.EMAIL_SERVER_PORT),
  auth: {
    user: process.env.EMAIL_SERVER_USER,
    pass: process.env.EMAIL_SERVER_PASSWORD,
  },
});

export async function sendAdminNewOrderNotification(order: any) {
  const adminEmail = process.env.EMAIL_FROM;

  const itemsList = order.items
    .map(
      (item: any) =>
        `<li>${item.name} - Quantity: ${item.quantity} - Price: $${item.price} (USD)</li>`
    )
    .join("");

  const mailOptions = {
    from: process.env.EMAIL_FROM,
    to: adminEmail,
    subject: `New Order Received! #${order._id}`,
    html: `
      <h1>New Order Alert</h1>
      <p>A new order has been placed on Yuvara.</p>
      
      <h2>Order Details</h2>
      <p><strong>Order ID:</strong> ${order._id}</p>
      <p><strong>Total Amount:</strong> ₦${order.total.toLocaleString()}</p>
      <p><strong>Payment Reference:</strong> ${order.paymentReference}</p>
      
      <h3>Items:</h3>
      <ul>
        ${itemsList}
      </ul>
      
      <h3>Shipping Address:</h3>
      <p>
        ${order.shippingAddress.street}<br>
        ${order.shippingAddress.city}, ${order.shippingAddress.state} ${
      order.shippingAddress.zip
    }<br>
        ${order.shippingAddress.country}
      </p>
      
      <p><a href="${
        process.env.NEXTAUTH_URL
      }/admin/orders">View Order in Dashboard</a></p>
    `,
  };

  await transporter.sendMail(mailOptions);
}

export async function sendNewProductNotification(product: any, users: any[]) {
  const bccList = users.map((u) => u.email).join(",");

  if (!bccList) return;

  const mailOptions = {
    from: `Yuvara <${process.env.EMAIL_FROM}>`,
    bcc: bccList,
    subject: `New Arrival: ${product.name}`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="text-align: center; padding: 20px 0; border-bottom: 1px solid #eee;">
          <h1 style="margin: 0; font-size: 28px; font-weight: 700; letter-spacing: 2px; color: #000;">YUVARA</h1>
        </div>
        
        <div style="padding: 20px 0;">
          <h2 style="color: #333; margin-top: 0;">New Product Alert!</h2>
          <h3 style="font-size: 20px; margin: 10px 0;">${product.name}</h3>
          <p style="color: #666; line-height: 1.6;">${product.description}</p>
          <p style="font-size: 18px; font-weight: bold;">Price: $${
            product.price
          }</p>
          
          <div style="margin: 20px 0; text-align: center;">
            <img src="${product.images[0]}" alt="${
      product.name
    }" style="max-width: 100%; max-height: 300px; object-fit: cover; border-radius: 8px;" />
          </div>
          
          <div style="text-align: center; margin-top: 30px;">
            <a href="${process.env.NEXTAUTH_URL}/products/${
      product.slug
    }" style="background: #000; color: #fff; padding: 12px 30px; text-decoration: none; border-radius: 4px; font-weight: bold;">Shop Now</a>
          </div>
        </div>
        
        <div style="text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; color: #999; font-size: 12px;">
          <p>&copy; ${new Date().getFullYear()} Yuvara. All rights reserved.</p>
        </div>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(
      `Newsletter sent to ${users.length} users for product ${product.name}`
    );
  } catch (error) {
    console.error("Failed to send newsletter", error);
  }
}

export async function sendTargetedProductNotification(
  product: any,
  users: any[]
) {
  const bccList = users.map((u) => u.email).join(",");

  if (!bccList) return;

  const mailOptions = {
    from: `Yuvara <${process.env.EMAIL_FROM}>`,
    bcc: bccList,
    subject: `Special Offer: ${product.name}`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="text-align: center; padding: 20px 0; border-bottom: 1px solid #eee;">
          <h1 style="margin: 0; font-size: 28px; font-weight: 700; letter-spacing: 2px; color: #000;">YUVARA</h1>
        </div>
        
        <div style="padding: 20px 0;">
          <h2 style="color: #333; margin-top: 0;">Check out our latest product!</h2>
          <h3 style="font-size: 20px; margin: 10px 0;">${product.name}</h3>
          <p style="color: #666; line-height: 1.6;">${product.description}</p>
          <p style="font-size: 18px; font-weight: bold;">Price: $${
            product.price
          }</p>
          
          <div style="margin: 20px 0; text-align: center;">
            <img src="${product.images[0]}" alt="${
      product.name
    }" style="max-width: 100%; max-height: 300px; object-fit: cover; border-radius: 8px;" />
          </div>
          
          <div style="text-align: center; margin-top: 30px;">
            <a href="${process.env.NEXTAUTH_URL}/products/${
      product.slug
    }" style="background: #000; color: #fff; padding: 12px 30px; text-decoration: none; border-radius: 4px; font-weight: bold;">View Product</a>
          </div>
        </div>
        
        <div style="text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; color: #999; font-size: 12px;">
          <p>&copy; ${new Date().getFullYear()} Yuvara. All rights reserved.</p>
        </div>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(
      `Marketing email sent to ${users.length} users for product ${product.name}`
    );
  } catch (error) {
    console.error("Error sending marketing email:", error);
    throw error;
  }
}

export const sendNewsletter = async (
  subject: string,
  htmlContent: string,
  recipients: string[]
) => {
  // Send individually to avoid exposing all emails in TO/CC field
  // Or use BCC if sending to many at once, but individual is better for deliverability/personalization potential
  // For bulk, many services recommend sending in batches. Here we'll loop for simplicity but in prod use a queue.

  const sendPromises = recipients.map((recipient) =>
    transporter.sendMail({
      from: `Yuvara <${process.env.EMAIL_FROM}>`,
      to: recipient,
      subject: subject,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="text-align: center; padding: 20px; background-color: #000; color: #fff;">
            <h1 style="margin: 0; font-size: 24px; letter-spacing: 2px;">YUVARA</h1>
          </div>
          <div style="padding: 40px 20px; background-color: #fff; color: #333; line-height: 1.6;">
            ${htmlContent}
          </div>
          <div style="text-align: center; padding: 20px; font-size: 12px; color: #666; border-top: 1px solid #eee;">
            <p>&copy; ${new Date().getFullYear()} Yuvara. All rights reserved.</p>
            <p>You are receiving this email because you subscribed to our newsletter.</p>
          </div>
        </div>
      `,
    })
  );

  try {
    await Promise.all(sendPromises);
    console.log(`Newsletter sent to ${recipients.length} recipients`);
  } catch (error) {
    console.error("Error sending newsletter:", error);
  }
};

export async function sendCustomerOrderConfirmation(order: any) {
  const NGN_RATE = 1500; // Hardcoded rate for email display consistency

  const mailOptions = {
    from: `Yuvara <${process.env.EMAIL_FROM}>`,
    to: order.shippingAddress?.email || order.user?.email, // Fallback to user email if shipping email not present
    subject: `Thank you for your order! Confirmation #${order._id}`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="text-align: center; padding: 20px 0; border-bottom: 1px solid #eee;">
          <h1 style="margin: 0; font-size: 28px; font-weight: 700; letter-spacing: 2px; color: #000;">YUVARA</h1>
        </div>
        
        <div style="padding: 20px 0;">
          <h2 style="color: #333; margin-top: 0;">Thank you for your order!</h2>
          <p style="color: #666;">We've received your order and will notify you once it ships.</p>
          
          <div style="background: #f9f9f9; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0;">Order Summary</h3>
            <p><strong>Order ID:</strong> ${order._id}</p>
            <p><strong>Date:</strong> ${new Date(
              order.createdAt
            ).toLocaleDateString()}</p>
            <p><strong>Total:</strong> ₦${order.total.toLocaleString()}</p>
          </div>

          <h3>Items Ordered</h3>
          <ul style="list-style: none; padding: 0;">
            ${order.items
              .map(
                (item: any) => `
              <li style="border-bottom: 1px solid #eee; padding: 10px 0; display: flex; justify-content: space-between;">
                <span>${item.name} (x${item.quantity})</span>
                <span>₦${(
                  item.price *
                  item.quantity *
                  NGN_RATE
                ).toLocaleString()}</span>
              </li>
            `
              )
              .join("")}
          </ul>
          
          <div style="margin-top: 20px; border-top: 1px solid #eee; padding-top: 20px;">
            <p><strong>Shipping Address:</strong><br>
            ${order.shippingAddress.street}<br>
            ${order.shippingAddress.city}, ${order.shippingAddress.state}<br>
            ${order.shippingAddress.country}</p>
          </div>
        </div>
        
        <div style="text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; color: #999; font-size: 12px;">
          <p>&copy; ${new Date().getFullYear()} Yuvara. All rights reserved.</p>
        </div>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Order confirmation sent to ${mailOptions.to}`);
  } catch (error) {
    console.error("Failed to send order confirmation", error);
  }
}

export async function sendOrderStatusUpdate(order: any) {
  const mailOptions = {
    from: `Yuvara <${process.env.EMAIL_FROM}>`,
    to: order.shippingAddress?.email || order.user?.email,
    subject: `Order Update: #${order._id}`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="text-align: center; padding: 20px 0; border-bottom: 1px solid #eee;">
          <h1 style="margin: 0; font-size: 28px; font-weight: 700; letter-spacing: 2px; color: #000;">YUVARA</h1>
        </div>
        
        <div style="padding: 20px 0;">
          <h2 style="color: #333; margin-top: 0;">Order Status Update</h2>
          <p style="color: #666; font-size: 16px;">
            Your order <strong>#${
              order._id
            }</strong> status has been updated to:
          </p>
          
          <div style="background: #f3f4f6; padding: 15px; border-radius: 8px; text-align: center; margin: 20px 0;">
            <span style="font-size: 20px; font-weight: bold; text-transform: uppercase; color: #000;">
              ${order.status}
            </span>
          </div>

          <p style="color: #666;">
            ${
              order.status === "shipped"
                ? "Your items are on their way! You will receive another notification when they arrive."
                : order.status === "delivered"
                ? "Your order has been delivered. We hope you enjoy your purchase!"
                : order.status === "cancelled"
                ? "Your order has been cancelled. If you have any questions, please contact support."
                : "We are processing your order."
            }
          </p>
          
          <div style="margin-top: 30px; text-align: center;">
            <a href="${process.env.NEXTAUTH_URL}/orders" 
               style="background: #000; color: #fff; padding: 12px 30px; text-decoration: none; border-radius: 4px; font-weight: bold;">
              View Order
            </a>
          </div>
        </div>
        
        <div style="text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; color: #999; font-size: 12px;">
          <p>&copy; ${new Date().getFullYear()} Yuvara. All rights reserved.</p>
        </div>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Order status update sent to ${mailOptions.to}`);
  } catch (error) {
    console.error("Failed to send order status update", error);
  }
}
