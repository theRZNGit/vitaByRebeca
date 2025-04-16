import { NextResponse } from "next/server";
import paypal from "@paypal/checkout-server-sdk";

const isLive = process.env.PAYPAL_MODE === "live";

const PAYPAL_CLIENT_ID = process.env.PAYPAL_CLIENT_ID || "";
const PAYPAL_CLIENT_SECRET = process.env.PAYPAL_CLIENT_SECRET || "";

// Removed unused PAYPAL_API variable

const environment = isLive
  ? new paypal.core.LiveEnvironment(PAYPAL_CLIENT_ID, PAYPAL_CLIENT_SECRET)
  : new paypal.core.SandboxEnvironment(PAYPAL_CLIENT_ID, PAYPAL_CLIENT_SECRET);

const client = new paypal.core.PayPalHttpClient(environment);

/**
 * Create PayPal Order (Step 1)
 */
export async function POST(req: Request) {
  try {
    const { amount } = await req.json();

    const request = new paypal.orders.OrdersCreateRequest();
    request.requestBody({
      intent: "CAPTURE",
      purchase_units: [
        {
          amount: {
            currency_code: "USD",
            value: amount.toString(),
          },
        },
      ],
    });

    const order = await client.execute(request);

    return NextResponse.json({ id: order.result.id });
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error("Error creating order:", error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ error: "An unknown error occurred" }, { status: 500 });
  }
}

/**
 * Capture PayPal Payment (Step 2)
 */

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    console.log("📦 Received PUT body:", body);

    const orderID = body.orderID || body.orderId || "";

    if (!orderID) {
      console.warn("⚠️ No order ID provided in request body.");
      return NextResponse.json({ error: "Expected an order id to be passed" }, { status: 400 });
    }

    const request = new paypal.orders.OrdersCaptureRequest(orderID);
    request.requestBody({});

    const capture = await client.execute(request);

    console.log("✅ Order captured:", {
      id: capture.result.id,
      status: capture.result.status,
      debug_id: capture.headers.get("PayPal-Debug-Id"),
    });

    return NextResponse.json({
      status: capture.result.status,
      details: capture.result,
    });
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error("❌ Error capturing order:", error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ error: "An unknown error occurred" }, { status: 500 });
  }
}

