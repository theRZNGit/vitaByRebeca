import { Redis } from "@upstash/redis";
import { NextRequest, NextResponse } from "next/server";
import { del, put } from "@vercel/blob";

// Initialize Redis
const redis = Redis.fromEnv();

interface BlogArticle {
  id: number;
  title: string;
  content: string;
  date: string;
  image?: string; // Add optional image field
}

// GET all articles
export async function GET() {
  try {
    const articlesData = await redis.get("blog:articles");
    
    let articles: BlogArticle[] = [];

    if (typeof articlesData === "string") {
      articles = JSON.parse(articlesData);
    } else if (Array.isArray(articlesData)) {
      articles = articlesData as BlogArticle[];
    }

    return NextResponse.json({ articles }, { status: 200 });
  } catch (error) {
    console.error("Error fetching blog articles:", error);
    return NextResponse.json({ error: "Failed to fetch articles" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    if (req.headers.get("content-type")?.includes("multipart/form-data")) {
      const formData = await req.formData();
      const file = formData.get("file") as File | null;
      const articleData = formData.get("article") as string | null;

      // ✅ Allow file-only uploads (image preview step)
      if (!articleData && file) {
        const fileName = `blog-images/${Date.now()}-${file.name}`;
        const { url } = await put(fileName, file, { access: "public" });
        return NextResponse.json({ url }, { status: 200 });
      }

      // 👇 This part stays the same
      if (!articleData) {
        return NextResponse.json({ error: "Missing article data" }, { status: 400 });
      }

      const newArticle: BlogArticle = JSON.parse(articleData);

      if (file) {
        const fileName = `blog-images/${Date.now()}-${Math.random().toString(36).substring(7)}`;
        const { url } = await put(fileName, file, { access: "public" });
        newArticle.image = url;
      }

      const articlesData = await redis.get("blog:articles");
      let articles: BlogArticle[] = [];

      if (typeof articlesData === "string") {
        articles = JSON.parse(articlesData);
      } else if (Array.isArray(articlesData)) {
        articles = articlesData as BlogArticle[];
      }

      articles.push(newArticle);
      await redis.set("blog:articles", JSON.stringify(articles));

      return NextResponse.json({ message: "Article added successfully", article: newArticle }, { status: 201 });
    }

    // Fallback for plain JSON posts (blog with no image)
    if (req.headers.get("content-type")?.includes("application/json")) {
      const article = await req.json();

      if (!article || !article.title || !article.content || !article.date || !article.id) {
        return NextResponse.json({ error: "Missing required article fields" }, { status: 400 });
      }

      const articlesData = await redis.get("blog:articles");
      let articles: BlogArticle[] = [];

      if (typeof articlesData === "string") {
        articles = JSON.parse(articlesData);
      } else if (Array.isArray(articlesData)) {
        articles = articlesData as BlogArticle[];
      }

      articles.push(article);
      await redis.set("blog:articles", JSON.stringify(articles));

      return NextResponse.json({ message: "Article added successfully", article }, { status: 201 });
    }

    return NextResponse.json({ error: "Invalid request format" }, { status: 400 });
  } catch (error) {
    console.error("Error saving article to Redis:", error);
    return NextResponse.json({ error: "Failed to save article" }, { status: 500 });
  }
}

// ✅ DELETE - Remove an article
export async function DELETE(req: NextRequest) {
  try {
    const { id } = await req.json();

    if (typeof id !== "number") {
      return NextResponse.json({ error: "Invalid article ID" }, { status: 400 });
    }

    // ✅ Fetch existing blog articles
    const existingArticlesData = await redis.get("blog:articles");
    const existingArticles = Array.isArray(existingArticlesData)
      ? existingArticlesData as BlogArticle[]
      : typeof existingArticlesData === "string"
      ? JSON.parse(existingArticlesData)
      : [];

    // ✅ Find the article to delete
    const articleToDelete = existingArticles.find((article: { id: number; }) => article.id === id);

    if (!articleToDelete) {
      return NextResponse.json({ error: "Article not found" }, { status: 404 });
    }

    // ✅ Delete blob if it exists
    if (
      articleToDelete.image &&
      !articleToDelete.image.includes("/placeholder.png")
    ) {
      try {
        console.log(`🔍 Attempting to delete blob: ${articleToDelete.image}`);
        await del(articleToDelete.image); // ✅ Directly use del()
        console.log(`✅ Blob deleted successfully: ${articleToDelete.image}`);
      } catch (blobError) {
        console.error("❌ Error deleting blob:", blobError);
        // ✅ Continue even if blob deletion fails
      }
    }

    // ✅ Remove article from Redis
    const updatedArticles = existingArticles.filter((article: { id: number; }) => article.id !== id);
    await redis.set("blog:articles", JSON.stringify(updatedArticles));

    return NextResponse.json({ message: "Article deleted successfully" }, { status: 200 });
  } catch (error) {
    console.error("❌ Error deleting article:", error);
    return NextResponse.json({ error: "Failed to delete article" }, { status: 500 });
  }
}

// ✅ PUT - Edit an article
export async function PUT(req: NextRequest) {
  try {
    if (req.headers.get("content-type")?.includes("multipart/form-data")) {
      const formData = await req.formData();
      const file = formData.get("file") as File | null;
      const articleData = formData.get("article") as string | null;

      if (!articleData) {
        return NextResponse.json({ error: "Missing article data" }, { status: 400 });
      }

      // ✅ Parse article data
      const updatedArticle: BlogArticle = JSON.parse(articleData);

      // ✅ If file exists, upload it and assign URL
      if (file) {
        const fileName = `blog-images/${Date.now()}-${Math.random().toString(36).substring(7)}`;
        const { url } = await put(fileName, file, { access: "public" });
        updatedArticle.image = url;
      }

      // ✅ Fetch existing articles
      const articlesData = await redis.get("blog:articles");
      let articles: BlogArticle[] = [];

      if (typeof articlesData === "string") {
        articles = JSON.parse(articlesData);
      } else if (Array.isArray(articlesData)) {
        articles = articlesData as BlogArticle[];
      }

      // ✅ Update the article by ID
      const updatedArticles = articles.map((article) =>
        article.id === updatedArticle.id ? updatedArticle : article
      );

      await redis.set("blog:articles", JSON.stringify(updatedArticles));

      return NextResponse.json({ message: "Article updated successfully", article: updatedArticle }, { status: 200 });
    }

    return NextResponse.json({ error: "Invalid request format" }, { status: 400 });
  } catch (error) {
    console.error("Error updating article:", error);
    return NextResponse.json({ error: "Failed to update article" }, { status: 500 });
  }
}

