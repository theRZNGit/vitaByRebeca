"use client";

import { useState, useEffect } from "react";
import {ImageUpload, MultipleImagesUpload} from "@/components/imageUpload";
//import { useProducts } from "../store/products"; // Fetch dynamic products
import { Product } from "../store/products"; // Ensure correct type

interface Article {
  id: number;
  title: string;
  content: string;
  date: string;
  image?: string; // ✅ Add image field
}

const AdminPage = () => {
  //const { products, loading } = useProducts(); // ✅ Get products
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [showPrices, setShowPrices] = useState(false);
  const [showBlog, setShowBlog] = useState(false);
  const [productData, setProductData] = useState<Product[]>([]);
  const [blogTitle, setBlogTitle] = useState("");
  const [blogContent, setBlogContent] = useState("");
  const [blogPosts, setBlogPosts] = useState<Article[]>([]);
  const [editingPost, setEditingPost] = useState<Article | null>(null);
  const [blogImage, setBlogImage] = useState<string | null>(null);
  const categories = ["aire", "agua", "descanso", "repuestos"];
  const hardcodedPassword = "123";

  // Stable useEffect dependencies (track length, not entire array)
  useEffect(() => {
    if (isAuthenticated && showPrices) {
      fetchProductsFromDB();
    }
  }, [isAuthenticated, showPrices]);
  
  const fetchProductsFromDB = async () => {
    try {
      const response = await fetch("/api/products");
      const data = await response.json();
  
      if (data.products && Array.isArray(data.products)) {
        setProductData(data.products);
      } else {
        console.error("Invalid product data:", data);
      }
    } catch (error) {
      console.error("Failed to fetch products:", error);
    }
  };    
  
  useEffect(() => {
    if (isAuthenticated && showBlog) {
      fetchBlogPosts();
    }
  }, [isAuthenticated, showBlog]);

  // ✅ Fetch Blog Posts
  const fetchBlogPosts = async () => {
    try {
      const response = await fetch("/api/blog");
      const data = await response.json();

      if (data.articles && Array.isArray(data.articles)) {
        setBlogPosts(data.articles);
      } else {
        setBlogPosts([]);
      }
    } catch (error) {
      console.error("Error fetching blog posts:", error);
      setBlogPosts([]);
    }
  };

  // ✅ Handle Login
  const handleLogin = () => {
    if (password === hardcodedPassword) {
      setIsAuthenticated(true);
    } else {
      alert("Incorrect password");
    }
  };

  // ✅ Toggle Sections
  const handleProductosClick = () => {
    setShowPrices(true);
    setShowBlog(false);
  };  

  const handleBlogClick = () => {
    setShowBlog(true);
    setShowPrices(false);
  };

  // Handle Blog Post Submission & Editing
  const handlePostBlog = async () => {
    if (!blogTitle || !blogContent) {
      alert("Please enter a title and content for the blog post.");
      return;
    }
  
    const newPost: Article = {
      id: editingPost ? editingPost.id : Date.now(),
      title: blogTitle,
      content: blogContent,
      date: new Date().toISOString(),
      image: blogImage || "",
    };
  
    try {
      let response;
  
      if (blogImage) {
        // ✅ Send as multipart/form-data if there's an image
        const formData = new FormData();
        
        formData.append("article", JSON.stringify(newPost));
  
        response = await fetch("/api/blog", {
          method: editingPost ? "PUT" : "POST",
          body: formData, // ✅ No need to set headers; `fetch` sets it automatically for FormData
        });
      } else {
        // ✅ Send as JSON if no image
        response = await fetch("/api/blog", {
          method: editingPost ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(newPost),
        });
      }
  
      if (response.ok) {
        alert(editingPost ? "Blog post updated!" : "Blog post added!");
        setBlogTitle("");
        setBlogContent("");
        setBlogImage(null);
        setEditingPost(null);
        fetchBlogPosts(); // ✅ Refresh list
      } else {
        const errorData = await response.json();
        console.error("Error processing post:", errorData);
        alert(errorData.error || "Error processing blog post.");
      }
    } catch (error) {
      console.error("Error:", error);
      alert("There was a problem processing the blog post.");
    }
  };  
    
  // Handle Edit
  const handleEditPost = (post: Article) => {
    setEditingPost(post);
    setBlogTitle(post.title);
    setBlogContent(post.content);
    setBlogImage(post.image || null);
  };
  
  // Handle Delete
  const handleDeletePost = async (id: number) => {
    if (!confirm("Are you sure you want to delete this post?")) return;
  
    try {
      const response = await fetch("/api/blog", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
  
      if (response.ok) {
        alert("Blog post deleted!");
        fetchBlogPosts(); // ✅ Refresh list
      } else {
        const errorData = await response.json();
        alert(errorData.error || "Error deleting blog post.");
      }
    } catch (error) {
      console.error("Error:", error);
      alert("There was a problem deleting the blog post.");
    }
  };   

  const handleCreateProduct = async () => {
    const newProduct: Product = {
      id: Date.now(),
      name: "Nuevo Producto",
      description: "Descripción del producto",
      secondaryDescription: "Beneficios y características",
      images: [], // ✅ Initialize as an empty array
      category: "uncategorized",
      originalPrice: 0,
      discount: "0",
      price: 0,
    };    
  
    try {
      const response = await fetch("/api/products", {
        method: "POST", // ✅ Change to POST for new product creation
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ product: newProduct }),
      });
  
      if (response.ok) {
        alert("Producto creado!");
        fetchProductsFromDB(); // ✅ Refresh live data
      } else {
        alert("Error al crear el producto.");
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Hubo un problema al crear el producto.");
    }
  };  

  const handleDeleteProduct = async (id: number) => {
    if (!confirm("¿Estás seguro de que quieres eliminar este producto?")) return;
  
    try {
      const response = await fetch("/api/products", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
  
      if (response.ok) {
        alert("Producto eliminado!");
        fetchProductsFromDB(); // ✅ Refresh live data
      } else {
        alert("Error al eliminar el producto.");
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Hubo un problema al eliminar el producto.");
    }
  };  

  const handlePriceChange = (id: number, field: "originalPrice" | "discount", value: string) => {
    setProductData((prevData) =>
      prevData.map((product) =>
        product.id === id
          ? {
              ...product,
              [field]: field === "originalPrice" ? parseFloat(value) || 0 : value,
              price: Math.max(
                (field === "originalPrice" ? parseFloat(value) || 0 : product.originalPrice ?? 0) -
                  (value.endsWith("%")
                    ? ((field === "originalPrice" ? parseFloat(value) || 0 : product.originalPrice ?? 0) *
                        parseFloat(value.replace("%", ""))) /
                      100
                    : parseFloat(value.replace("%", "")) || 0),
                0
              ),
            }
          : product
      )
    );
  };

  // Update images in a safer way, preserving existing ones if not replaced
  const handleProductChange = (
    id: number,
    field: "name" | "description" | "secondaryDescription" | "category" | "sizes" | "images",
    value: string | string[] | { label: string; price: number }[]
  ) => {
  console.log(`🔄 Updating product ${id}, field: ${field}, value:`, value); // ✅ Log updates
  setProductData((prevData) =>
    prevData.map((product) =>
      product.id === id
        ? {
            ...product,
            [field]: field === "sizes" || field === "images" ? (Array.isArray(value) ? value : [value]) : value,
          }
        : product
    )
  );
};
 

const handleSaveChanges = async () => {
  try {
    console.log("💾 Attempting to save the following product data:", productData); // ✅ Log full data

    const response = await fetch("/api/products", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        products: productData.map((product) => ({
          id: product.id,
          name: product.name,
          description: product.description,
          secondaryDescription: product.secondaryDescription,
          category: product.category,
          originalPrice: product.originalPrice,
          discount: product.discount,
          price: product.price,
          sizes: product.sizes ?? [], // ✅ Ensure sizes are always an array
          images: product.images && product.images.length > 0 ? product.images : [], // ✅ Use uploaded URLs or placeholder
        })),
      }),
    });

    if (response.ok) {
      alert("Productos actualizados!");
      console.log("✅ Products saved successfully.");
      fetchProductsFromDB(); // ✅ Refresh live data
    } else {
      const errorData = await response.json();
      console.error("❌ Error saving products:", errorData);
      alert(errorData.error || "Error al actualizar los productos.");
    }
  } catch (error) {
    console.error("❌ Error in handleSaveChanges:", error);
    alert("Hubo un problema al guardar los cambios.");
  }
};

    
  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="w-96 p-6 bg-gray-800 text-white rounded-lg shadow-lg">
          <h1 className="text-2xl font-bold mb-4 text-center">Admin Login</h1>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="text-black w-full p-2 mb-4 border border-gray-600 rounded-md"
            placeholder="Enter password"
          />
          <button onClick={handleLogin} className="w-full bg-blue-600 text-white py-2 px-4 rounded-md">
            Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-[#19333F] p-6">
      <h1 className="text-black text-2xl font-bold">Admin Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
      <button onClick={handleProductosClick} className="bg-blue-600 text-white py-3 px-6 rounded-md">
        Productos
      </button>
        <button onClick={handleBlogClick} className="bg-blue-600 text-white py-3 px-6 rounded-md">
          Blog
        </button>
      </div>

      {showBlog && (
        <div className="mt-6">
          <h2 className="text-black text-xl font-bold">{editingPost ? "Editar Artículo" : "Publicar Artículo"}</h2>
          <input
            type="text"
            placeholder="Título del artículo"
            value={blogTitle}
            onChange={(e) => setBlogTitle(e.target.value)}
            className="w-full p-2 mt-2 border border-gray-400 rounded-md"
          />
          <textarea
            placeholder="Contenido del artículo"
            value={blogContent}
            onChange={(e) => setBlogContent(e.target.value)}
            rows={5}
            className="w-full p-2 mt-2 border border-gray-400 rounded-md"
          />
          
          <ImageUpload
            onUpload={(url) => {
              setBlogImage(url);
            }}
            currentImage={blogImage ?? undefined}
          />

          <button onClick={handlePostBlog} className="bg-green-600 text-white py-2 px-4 mt-4 rounded-md">
            {editingPost ? "Actualizar" : "Publicar"}
          </button>

          {/* ✅ List of Published Articles */}
          <h2 className="text-black text-xl font-bold mt-6">Artículos Publicados</h2>
          {blogPosts.length === 0 ? (
            <p className="text-gray-500 mt-2">No hay artículos publicados aún.</p>
          ) : (
            <ul className="mt-4 space-y-4">
                {blogPosts.map((post) => (
                  <li key={post.id} className="bg-gray-800 p-4 rounded-md shadow-md text-white">
                    {post.image && (
                      <img 
                        src={post.image} 
                        alt={post.title} 
                        className="w-full h-40 object-cover rounded-md mb-2"
                      />
                    )}
                    <h4 className="text-lg font-bold">{post.title}</h4>
                    <p className="text-sm text-gray-400">
                      Publicado el{" "}
                      {new Date(post.date).toLocaleDateString("es-MX", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </p>
                    <p className="text-gray-300 mt-2">{post.content.slice(0, 100)}...</p>
                    <div className="flex gap-2 mt-4">
                      <button onClick={() => handleEditPost(post)} className="bg-yellow-500 text-white py-1 px-3 rounded-md">
                        Editar
                      </button>
                      <button onClick={() => handleDeletePost(post.id)} className="bg-red-600 text-white py-1 px-3 rounded-md">
                        Eliminar
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
          )}
        </div>
      )}

      {showPrices && (
        <div className="mt-6">
          <h2 className="text-black text-xl font-bold">Modificar productos</h2>
          <button onClick={handleCreateProduct} className="bg-green-600 text-white py-2 px-4 mb-4 rounded-md">
            Agregar Nuevo Producto
          </button>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {productData.map((product) => (
              <div key={product.id} className="p-4 bg-gray-800 text-white rounded-md">
              {/* ✅ Editable Name */}
              <input
                type="text"
                value={product.name}
                onChange={(e) => handleProductChange(product.id, "name", e.target.value)}
                className="w-full p-2 mt-2 border border-gray-600 rounded-md text-black font-bold"
              />
            
              {/* Editable Description */}
              <textarea
                value={product.description}
                onChange={(e) => handleProductChange(product.id, "description", e.target.value)}
                className="w-full p-2 mt-2 border border-gray-600 rounded-md text-black"
                rows={2}
              />

              {/* Editable Secondary Description */}
              <textarea
                value={product.secondaryDescription || ""}
                onChange={(e) =>
                  handleProductChange(product.id, "secondaryDescription", e.target.value)
                }
                className="w-full p-2 mt-2 border border-gray-600 rounded-md text-black"
                rows={2}
                placeholder="Descripción secundaria"
              ></textarea>
            
              {/* Editable Price */}
              <input
                type="text"
                value={(product.originalPrice ?? 0).toFixed(2)}
                onChange={(e) => handlePriceChange(product.id, "originalPrice", e.target.value)}
                className="w-full p-2 mt-2 border border-gray-600 rounded-md text-black"
              />
              <input
                type="text"
                value={product.discount ?? "0"}
                onChange={(e) => handlePriceChange(product.id, "discount", e.target.value)}
                className="w-full p-2 mt-2 border border-gray-600 rounded-md text-black"
              />

<MultipleImagesUpload
  onUpload={(urls) => {
    console.log(`✅ Received uploaded image URLs for product ${product.id}:`, urls);
    handleProductChange(product.id, "images", urls);
  }}
  currentImages={product.images || []}
/>



              {/* Editable Sizes */}
              <div className="mt-4">
  <label className="text-black font-medium">Tamaños y Precios:</label>
  <div className="flex flex-col gap-2 mt-2">
    {["Pequeño", "Mediano", "Grande", "Extra Grande"].map((sizeLabel) => {
      const existing = product.sizes?.find((s) => s.label === sizeLabel);
      const isSelected = !!existing;

      return (
        <div key={sizeLabel} className="flex items-center gap-2">
          <button
            className={`px-3 py-1 rounded-full text-sm ${
              isSelected ? "bg-black text-white" : "bg-gray-300 text-black"
            }`}
            onClick={() => {
              const updatedSizes = isSelected
                ? product.sizes?.filter((s) => s.label !== sizeLabel)
                : [...(product.sizes || []), { label: sizeLabel, price: 0 }];

              handleProductChange(product.id, "sizes", updatedSizes || []);
            }}
          >
            {isSelected ? "✓" : "+"} {sizeLabel}
          </button>

          {isSelected && (
            <input
              type="number"
              value={existing.price}
              onChange={(e) => {
                const updatedSizes = product.sizes?.map((s) =>
                  s.label === sizeLabel ? { ...s, price: parseFloat(e.target.value) || 0 } : s
                );
                handleProductChange(product.id, "sizes", updatedSizes || []);
              }}
              placeholder="Precio"
              className="w-24 p-1 border border-gray-500 rounded text-black"
            />
          )}
        </div>
      );
    })}
  </div>
</div>



              {/* ✅ Editable Category */}
              <select
                value={product.category}
                onChange={(e) => handleProductChange(product.id, "category", e.target.value)}
                className="w-full p-2 mt-2 border border-gray-600 rounded-md text-black"
              >
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>

              <button onClick={() => handleDeleteProduct(product.id)} className="bg-red-600 text-white py-2 px-4 mt-2 rounded-md">
                Eliminar Producto
              </button>
            </div>
            
            ))}
          </div>
          <button onClick={handleSaveChanges} className="bg-green-600 text-white py-2 px-4 mt-4">
            Guardar Cambios
          </button>
        </div>
      )}
    </div>
  );
};

export default AdminPage;
