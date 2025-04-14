"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useCart } from "@/context/CartContext";
import MarkdownIt from "markdown-it";
import '@/styles/globals.css';
import "react-responsive-carousel/lib/styles/carousel.min.css"; 
import { Carousel } from "react-responsive-carousel";

const md = new MarkdownIt({
  html: true,
  breaks: true,
});

interface Product {
  category: string;
  id: number;
  name: string;
  description: string;
  secondaryDescription?: string;
  images: string[];
  originalPrice: number;
  discount: string;
  price: number;
  sizes?: { label: string; price: number }[]; // ✅ updated
}

interface CartItem extends Product {
  quantity: number;
  selectedSize?: string;
  price: number; // ✅ add this to ensure correct pricing at checkout
}

export default function ProductPage() {
  const { id } = useParams();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const { addToCart } = useCart();
  const [selectedSize, setSelectedSize] = useState<string>("");
  const [showPopup, setShowPopup] = useState(false);

  useEffect(() => {
    if (!id) return;

    async function fetchProduct() {
      try {
        const response = await fetch(`/api/products/${id}`);
        const data = await response.json();

        if (!data.error) {
          setProduct({
            ...data,
            category: data.category || "uncategorized",
            images: Array.isArray(data.images) ? data.images : ["/images/placeholder.png"], // Ensure images is an array
            sizes: Array.isArray(data.sizes) ? data.sizes : [],
            secondaryDescription: data.secondaryDescription || "",
            price: Math.max(
              data.originalPrice -
                (data.discount.endsWith('%') 
                  ? (data.originalPrice * parseFloat(data.discount) / 100) 
                  : parseFloat(data.discount)
                ),
              0
            ),
          });
        }
      } catch (error) {
        console.error("Error fetching product:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchProduct();
  }, [id]);

  const handleAddToCart = () => {
    if (!product) return;
  
    if (product.sizes && product.sizes.length > 0 && !selectedSize) {
      alert("Por favor, selecciona un tamaño antes de añadir al carrito.");
      return;
    }
  
    const selectedSizePrice = product.sizes?.find((s) => s.label === selectedSize)?.price;
  
    const cartItem: CartItem = {
      ...product,
      quantity,
      selectedSize: selectedSize || undefined,
      price: selectedSizePrice ?? product.price, // ✅ this ensures the correct price is passed to cart
    };
  
    addToCart(cartItem);
  };  

  if (loading) {
    return <p className="text-center text-gray-500">Cargando producto...</p>;
  }

  if (!product) {
    return <p className="text-center text-gray-500">Producto no encontrado</p>;
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex flex-col lg:flex-row items-center gap-8">
        {/* Product Images Carousel */}
        <div className="w-96">
        <Carousel
          showThumbs={true}
          infiniteLoop
          useKeyboardArrows
          autoPlay
          dynamicHeight
          className="rounded-md shadow-md custom-carousel"  // ✅ Apply custom class
        >
          {product.images.map((image, index) => (
            <div key={index}>
              <img
                src={image}
                alt={`${product.name} - ${index + 1}`}
                className="w-96 h-96 object-contain"
              />
            </div>
          ))}
        </Carousel>
        </div>
        {/* Product Details */}
        <div className="max-w-lg">
          <h1 className="text-4xl font-bold text-black">{product.name}</h1>
          <div className="mt-4 max-h-48 overflow-y-auto border border-gray-300 rounded-md p-2">
            <div
              className="prose prose-lg text-gray-700"
              dangerouslySetInnerHTML={{ __html: md.render(product.description || "") }}
            />
          </div>

          <button
            onClick={() => setShowPopup(true)}
            className="mt-4 bg-gray-200 text-black px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-300 transition"
          >
            Características y Beneficios
          </button>

          {showPopup && (
            <div
              onClick={() => setShowPopup(false)}
              className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
            >
              <div
                onClick={(e) => e.stopPropagation()}
                className="bg-white rounded-2xl shadow-xl p-6 w-[90%] max-w-lg relative"
              >
                <button
                  onClick={() => setShowPopup(false)}
                  className="absolute top-2 right-2 text-gray-500 hover:text-gray-700 text-xl"
                >
                  ✕
                </button>
                <h2 className="text-2xl font-semibold mb-4 text-black">Características y Beneficios</h2>
                <div
                  className="prose text-gray-700 max-h-[400px] overflow-y-auto"
                  dangerouslySetInnerHTML={{ __html: md.render(product.secondaryDescription || "") }}
                />
              </div>
            </div>
          )}

          {/* Price Section */}
          <div className="mt-4">
            {product.discount !== "0" && (
              <p className="text-gray-500 line-through text-xl">
                ${product.originalPrice.toFixed(2)}
              </p>
            )}
            <p className="text-3xl font-semibold text-primary">
              ${(
                product.sizes?.find((s) => s.label === selectedSize)?.price ??
                product.price
              ).toFixed(2)}
            </p>
          </div>

          {/* Size Selector */}
          {product.sizes && product.sizes.length > 0 && (
            <div className="mt-4">
              <label className="text-black text-lg font-medium">Tamaño:</label>
              <select
                className="text-black w-full p-2 border rounded-lg mt-2"
                value={selectedSize}
                onChange={(e) => setSelectedSize(e.target.value)}
              >
                <option value="">Selecciona un tamaño</option>
                {product.sizes.map((size) => (
                  <option key={size.label} value={size.label}>
                    {size.label} - ${size.price.toFixed(2)}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Quantity Selector */}
          <div className="mt-4 flex items-center gap-4">
            <label className="text-black text-lg font-medium">Cantidad:</label>
            <input
              type="number"
              min="1"
              value={quantity}
              onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
              className="text-black w-16 text-center p-2 border rounded-lg"
            />
          </div>

          <button
            onClick={handleAddToCart}
            className="mt-6 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition w-full"
          >
            Añadir al carrito
          </button>
        </div>
      </div>
    </div>
  );
}

