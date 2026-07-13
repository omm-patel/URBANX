import { useEffect, useState } from "react";
import { Layout } from "@/components/Layout";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

type ProductRow = Tables<"products">;

const AdminProducts = () => {
  const { user, loading } = useAuth();

  const ADMIN_EMAIL = "om07674@gmail.com";

  const [products, setProducts] = useState<ProductRow[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [product, setProduct] = useState({
    name: "",
    slug: "",
    category: "t-shirts",
    price: "",
    image_url: "",
    description: "",
    featured: false,
  });

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-");
  };

  const handleNameChange = (value: string) => {
    setProduct({
      ...product,
      name: value,
      slug: generateSlug(value),
    });
  };

  const fetchProducts = async () => {
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      toast.error(error.message);
    } else {
      setProducts(data || []);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const resetForm = () => {
    setProduct({
      name: "",
      slug: "",
      category: "t-shirts",
      price: "",
      image_url: "",
      description: "",
      featured: false,
    });

    setEditingId(null);
  };

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();

    const productData = {
      name: product.name,
      slug: product.slug,
      category: product.category,
      price: Number(product.price),
      image_url: product.image_url,
      description: product.description,
      featured: product.featured,
    };

    const { error } = editingId
      ? await supabase
        .from("products")
        .update(productData)
        .eq("id", editingId)
      : await supabase.from("products").insert(productData);

    if (error) {
      toast.error(error.message);
    } else {
      toast.success(
        editingId
          ? "Product updated successfully"
          : "Product added successfully"
      );

      resetForm();
      fetchProducts();
    }
  };

  const handleEditProduct = (p: ProductRow) => {
    setEditingId(p.id);

    setProduct({
      name: p.name || "",
      slug: p.slug || "",
      category: p.category || "t-shirts",
      price: String(p.price || ""),
      image_url: p.image_url || "",
      description: p.description || "",
      featured: p.featured || false,
    });

    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDeleteProduct = async (id: string) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this product?"
    );

    if (!confirmDelete) return;

    const { error } = await supabase.from("products").delete().eq("id", id);

    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Product deleted successfully");
      fetchProducts();
    }
  };

  if (loading) {
    return (
      <Layout>
        <section className="container-editorial py-16">
          <p>Loading...</p>
        </section>
      </Layout>
    );
  }

  if (user?.email?.toLowerCase() !== ADMIN_EMAIL.toLowerCase()) {
    return (
      <Layout>
        <section className="container-editorial py-16">
          <h1 className="font-serif text-4xl">Access Denied</h1>
          <p className="mt-4 text-muted-foreground">
            You are not allowed to access this admin page.
          </p>
        </section>
      </Layout>
    );
  }

  return (
    <Layout>
      <section className="container-editorial py-16">
        <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground">
          Admin Panel
        </p>

        <h1 className="mt-2 font-serif text-4xl md:text-5xl">
          {editingId ? "Edit Product" : "Add Product"}
        </h1>

        <form
          onSubmit={handleAddProduct}
          className="mt-10 max-w-2xl space-y-5 rounded-2xl border bg-background p-6 shadow-sm"
        >
          <input
            type="text"
            placeholder="Product name"
            value={product.name}
            onChange={(e) => handleNameChange(e.target.value)}
            className="w-full rounded-md border px-4 py-3"
            required
          />

          <input
            type="text"
            placeholder="Slug"
            value={product.slug}
            onChange={(e) => setProduct({ ...product, slug: e.target.value })}
            className="w-full rounded-md border px-4 py-3"
            required
          />

          <select
            value={product.category}
            onChange={(e) =>
              setProduct({ ...product, category: e.target.value })
            }
            className="w-full rounded-md border px-4 py-3"
          >
            <option value="t-shirts">T-Shirts</option>
            <option value="shirts">Shirts</option>
            <option value="jeans">Jeans</option>
          </select>

          <input
            type="number"
            placeholder="Price"
            value={product.price}
            onChange={(e) =>
              setProduct({ ...product, price: e.target.value })
            }
            className="w-full rounded-md border px-4 py-3"
            required
          />

          <input
            type="text"
            placeholder="Image URL"
            value={product.image_url}
            onChange={(e) =>
              setProduct({ ...product, image_url: e.target.value })
            }
            className="w-full rounded-md border px-4 py-3"
            required
          />

          {product.image_url && (
            <img
              src={product.image_url}
              alt="Product preview"
              className="h-56 w-full rounded-xl object-cover"
            />
          )}

          <textarea
            placeholder="Description"
            value={product.description}
            onChange={(e) =>
              setProduct({ ...product, description: e.target.value })
            }
            className="min-h-28 w-full rounded-md border px-4 py-3"
          />

          <label className="flex items-center gap-3 rounded-md border px-4 py-3 text-sm">
            <input
              type="checkbox"
              checked={product.featured}
              onChange={(e) =>
                setProduct({ ...product, featured: e.target.checked })
              }
            />
            Featured product
          </label>

          <div className="flex gap-3">
            <Button type="submit" className="flex-1">
              {editingId ? "Update Product" : "Add Product"}
            </Button>

            {editingId && (
              <Button type="button" variant="outline" onClick={resetForm}>
                Cancel Edit
              </Button>
            )}
          </div>
        </form>

        <div className="mt-14">
          <h2 className="font-serif text-3xl">All Products</h2>

          <div className="mt-6 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {products.length === 0 ? (
              <p className="text-muted-foreground">No products found.</p>
            ) : (
              products.map((p) => (
                <div
                  key={p.id}
                  className="overflow-hidden rounded-2xl border bg-background shadow-sm transition hover:shadow-md"
                >
                  <img
                    src={p.image_url}
                    alt={p.name}
                    className="h-72 w-full object-contain bg-secondary/30 p-3"
                  />

                  <div className="p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="font-medium">{p.name}</h3>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {p.category}
                        </p>
                      </div>

                      {p.featured && (
                        <span className="rounded-full bg-accent/10 px-3 py-1 text-xs font-medium text-accent">
                          Featured
                        </span>
                      )}
                    </div>

                    <p className="mt-3 font-semibold">₹{p.price}</p>

                    <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
                      {p.description || "No description"}
                    </p>

                    <div className="mt-5 flex gap-3">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => handleEditProduct(p)}
                      >
                        Edit
                      </Button>

                      <Button
                        type="button"
                        size="sm"
                        className="flex-1 bg-accent text-accent-foreground hover:opacity-90"
                        onClick={() => handleDeleteProduct(p.id)}
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default AdminProducts;
