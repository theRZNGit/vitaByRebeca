import { Redis } from "@upstash/redis";
import { NextRequest, NextResponse } from "next/server";
import { put, del } from "@vercel/blob"; 


// Initialize Redis
const redis = Redis.fromEnv();

interface Product {
  id: number;
  name: string;
  description: string;
  secondaryDescription?: string;
  images: string[]; // ✅ Only using images array
  category: string;
  originalPrice: number;
  discount: string;
  price: number;
  sizes?: string[];
}

// GET: Fetch All Products with Correct Discount Applied
export async function GET() {
  try {
    const productsData = await redis.get("products");

    let products: Product[] = [];

    if (typeof productsData === "string") {
      products = JSON.parse(productsData);
    } else if (Array.isArray(productsData)) {
      products = productsData as Product[];
    }

    return NextResponse.json({
      products: products.map((product) => {
        const originalPrice = product.originalPrice || 0;
        const discount = product.discount || "0";

        const discountAmount = discount.endsWith("%")
          ? (originalPrice * parseFloat(discount)) / 100
          : parseFloat(discount) || 0;

        return {
          ...product,
          images: Array.isArray(product.images) ? product.images : [],
          price: Math.max(originalPrice - discountAmount, 0) || 0,
          sizes: Array.isArray(product.sizes) ? product.sizes : [],
          secondaryDescription: product.secondaryDescription || "", // ✅ Add secondary description
        };
      }),
    }, { status: 200 });
  } catch (error) {
    console.error("Error fetching products from Redis:", error);
    return NextResponse.json({ error: "Failed to fetch products" }, { status: 500 });
  }
}

// POST
export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get("content-type") || "";

    // ✅ Handle image upload separately
    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      const files = formData.getAll("file") as Blob[];
      const urls: string[] = [];

      for (const file of files) {
        if (file) {
          try {
            const fileName = `store-images/${Date.now()}-${Math.random().toString(36).substring(7)}`;
            const { url } = await put(fileName, file, { access: "public" });

            if (url) {
              console.log(`✅ Uploaded file URL: ${url}`);
              urls.push(url); // ✅ Store the URL
            }
          } catch (error) {
            console.error("Error uploading file:", error);
          }
        }
      }

      // ✅ Return the array of URLs
      return NextResponse.json({ urls }, { status: 200 });
    }

    // ✅ Handle product creation
    if (contentType.includes("application/json")) {
      const { product } = await req.json();
      console.log("📦 Creating new product:", product);

      if (!product || !product.id) {
        return NextResponse.json({ error: "Invalid product data" }, { status: 400 });
      }

      // Fetch existing products
      const productsData = await redis.get("products");
      let products: Product[] = [];

      if (typeof productsData === "string") {
        products = JSON.parse(productsData);
      } else if (Array.isArray(productsData)) {
        products = productsData as Product[];
      }

      // ✅ Use the provided images or placeholder
      const images = Array.isArray(product.images) ? product.images : [];

      const newProduct: Product = {
        ...product,
        images,
        sizes: Array.isArray(product.sizes)
          ? product.sizes.map((s: any) =>
              typeof s === "string"
                ? { label: s, price: product.originalPrice || 0 } // fallback for older formats
                : { label: s.label, price: s.price }
            )
          : [], // fallback if undefined
      };      

      // ✅ Add new product to list
      products.push(newProduct);

      await redis.set("products", JSON.stringify(products));
      console.log("✅ Product stored in Redis:", newProduct);

      return NextResponse.json(
        { message: "Product added successfully", product: newProduct },
        { status: 200 }
      );
    }

    return NextResponse.json({ error: "Invalid request format" }, { status: 400 });
  } catch (error) {
    console.error("❌ Error in POST request:", error);
    return NextResponse.json({ error: "Failed to process request" }, { status: 500 });
  }
}

// PUT: Update Products in Redis
export async function PUT(req: NextRequest) {
  try {
    const { products } = await req.json();

    if (!Array.isArray(products)) {
      return NextResponse.json({ error: "Invalid products format" }, { status: 400 });
    }

    // Fetch existing products from Redis
    const existingProductsData = await redis.get("products");
    let existingProducts: Product[] = [];

    if (typeof existingProductsData === "string") {
      existingProducts = JSON.parse(existingProductsData);
    } else if (Array.isArray(existingProductsData)) {
      existingProducts = existingProductsData as Product[];
    }

    // Update products with new data and maintain existing ones
    const updatedProducts = products.map((newProduct) => {
      const existingProduct = existingProducts.find((product) => product.id === newProduct.id);

      const originalPrice = newProduct.originalPrice || 0;
      const discount = newProduct.discount || "0";

      const discountAmount = discount.endsWith("%")
        ? (originalPrice * parseFloat(discount)) / 100
        : parseFloat(discount) || 0;

      const calculatedPrice = Math.max(originalPrice - discountAmount, 0);

      return {
        ...existingProduct, // Maintain existing data
        ...newProduct,      // Update with new data
        images: newProduct.images && newProduct.images.length > 0 
          ? newProduct.images  // Use uploaded images
          : existingProduct?.images || [], // Keep existing or placeholder
        price: calculatedPrice,
        sizes: Array.isArray(newProduct.sizes) ? newProduct.sizes : existingProduct?.sizes || [], // Merge sizes correctly
      };
    });

    await redis.set("products", JSON.stringify(updatedProducts));

    return NextResponse.json({ message: "Products updated successfully" }, { status: 200 });
  } catch (error) {
    console.error("Error saving products to Redis:", error);
    return NextResponse.json({ error: "Failed to update products" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { id } = await req.json();

    if (typeof id !== "number") {
      return NextResponse.json({ error: "Invalid product ID" }, { status: 400 });
    }

    // ✅ Fetch existing products
    const existingProductsData = await redis.get("products");
    const existingProducts = Array.isArray(existingProductsData)
      ? (existingProductsData as Product[])
      : typeof existingProductsData === "string"
      ? JSON.parse(existingProductsData)
      : [];

    // ✅ Find product to delete
    const productToDelete = existingProducts.find((product: { id: number }) => product.id === id);

    if (!productToDelete) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    // ✅ Delete all images if they exist and are not placeholders
    if (Array.isArray(productToDelete.images)) {
      for (const imageUrl of productToDelete.images) {
        if (imageUrl && !imageUrl.includes("/placeholder.png")) {
          try {
            console.log(`🔍 Attempting to delete blob: ${imageUrl}`);
            await del(imageUrl);
            console.log(`✅ Blob deleted successfully: ${imageUrl}`);
          } catch (blobError) {
            console.error(`❌ Error deleting blob (${imageUrl}):`, blobError);
            // ✅ Gracefully handle blob deletion failure but continue with Redis cleanup
          }
        }
      }
    }

    // ✅ Remove product from Redis
    const updatedProducts = existingProducts.filter((product: { id: number }) => product.id !== id);
    await redis.set("products", JSON.stringify(updatedProducts));

    return NextResponse.json({ message: "Product deleted successfully" }, { status: 200 });
  } catch (error) {
    console.error("❌ Error deleting product:", error);
    return NextResponse.json({ error: "Failed to delete product" }, { status: 500 });
  }
}














