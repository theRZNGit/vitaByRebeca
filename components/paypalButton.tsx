"use client";

import { useEffect, useState } from "react";
import { Product } from "@/context/CartContext"; // ✅ Import Product Type

declare global {
  interface Window {
    paypal?: {
      Buttons: (options: {
        createOrder: () => Promise<string>;
        onApprove: (
          data: { orderID?: string; orderId?: string },
        ) => Promise<void>;
        onError: (err: Error) => void;
      }) => {
        render: (selector: string) => void;
      };
    };
  }
}

interface PayPalButtonProps {
  total: number;
  cartItems: Product[];
}

export default function PayPalButton({ total, cartItems }: PayPalButtonProps) {
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (window.paypal) {
      setLoaded(true);
    } else {
      const script = document.createElement("script");
      script.src = `https://www.paypal.com/sdk/js?client-id=${process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID}&currency=USD&intent=capture&components=buttons,hosted-fields&enable-funding=card&debug=true`;
      script.async = true;
      script.onload = () => setLoaded(true);
      document.body.appendChild(script);
    }
  }, []);

  useEffect(() => {
    if (loaded && window.paypal) {
      window.paypal
        .Buttons({
          createOrder: async (): Promise<string> => {
            const res = await fetch("/api/paypal", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ amount: total.toFixed(2), cartItems }),
            });

            const data = await res.json();
            console.log("🧾 createOrder response:", data);

            if (!data.id) {
              throw new Error("❌ Failed to create PayPal order. No ID returned.");
            }

            return data.id;
          },

          onApprove: async (
            data: { orderID?: string; orderId?: string },
          ): Promise<void> => {
            const orderID = data.orderID || data.orderId;

            if (!orderID) {
              console.warn("🚨 No valid orderID passed to onApprove.");
              return;
            }

            const res = await fetch("/api/paypal", {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ orderID }),
            });

            const response = await res.json();
            console.log("📦 capture response:", response);

            if (response.status === "COMPLETED") {
              alert("✅ Payment successful!");
            } else {
              alert("⚠️ Payment not completed.");
            }
          },

          onError: (err: Error) => {
            console.error("❌ PayPal Button Error:", err);
          },
        })
        .render("#paypal-button-container");
    }
  }, [loaded, total, cartItems]);

  return <div id="paypal-button-container" />;
}
