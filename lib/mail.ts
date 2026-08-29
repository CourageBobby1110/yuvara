import nodemailer from "nodemailer";

// Formats absolute URLs safely, handling missing NEXTAUTH_URL or trailing slashes
function getFormattedUrl(path: string): string {
  const base = (process.env.NEXTAUTH_URL || "http://localhost:3000").replace(/\/+$/, "");
  const cleanPath = path.replace(/^\/+/, "");
  return `${base}/${cleanPath}`;
}

// Helper to parse "YuVara <email@domain.com>" or "email@domain.com"
function parseSender(fromStr?: string) {
  const defaultFrom = process.env.EMAIL_FROM || "contact@yuvara.com.ng";
  const str = fromStr || `YuVara <${defaultFrom}>`;
  const match = str.match(/^(?:"?([^"]*)"?\s)?<?([^>]+)>?$/);
  if (match) {
    return {
      name: match[1]?.trim() || "YuVara",
      email: match[2]?.trim() || defaultFrom,
    };
  }
  return { name: "YuVara", email: defaultFrom };
}

// 1. Primary: Brevo HTTP REST API (Instant delivery, no SMTP port timeouts)
async function sendViaBrevoAPI(mailOptions: any): Promise<boolean> {
  const brevoApiKey =
    process.env.BREVO_API_KEY ||
    process.env.BREVO_KEY ||
    process.env.SENDINBLUE_API_KEY ||
    (process.env.BREVO_SERVER_PASSWORD?.startsWith("xkeysib-")
      ? process.env.BREVO_SERVER_PASSWORD
      : undefined);

  if (!brevoApiKey) return false;

  const sender = parseSender(mailOptions.from);

  // Format recipients
  let toList: { email: string; name?: string }[] = [];
  if (mailOptions.to) {
    const rawToList = Array.isArray(mailOptions.to)
      ? mailOptions.to
      : mailOptions.to.split(",");
    toList = rawToList
      .map((t: string) => t.trim())
      .filter(Boolean)
      .map((email: string) => ({ email }));
  }

  let bccList: { email: string }[] | undefined;
  if (mailOptions.bcc) {
    const rawBccList = Array.isArray(mailOptions.bcc)
      ? mailOptions.bcc
      : mailOptions.bcc.split(",");
    bccList = rawBccList
      .map((t: string) => t.trim())
      .filter(Boolean)
      .map((email: string) => ({ email }));
  }

  // If no direct TO is provided (e.g. BCC broadcast), set TO to sender
  if (toList.length === 0 && bccList && bccList.length > 0) {
    toList = [{ email: sender.email, name: sender.name }];
  }

  if (toList.length === 0) return false;

  const payload: any = {
    sender,
    to: toList,
    subject: mailOptions.subject,
    htmlContent: mailOptions.html,
  };

  if (mailOptions.text) {
    payload.textContent = mailOptions.text;
  }
  if (bccList && bccList.length > 0) {
    payload.bcc = bccList;
  }

  console.log(`[Brevo API] Sending email to ${toList.map(t => t.email).join(", ")} (BCC: ${bccList?.length || 0})...`);
  const response = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      "api-key": brevoApiKey,
      "Content-Type": "application/json",
      accept: "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    console.warn(`[Brevo API Error ${response.status}]`, errData);
    throw new Error(`Brevo API Error (${response.status}): ${JSON.stringify(errData)}`);
  }

  const data = await response.json().catch(() => ({}));
  console.log(`[Brevo API] Email dispatched successfully:`, data?.messageId || "OK");
  return true;
}

// Helper to send mail reliably with Brevo-first strategy
async function sendMailWithRetry(mailOptions: any) {
  // 1. Try Brevo REST API first (fastest, guaranteed HTTP response)
  try {
    const sent = await sendViaBrevoAPI(mailOptions);
    if (sent) return;
  } catch (apiError: any) {
    console.warn("[Brevo API Failed, trying SMTP]", apiError.message);
  }

  const configs: any[] = [];

  // 2. Brevo SMTP configs (Primary SMTP)
  if (process.env.BREVO_SERVER_USER && process.env.BREVO_SERVER_PASSWORD) {
    const brevoPorts = [587, 465, 2525, 25];
    for (const port of brevoPorts) {
      configs.push({
        name: `Brevo SMTP (Port ${port})`,
        host: process.env.BREVO_SERVER_HOST || "smtp-relay.brevo.com",
        port: port,
        secure: port === 465,
        auth: {
          user: process.env.BREVO_SERVER_USER,
          pass: process.env.BREVO_SERVER_PASSWORD,
        },
        tls: {
          rejectUnauthorized: false,
        },
      });
    }
  }

  // 3. Optional fallback: Gmail configs (only if Brevo is not configured)
  if (configs.length === 0 && process.env.GMAIL_SERVER_USER && process.env.GMAIL_SERVER_PASSWORD) {
    const gmailPorts = [465, 587];
    for (const port of gmailPorts) {
      configs.push({
        name: `Gmail (Port ${port})`,
        host: process.env.GMAIL_SERVER_HOST || "smtp.gmail.com",
        port: port,
        secure: port === 465,
        auth: {
          user: process.env.GMAIL_SERVER_USER,
          pass: process.env.GMAIL_SERVER_PASSWORD,
        },
        tls: {
          rejectUnauthorized: false,
        },
      });
    }
  }

  let lastError: Error | null = null;

  for (const config of configs) {
    try {
      console.log(`Attempting to send email via ${config.name}...`);
      const transporter = nodemailer.createTransport(config);

      // Verify connection configuration
      await transporter.verify();

      // Attempt to send
      await transporter.sendMail(mailOptions);
      console.log(`Email successfully sent via ${config.name} to ${mailOptions.to || mailOptions.bcc}`);
      return; // Success, exit function
    } catch (error: any) {
      console.warn(`Failed to send email via ${config.name}:`, error.message);
      lastError = error;
    }
  }

  throw new Error(`Failed to send email after trying Brevo and SMTP. Last error: ${lastError?.message}`);
}

export async function sendMail({
  to,
  subject,
  html,
  text,
}: {
  to: string;
  subject: string;
  html: string;
  text?: string;
}) {
  const mailOptions = {
    from: `Yuvara <${process.env.EMAIL_FROM}>`,
    to,
    subject,
    html,
    text,
  };
  await sendMailWithRetry(mailOptions);
}

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

  await sendMailWithRetry(mailOptions);
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
            <a href="${getFormattedUrl(`/products/${product.slug}`)}" style="background: #000; color: #fff; padding: 12px 30px; text-decoration: none; border-radius: 4px; font-weight: bold;">Shop Now</a>
          </div>
        </div>
        
        <div style="text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; color: #999; font-size: 12px;">
          <p>&copy; ${new Date().getFullYear()} Yuvara. All rights reserved.</p>
        </div>
      </div>
    `,
  };

  try {
    await sendMailWithRetry(mailOptions);
    console.log(
      `Newsletter sent to ${users.length} users for product ${product.name}`
    );
  } catch (error) {
    console.error("Failed to send newsletter", error);
  }
}

export async function sendTargetedProductNotification(
  product: any,
  users: any[],
  options?: {
    additionalProducts?: any[];
    subject?: string;
    headline?: string;
  }
) {
  const bccList = users.map((u) => u.email).filter(Boolean).join(",");

  if (!bccList) return;

  // 1. Fetch additional catalogue products if not provided (up to 24 products)
  let catalogue: any[] = options?.additionalProducts || [];
  if (catalogue.length === 0) {
    try {
      const ProductModel = (await import("@/models/Product")).default;
      const dbCatalogue = await ProductModel.find({
        _id: { $ne: product._id },
        isActive: { $ne: false },
      })
        .sort({ isFeatured: -1, price: 1 })
        .limit(24)
        .lean();
      catalogue = dbCatalogue;
    } catch (err) {
      console.error("Error fetching catalogue for promotional email:", err);
    }
  }

  const { getProductMainImage } = await import("@/lib/utils");

  const resolveEmailImgUrl = (raw: any): string => {
    const main = getProductMainImage(raw);
    if (!main || main === "/placeholder.png") {
      return getFormattedUrl("/placeholder.png");
    }
    if (main.startsWith("http://") || main.startsWith("https://")) {
      return main;
    }
    return getFormattedUrl(main);
  };

  const mainProductImg = resolveEmailImgUrl(product);
  const mainProductUrl = getFormattedUrl(`/products/${product.slug}`);
  const allCollectionsUrl = getFormattedUrl("/collections");
  const origMainPrice = (product.price * 1.75).toFixed(2);

  // Combine primary product + catalogue items into a seamless 2-column collection (up to 24 items)
  const allDisplayItems = [
    product,
    ...catalogue.filter((p) => p._id.toString() !== product._id.toString()),
  ].slice(0, 24);

  // Generate clean, breathable 2-column product grid
  let catalogueHtml = "";
  for (let i = 0; i < allDisplayItems.length; i += 2) {
    const itemA = allDisplayItems[i];
    const itemB = allDisplayItems[i + 1];

    const imgA = resolveEmailImgUrl(itemA);
    const urlA = getFormattedUrl(`/products/${itemA.slug}`);
    const origPriceA = ((itemA.price || 20) * 1.6).toFixed(2);

    let colBHtml = "";
    if (itemB) {
      const imgB = resolveEmailImgUrl(itemB);
      const urlB = getFormattedUrl(`/products/${itemB.slug}`);
      const origPriceB = ((itemB.price || 20) * 1.6).toFixed(2);

      colBHtml = `
        <td width="50%" valign="top" style="padding: 4px; box-sizing: border-box;">
          <div style="background-color: #ffffff; text-align: left;">
            <a href="${urlB}" style="text-decoration: none; display: block;">
              <img class="prod-img" src="${imgB}" alt="${itemB.name}" style="width: 100%; height: 180px; object-fit: cover; border-radius: 4px; display: block; background-color: #f7f7f8;" />
              <div style="padding: 6px 2px 12px;">
                <div style="font-size: 12px; font-weight: 600; color: #1f2937; line-height: 1.35; height: 32px; overflow: hidden; text-overflow: ellipsis;">
                  ${itemB.name}
                </div>
                <div style="margin-top: 4px; font-size: 13px; font-weight: 800; color: #111827;">
                  $${Number(itemB.price).toFixed(2)}
                  <span style="font-size: 10px; color: #9ca3af; text-decoration: line-through; margin-left: 4px; font-weight: 400;">
                    $${origPriceB}
                  </span>
                </div>
              </div>
            </a>
          </div>
        </td>
      `;
    } else {
      colBHtml = `<td width="50%" style="padding: 4px;"></td>`;
    }

    catalogueHtml += `
      <tr>
        <td width="50%" valign="top" style="padding: 4px; box-sizing: border-box;">
          <div style="background-color: #ffffff; text-align: left;">
            <a href="${urlA}" style="text-decoration: none; display: block;">
              <img class="prod-img" src="${imgA}" alt="${itemA.name}" style="width: 100%; height: 180px; object-fit: cover; border-radius: 4px; display: block; background-color: #f7f7f8;" />
              <div style="padding: 6px 2px 12px;">
                <div style="font-size: 12px; font-weight: 600; color: #1f2937; line-height: 1.35; height: 32px; overflow: hidden; text-overflow: ellipsis;">
                  ${itemA.name}
                </div>
                <div style="margin-top: 4px; font-size: 13px; font-weight: 800; color: #111827;">
                  $${Number(itemA.price).toFixed(2)}
                  <span style="font-size: 10px; color: #9ca3af; text-decoration: line-through; margin-left: 4px; font-weight: 400;">
                    $${origPriceA}
                  </span>
                </div>
              </div>
            </a>
          </div>
        </td>
        ${colBHtml}
      </tr>
    `;
  }

  const subject = options?.subject || `Curated Products For You — YuVara`;
  const headline = options?.headline || "Featured Collection";

  const mailOptions = {
    from: `YuVara <${process.env.EMAIL_FROM}>`,
    bcc: bccList,
    subject: subject,
    html: `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${subject}</title>
        <style>
          body { margin: 0; padding: 0; background-color: #ffffff; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-text-size-adjust: 100%; }
          table { border-collapse: collapse; mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
          img { border: 0; height: auto; line-height: 100%; outline: none; text-decoration: none; }
          a { text-decoration: none; color: inherit; }
          @media only screen and (max-width: 480px) {
            .container { width: 100% !important; padding: 0 4px !important; }
            .prod-img { height: 160px !important; }
            .header-pad { padding: 16px 8px 12px !important; }
          }
        </style>
      </head>
      <body style="margin: 0; padding: 0; background-color: #ffffff; color: #111827;">
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #ffffff;">
          <tr>
            <td align="center" style="padding: 0;">
              <table class="container" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
                
                <!-- HEADER -->
                <tr>
                  <td class="header-pad" align="center" style="padding: 24px 12px 14px; border-bottom: 1px solid #f0f0f0;">
                    <a href="${allCollectionsUrl}" style="text-decoration: none; display: inline-block;">
                      <span style="font-size: 20px; font-weight: 800; letter-spacing: 2px; color: #111111; text-transform: uppercase;">
                        YU<span style="color: #996515;">VARA</span>
                      </span>
                    </a>
                    <div style="font-size: 11px; color: #6b7280; margin-top: 4px; letter-spacing: 0.5px;">
                      ${headline}
                    </div>
                  </td>
                </tr>

                <!-- 2-COLUMN PRODUCT GRID (Broad & Breathable) -->
                <tr>
                  <td style="padding: 10px 2px 20px;">
                    <table width="100%" cellpadding="0" cellspacing="0" border="0">
                      ${catalogueHtml}
                    </table>
                  </td>
                </tr>

                <!-- EXPLORE ALL BUTTON -->
                <tr>
                  <td align="center" style="padding: 10px 12px 28px;">
                    <a href="${allCollectionsUrl}" style="display: inline-block; background-color: #111827; color: #ffffff; font-size: 12px; font-weight: 700; padding: 12px 32px; border-radius: 9999px; text-transform: uppercase; letter-spacing: 0.5px; text-decoration: none;">
                      Shop Entire Collection &rarr;
                    </a>
                  </td>
                </tr>

                <!-- MINIMAL FOOTER -->
                <tr>
                  <td align="center" style="padding: 20px 12px; border-top: 1px solid #f0f0f0; font-size: 11px; color: #9ca3af; line-height: 1.5;">
                    <p style="margin: 0 0 4px 0;">YuVara &bull; Curated Essentials</p>
                    <p style="margin: 0;">You received this email because you are a registered customer.</p>
                  </td>
                </tr>

              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `,
  };

  try {
    await sendMailWithRetry(mailOptions);
    console.log(
      `Marketing catalogue email sent to ${users.length} users for spotlight product ${product.name}`
    );
  } catch (error) {
    console.error("Error sending marketing catalogue email:", error);
    throw error;
  }
}

export const sendNewsletter = async (
  subject: string,
  htmlContent: string,
  textContent: string,
  recipients: string[]
) => {
  // Send individually to avoid exposing all emails in TO/CC field
  // Or use BCC if sending to many at once, but individual is better for deliverability/personalization potential
  // For bulk, many services recommend sending in batches. Here we'll loop for simplicity but in prod use a queue.

  const sendPromises = recipients.map((recipient) =>
    sendMailWithRetry({
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
        </div>
      `,
      text: textContent,
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

  let isGuest = false;
  try {
    const User = (await import("@/models/User")).default;
    const dbUser = await User.findById(order.user);
    isGuest = dbUser?.isGuest || false;
  } catch (err) {
    console.error("Failed to check if user is guest in sendCustomerOrderConfirmation", err);
  }

  // Enrich items with shipping rates dynamically from database
  let enrichedItems: any[] = [];
  try {
    const ProductModel = (await import("@/models/Product")).default;
    const { getItemShippingRateUSD } = await import("@/lib/utils");
    const countryCode = order.shippingAddress?.country || "NG";

    enrichedItems = await Promise.all(
      order.items.map(async (item: any) => {
        let shippingUSD = 0;
        try {
          const product = await ProductModel.findById(item.product).lean() as any;
          if (product) {
            const selectedVariant = item.cjVid && product.variants
              ? product.variants.find((v: any) => v.cjVid === item.cjVid)
              : null;
            
            shippingUSD = getItemShippingRateUSD(
              {
                shippingRates: product.shippingRates,
                variant: selectedVariant || undefined,
              },
              countryCode
            );
          } else {
            shippingUSD = 10;
          }
        } catch (e) {
          console.error("Error fetching product for confirmation email:", e);
          shippingUSD = 10; // Fallback
        }
        
        return {
          name: item.name,
          quantity: item.quantity,
          price: item.price,
          image: item.image || "",
          cjVid: item.cjVid || "",
          product: item.product,
          priceWithShipping: (item.price || 0) + shippingUSD,
        };
      })
    );
  } catch (enrichError) {
    console.error("Failed to enrich items with shipping for email:", enrichError);
    // Safe fallback to base prices if enrichment fails
    enrichedItems = order.items.map((item: any) => ({
      name: item.name,
      quantity: item.quantity,
      price: item.price,
      image: item.image || "",
      cjVid: item.cjVid || "",
      product: item.product,
      priceWithShipping: item.price || 0,
    }));
  }

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
          
          ${isGuest ? `
          <div style="background: #f9f9f9; padding: 20px; border-radius: 8px; margin: 20px 0; border: 1px solid #e0e0e0; text-align: center;">
            <h3 style="margin-top: 0; color: #000;">Complete Your Registration</h3>
            <p style="color: #666; font-size: 14px;">Create a password to track your order, earn rewards, and secure your account.</p>
            <a href="${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/auth/signup?email=${encodeURIComponent(order.shippingAddress?.email || '')}" 
               style="background: #000; color: #fff; padding: 12px 30px; text-decoration: none; border-radius: 4px; font-weight: bold; display: inline-block; margin-top: 10px;">
              Create Password
            </a>
          </div>
          ` : ''}

          <div style="background: #f9f9f9; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0;">Order Summary</h3>
            <p><strong>Order ID:</strong> ${order._id}</p>
            <p><strong>Date:</strong> ${new Date(
              order.createdAt
            ).toLocaleDateString()}</p>
            <p><strong>Total:</strong> ₦${order.total.toLocaleString()}</p>
            <p><strong>Estimated Delivery:</strong> 1-14 Days</p>
            <p style="font-size: 13px; color: #666; margin-top: 12px; border-top: 1px solid #ddd; padding-top: 12px; line-height: 1.5;">
              <strong>Delivery Policy:</strong> Standard delivery timeline is 1-14 days. In the event that delivery is not completed within 90 days, a <strong>full refund</strong> of your money will be processed immediately.
            </p>
          </div>

          <h3 style="margin-top: 25px; margin-bottom: 10px; font-size: 16px; color: #111827; text-transform: uppercase; letter-spacing: 0.05em;">Items Ordered</h3>
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
            <thead>
              <tr style="border-bottom: 2px solid #111827; text-align: left;">
                <th style="padding: 10px 0; font-size: 13px; font-weight: 700; color: #4b5563; text-transform: uppercase;">Item</th>
                <th style="padding: 10px; font-size: 13px; font-weight: 700; color: #4b5563; text-transform: uppercase; text-align: center; width: 60px;">Qty</th>
                <th style="padding: 10px 0; font-size: 13px; font-weight: 700; color: #4b5563; text-transform: uppercase; text-align: right; width: 120px;">Price</th>
              </tr>
            </thead>
            <tbody>
              ${enrichedItems
                .map(
                  (item: any) => `
                <tr style="border-bottom: 1px solid #eaeaea;">
                  <td style="padding: 12px 0; font-size: 14px; color: #111827; vertical-align: middle;">
                    ${item.name}
                  </td>
                  <td style="padding: 12px; font-size: 14px; color: #4b5563; text-align: center; vertical-align: middle;">
                    ${item.quantity}
                  </td>
                  <td style="padding: 12px 0; font-size: 14px; font-weight: 600; color: #111827; text-align: right; vertical-align: middle;">
                    ₦${(
                      item.priceWithShipping *
                      item.quantity *
                      NGN_RATE
                    ).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                </tr>
              `
                )
                .join("")}
            </tbody>
          </table>

          <div style="background-color: #fafaf9; padding: 15px; border-radius: 8px; margin-bottom: 25px; border: 1px solid #f3f4f6;">
            <table style="width: 100%; font-size: 14px; line-height: 1.6;">
              <tr>
                <td style="color: #4b5563;">Subtotal (Shipping Fused)</td>
                <td style="text-align: right; font-weight: 600; color: #111827;">₦${order.total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
              </tr>
              <tr>
                <td style="color: #4b5563;">Shipping</td>
                <td style="text-align: right; font-weight: 700; color: #15803d;">FREE</td>
              </tr>
              <tr style="border-top: 1px solid #e5e7eb;">
                <td style="padding-top: 10px; font-weight: 700; color: #111827; font-size: 15px;">Total Paid</td>
                <td style="padding-top: 10px; text-align: right; font-weight: 800; color: #111827; font-size: 16px;">₦${order.total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
              </tr>
            </table>
          </div>
          
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
    await sendMailWithRetry(mailOptions);
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
    await sendMailWithRetry(mailOptions);
    console.log(`Order status update sent to ${mailOptions.to}`);
  } catch (error) {
    console.error("Failed to send order status update", error);
  }
}

export async function sendPasswordResetEmail(email: string, token: string) {
  const baseUrl = (
    process.env.NEXTAUTH_URL ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    "http://localhost:3000"
  ).replace(/\/+$/, "");

  const resetUrl = `${baseUrl}/auth/reset-password?token=${token}&email=${encodeURIComponent(
    email
  )}`;
  console.log(
    `Preparing to send password reset email to ${email} with link: ${resetUrl}`
  );

  const mailOptions = {
    from: `Yuvara <${process.env.EMAIL_FROM}>`,
    to: email,
    subject: "Reset Your Password - Yuvara",
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="text-align: center; padding: 20px 0; border-bottom: 1px solid #eee;">
          <h1 style="margin: 0; font-size: 28px; font-weight: 700; letter-spacing: 2px; color: #000;">YUVARA</h1>
        </div>
        
        <div style="padding: 20px 0;">
          <h2 style="color: #333; margin-top: 0;">Reset Your Password</h2>
          <p style="color: #666; line-height: 1.6;">
            We received a request to reset your password. Click the button below to create a new password:
          </p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" 
               style="background: #000; color: #fff; padding: 14px 40px; text-decoration: none; border-radius: 4px; font-weight: bold; display: inline-block;">
              Reset Password
            </a>
          </div>
          
          <p style="color: #666; line-height: 1.6;">
            Or copy and paste this link into your browser:
          </p>
          <p style="color: #999; word-break: break-all; font-size: 14px;">
            ${resetUrl}
          </p>
          
          <div style="background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0;">
            <p style="margin: 0; color: #856404; font-size: 14px;">
              <strong>⚠️ Security Notice:</strong> This link will expire in 1 hour. If you didn't request a password reset, please ignore this email.
            </p>
          </div>
        </div>
        
        <div style="text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; color: #999; font-size: 12px;">
          <p>&copy; ${new Date().getFullYear()} Yuvara. All rights reserved.</p>
        </div>
      </div>
    `,
  };

  try {
    await sendMailWithRetry(mailOptions);
    console.log(`Password reset email sent to ${email}`);
  } catch (error) {
    console.error("Failed to send password reset email", error);
    throw error;
  }
}

export async function sendContactFormNotification(
  name: string,
  email: string,
  message: string,
  messageId: string
) {
  const viewUrl = `${process.env.NEXTAUTH_URL}/admin/messages`;

  const mailOptions = {
    from: `Yuvara <${process.env.EMAIL_FROM}>`,
    to: process.env.EMAIL_FROM,
    subject: `New Contact Form Submission from ${name}`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="text-align: center; padding: 20px 0; border-bottom: 1px solid #eee;">
          <h1 style="margin: 0; font-size: 28px; font-weight: 700; letter-spacing: 2px; color: #000;">YUVARA</h1>
        </div>
        
        <div style="padding: 20px 0;">
          <h2 style="color: #333; margin-top: 0;">New Contact Form Submission</h2>
          <p style="color: #666; line-height: 1.6;">
            You have received a new message from your website contact form.
          </p>
          
          <div style="background: #f9f9f9; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0;">Contact Details</h3>
            <p style="margin: 10px 0;"><strong>Name:</strong> ${name}</p>
            <p style="margin: 10px 0;"><strong>Email:</strong> <a href="mailto:${email}" style="color: #000;">${email}</a></p>
          </div>

          <div style="background: #fff; border-left: 4px solid #000; padding: 15px; margin: 20px 0;">
            <h3 style="margin-top: 0;">Message</h3>
            <p style="color: #333; line-height: 1.6; white-space: pre-wrap;">${message}</p>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${viewUrl}" 
               style="background: #000; color: #fff; padding: 14px 40px; text-decoration: none; border-radius: 4px; font-weight: bold; display: inline-block;">
              View All Messages
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
    await sendMailWithRetry(mailOptions);
    console.log(
      `Contact form notification sent to admin for message ${messageId}`
    );
  } catch (error) {
    console.error("Failed to send contact form notification", error);
    throw error;
  }
}

export async function sendGiftCardEmail(giftCard: any) {
  const recipientEmail = giftCard.recipientEmail || giftCard.purchasedBy?.email;

  if (!recipientEmail) {
    console.error("No recipient email found for gift card", giftCard.code);
    return;
  }

  const mailOptions = {
    from: `Yuvara <${process.env.EMAIL_FROM}>`,
    to: recipientEmail,
    subject: `You've received a Gift Card!`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="text-align: center; padding: 20px 0; border-bottom: 1px solid #eee;">
          <h1 style="margin: 0; font-size: 28px; font-weight: 700; letter-spacing: 2px; color: #000;">YUVARA</h1>
        </div>
        
        <div style="padding: 20px 0;">
          <h2 style="color: #333; margin-top: 0;">You've received a Gift Card!</h2>
          ${
            giftCard.message
              ? `<p style="color: #666; font-style: italic;">"${giftCard.message}"</p>`
              : ""
          }
          
          <div style="background: #000; color: #fff; padding: 30px; border-radius: 12px; margin: 30px 0; text-align: center;">
            <p style="margin: 0; font-size: 14px; text-transform: uppercase; letter-spacing: 1px;">Gift Card Code</p>
            <h3 style="margin: 10px 0; font-size: 32px; letter-spacing: 4px; font-family: monospace;">${
              giftCard.code
            }</h3>
            <p style="margin: 10px 0 0; font-size: 24px; font-weight: bold;">₦${giftCard.initialBalance.toLocaleString()}</p>
          </div>
          
          <p style="color: #666; line-height: 1.6;">
            You can use this code to purchase items on our store. Simply enter the code at checkout.
          </p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.NEXTAUTH_URL}" 
               style="background: #000; color: #fff; padding: 14px 40px; text-decoration: none; border-radius: 4px; font-weight: bold; display: inline-block;">
              Start Shopping
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
    await sendMailWithRetry(mailOptions);
    console.log(`Gift card email sent to ${recipientEmail}`);
  } catch (error) {
    console.error("Failed to send gift card email", error);
    // Don't throw, just log, so we don't fail the request if email fails
  }
}

export async function sendVerificationEmail(email: string, token: string) {
  const baseUrl = (
    process.env.NEXTAUTH_URL ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    "http://localhost:3000"
  ).replace(/\/+$/, "");

  const verifyUrl = `${baseUrl}/verify-email?token=${token}`;
  console.log(
    `Preparing to send verification email to ${email} with link: ${verifyUrl}`
  );

  const mailOptions = {
    from: `Yuvara <${process.env.EMAIL_FROM}>`,
    to: email,
    subject: "Verify Your Email - Yuvara",
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="text-align: center; padding: 20px 0; border-bottom: 1px solid #eee;">
          <h1 style="margin: 0; font-size: 28px; font-weight: 700; letter-spacing: 2px; color: #000;">YUVARA</h1>
        </div>
        
        <div style="padding: 20px 0;">
          <h2 style="color: #333; margin-top: 0;">Verify Your Email Address</h2>
          <p style="color: #666; line-height: 1.6;">
            Welcome to Yuvara! Please click the button below to verify your email address and complete your registration:
          </p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${verifyUrl}" 
               style="background: #000; color: #fff; padding: 14px 40px; text-decoration: none; border-radius: 4px; font-weight: bold; display: inline-block;">
              Verify Email
            </a>
          </div>
          
          <p style="color: #666; line-height: 1.6;">
            Or copy and paste this link into your browser:
          </p>
          <p style="color: #999; word-break: break-all; font-size: 14px;">
            ${verifyUrl}
          </p>
          
          <div style="background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0;">
            <p style="margin: 0; color: #856404; font-size: 14px;">
              <strong>⚠️ Security Notice:</strong> This link will expire in 1 hour.
            </p>
          </div>
        </div>
        
        <div style="text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; color: #999; font-size: 12px;">
          <p>&copy; ${new Date().getFullYear()} Yuvara. All rights reserved.</p>
        </div>
      </div>
    `,
  };

  try {
    await sendMailWithRetry(mailOptions);
    console.log(`Verification email sent to ${email}`);
  } catch (error) {
    console.error("Failed to send verification email", error);
    throw error;
  }
}

export async function sendInvestmentWelcomeEmail(
  email: string,
  name: string,
  accessPin: string,
  initialAmount: number,
  password?: string
) {
  const loginUrl = `${process.env.NEXTAUTH_URL}/invest`;

  const mailOptions = {
    from: `Yuvara Investments <${process.env.EMAIL_FROM}>`,
    to: email,
    subject: "Welcome to Yuvara Investments - Your Account Details",
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="text-align: center; padding: 20px 0; border-bottom: 1px solid #eee;">
          <h1 style="margin: 0; font-size: 28px; font-weight: 700; letter-spacing: 2px; color: #000;">YUVARA</h1>
        </div>
        
        <div style="padding: 20px 0;">
          <h2 style="color: #333; margin-top: 0;">Investment Account Created</h2>
          <p style="color: #666; line-height: 1.6;">
            Dear ${name},<br>
            Your investment account has been successfully created. Here are your access details:
          </p>
          
          <div style="background: #f9f9f9; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p><strong>Initial Investment:</strong> ₦${initialAmount.toLocaleString()}</p>
            <p><strong>Access Pin (Serial Number):</strong> <span style="font-family: monospace; font-size: 16px; background: #eee; padding: 2px 6px; rounded: 4px;">${accessPin}</span></p>
            ${
              password
                ? `<p><strong>Password:</strong> <span style="font-family: monospace; font-size: 16px; background: #eee; padding: 2px 6px; rounded: 4px;">${password}</span></p>`
                : ""
            }
            <p><strong>Login URL:</strong> <a href="${loginUrl}">${loginUrl}</a></p>
          </div>

          <p style="color: #666; line-height: 1.6;">
            Please keep your Access Pin safe. You will need it along with your password to access your dashboard.
          </p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${loginUrl}" 
               style="background: #000; color: #fff; padding: 14px 40px; text-decoration: none; border-radius: 4px; font-weight: bold; display: inline-block;">
              Access Dashboard
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
    await sendMailWithRetry(mailOptions);
    console.log(`Investment welcome email sent to ${email}`);
  } catch (error) {
    console.error("Failed to send investment welcome email", error);
  }
}

export async function sendWithdrawalRequestEmail(
  investorName: string,
  investorEmail: string,
  amount: number,
  bankDetails: any
) {
  const adminEmail = process.env.EMAIL_FROM;

  // Email to Admin
  const adminMailOptions = {
    from: `Yuvara Investments <${process.env.EMAIL_FROM}>`,
    to: adminEmail,
    subject: `Withdrawal Request: ${investorName}`,
    html: `
      <h1>Withdrawal Request</h1>
      <p><strong>Investor:</strong> ${investorName} (${investorEmail})</p>
      <p><strong>Amount to Withdraw:</strong> ₦${amount.toLocaleString()}</p>
      
      <h3>Bank Details:</h3>
      <pre>${JSON.stringify(bankDetails, null, 2)}</pre>
      
      <p><a href="${
        process.env.NEXTAUTH_URL
      }/admin/investors">Manage Investors</a></p>
    `,
  };

  // Email to Investor
  const userMailOptions = {
    from: `Yuvara Investments <${process.env.EMAIL_FROM}>`,
    to: investorEmail,
    subject: "Withdrawal Request Received",
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="text-align: center; padding: 20px 0; border-bottom: 1px solid #eee;">
          <h1 style="margin: 0; font-size: 28px; font-weight: 700; letter-spacing: 2px; color: #000;">YUVARA</h1>
        </div>
        
        <div style="padding: 20px 0;">
          <h2 style="color: #333; margin-top: 0;">Withdrawal Request Received</h2>
          <p style="color: #666; line-height: 1.6;">
            Dear ${investorName},<br>
            We have received your request to withdraw <strong>₦${amount.toLocaleString()}</strong>.
          </p>
          <p style="color: #666; line-height: 1.6;">
            Our team will process your request shortly. You will be notified once the transfer is complete.
          </p>
        </div>
        
        <div style="text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; color: #999; font-size: 12px;">
          <p>&copy; ${new Date().getFullYear()} Yuvara. All rights reserved.</p>
        </div>
      </div>
    `,
  };

  try {
    await sendMailWithRetry(adminMailOptions);
    await sendMailWithRetry(userMailOptions);
    console.log(`Withdrawal emails sent for ${investorName}`);
  } catch (error) {
    console.error("Failed to send withdrawal emails", error);
  }
}

export async function sendIssueReportEmail(
  investorName: string,
  investorEmail: string,
  subject: string,
  message: string
) {
  const adminEmail = process.env.EMAIL_FROM;

  const mailOptions = {
    from: `Yuvara Investments <${process.env.EMAIL_FROM}>`,
    to: adminEmail,
    subject: `Issue Reported by ${investorName}: ${subject}`,
    html: `
      <h1>Issue Reported</h1>
      <p><strong>Investor:</strong> ${investorName} (${investorEmail})</p>
      <p><strong>Subject:</strong> ${subject}</p>
      
      <h3>Message:</h3>
      <div style="background: #f9f9f9; padding: 15px; border-left: 4px solid #d9534f;">
        <p style="white-space: pre-wrap;">${message}</p>
      </div>
      
      <p><a href="${process.env.NEXTAUTH_URL}/admin/investors">Manage Investors</a></p>
    `,
  };

  try {
    await sendMailWithRetry(mailOptions);
    console.log(`Issue report email sent from ${investorName}`);
  } catch (error) {
    console.error("Failed to send issue report email", error);
  }
}

export async function sendClaimAccountEmail(email: string, token: string) {
  const baseUrl = process.env.NEXTAUTH_URL;
  if (!baseUrl) {
    throw new Error("NEXTAUTH_URL is missing");
  }

  const claimUrl = `${baseUrl}/auth/claim-account?token=${token}&email=${encodeURIComponent(email)}`;

  const mailOptions = {
    from: `Yuvara <${process.env.EMAIL_FROM}>`,
    to: email,
    subject: "Complete your Yuvara Account Setup",
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="text-align: center; padding: 20px 0; border-bottom: 1px solid #eee;">
          <h1 style="margin: 0; font-size: 28px; font-weight: 700; letter-spacing: 2px; color: #000;">YUVARA</h1>
        </div>
        
        <div style="padding: 20px 0;">
          <h2 style="color: #333; margin-top: 0;">Thanks for shopping at Yuvara!</h2>
          <p style="color: #666; line-height: 1.6;">
            We noticed you placed an order as a guest. To track your orders and manage your details easily in the future, you can finish setting up your account by creating a password below.
          </p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${claimUrl}" 
               style="background: #000; color: #fff; padding: 14px 40px; text-decoration: none; border-radius: 4px; font-weight: bold; display: inline-block;">
              Create Password
            </a>
          </div>
          
          <p style="color: #666; line-height: 1.6;">
            Or copy and paste this link into your browser:
          </p>
          <p style="color: #999; word-break: break-all; font-size: 14px;">
            ${claimUrl}
          </p>
        </div>
        
        <div style="text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; color: #999; font-size: 12px;">
          <p>&copy; ${new Date().getFullYear()} Yuvara. All rights reserved.</p>
        </div>
      </div>
    `,
  };

  try {
    await sendMailWithRetry(mailOptions);
    console.log(`Account claim email sent to ${email}`);
  } catch (error) {
    console.error("Failed to send claim account email", error);
    throw error;
  }
}
