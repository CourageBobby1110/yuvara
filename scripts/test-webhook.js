const axios = require("axios");

const WEBHOOK_URL = "http://localhost:3000/api/webhooks/cj";

async function testWebhook() {
  try {
    console.log("Testing PRODUCT Update...");
    await axios.post(WEBHOOK_URL, {
      messageId: "test-msg-1",
      type: "PRODUCT",
      messageType: "UPDATE",
      params: {
        pid: "1705123663856537600", // Use a real PID from your DB if possible, or mock
        productNameEn: "Updated Product Name via Webhook",
        productSellPrice: 20.0,
      },
    });
    console.log("PRODUCT Update Sent.");

    console.log("Testing STOCK Update...");
    await axios.post(WEBHOOK_URL, {
      messageId: "test-msg-3",
      type: "STOCK",
      messageType: "UPDATE",
      params: {
        "SOME-VID-FROM-DB": [
          { storageNum: 100, areaEn: "US Warehouse" },
          { storageNum: 50, areaEn: "CN Warehouse" },
        ],
      },
    });
    console.log("STOCK Update Sent.");
  } catch (error) {
    console.error(
      "Webhook Test Failed:",
      error.response ? error.response.data : error.message
    );
  }
}

testWebhook();
