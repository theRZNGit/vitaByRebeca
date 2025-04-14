import { useEffect, useState } from "react";

// Define Product Type
export interface Product {
  id: number;
  name: string;
  description: string;
  secondaryDescription?: string;
  images: string[]; // ✅ Update from image to images
  category: string;
  originalPrice: number;
  discount: string;
  price: number;
  sizes?: { label: string; price: number }[];
}


/*
// Hardcoded Product Details (Without Prices)
const productDetails: Product[] = [
  { id: 0, name: "PiMag Hydrogen", description: "whatever", image: "/images/PiDrogen.png", category: "agua" },
  { id: 1, name: "Pi Water", description: "whatever", image: "/images/Pi-Water.png", category: "agua" },
  { id: 2, name: "Optimizer", description: "whatever", image: "/images/PiMag-Optimizer.png", category: "agua" },
  { id: 3, name: "PiMag Waterfall", description: "- Libre de sedimentos, químicos y sabores", image: "/images/PiMag-Waterfall.png", category: "agua" },
  { id: 4, name: "Kenko Air Purifier", description: "whatever", image: "/images/Kenko-Air.png", category: "aire" },
  { id: 5, name: "Kenko Sleep", description: "whatever", image: "/images/Colchon.png", category: "descanso" },
  { id: 6, name: "Kenko Sleep Comforter", description: "whatever", image: "/images/product3.jpg", category: "descanso" },
  { id: 7, name: "Repuesto Optimizer", description: "whatever", image: "/images/product3.jpg", category: "repuestos" },
  { id: 8, name: "Repuesto Kenko Air", description: "whatever", image: "/images/product3.jpg", category: "repuestos" },
  { id: 9, name: "Repuesto PiMag Aqua Pour", description: "whatever", image: "/images/product3.jpg", category: "repuestos" },
  { id: 10, name: "Repuesto PiMag Waterfall", description: "whatever", image: "/images/product3.jpg", category: "repuestos" },
  { id: 11, name: "Repuesto PiMag Piwater", description: "whatever", image: "/images/product3.jpg", category: "repuestos" },
  { id: 12, name: "Repuesto PiMag", description: "whatever", image: "/images/product3.jpg", category: "repuestos" },
];
*/

// Hook to Fetch Products Directly from Redis
export function useProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchProducts() {
      try {
        const response = await fetch("/api/products");
        const data = await response.json();

        if (data.products && Array.isArray(data.products)) {
          const updatedProducts = data.products.map((product: Product) => {
            const originalPrice = product.originalPrice ?? 0;
            const discount = product.discount ?? "0";

            return {
              ...product,
              image: product.images,
              price: Math.max(
                originalPrice -
                  (discount.endsWith("%")
                    ? (originalPrice * parseFloat(discount)) / 100
                    : parseFloat(discount) || 0),
                0
              ),
              sizes: product.sizes ?? [], // ✅ Ensure sizes are always an array
              secondaryDescription: product.secondaryDescription || "",
            };
          });

          setProducts(updatedProducts);
        } else {
          console.error("Invalid product data received:", data);
        }
      } catch (error) {
        console.error("Failed to fetch products", error);
      } finally {
        setLoading(false);
      }
    }

    fetchProducts();
  }, []);

  return { products, loading };
}

