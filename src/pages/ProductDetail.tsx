import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Layout } from "@/components/Layout";
import { Product } from "@/components/ProductCard";
import { Button } from "@/components/ui/button";
import { useCart } from "@/contexts/CartContext";
import { toast } from "sonner";
import { Minus, Plus } from "lucide-react";

const availableSizes = ["S", "M", "L", "XL"];

const ProductDetail = () => {
  const { slug } = useParams();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [qty, setQty] = useState(1);
  const [selectedSize, setSelectedSize] = useState("M");
  const { addItem } = useCart();

  useEffect(() => {
    if (!slug) return;
    setLoading(true);

    supabase
      .from("products")
      .select("*")
      .eq("slug", slug)
      .maybeSingle()
      .then(({ data, error }) => {
        if (error) {
          console.log("Error fetching product:", error);
          setProduct(null);
        } else {
          setProduct(data as Product | null);
          if (data) document.title = `${data.name} — URBANX`;
        }
        setLoading(false);
      });
  }, [slug]);

  if (loading) {
    return (
      <Layout>
        <div className="container-editorial py-20 text-muted-foreground">
          Loading…
        </div>
      </Layout>
    );
  }

  if (!product) {
    return (
      <Layout>
        <div className="container-editorial py-20">
          <p>Product not found.</p>
          <Link to="/shop" className="mt-4 inline-block underline">
            Back to shop
          </Link>
        </div>
      </Layout>
    );
  }

  const productImage = product.image_url || "";

  const handleAdd = () => {
    addItem(
      {
        id: product.id,
        name: product.name,
        price: product.price,
        image_url: productImage,
        slug: product.slug,
        category: product.category,
        size: selectedSize,
      },
      qty
    );
    toast.success(`${product.name} (${selectedSize}) added to cart`);
  };

  return (
    <Layout>
      <section className="container-editorial pt-10 md:pt-16">
        <Link
          to="/shop"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← Back to shop
        </Link>

        <div className="mt-6 grid gap-12 md:grid-cols-2">
          <div className="aspect-[4/5] overflow-hidden bg-muted">
            <img
              src={productImage || "https://via.placeholder.com/800x1000?text=No+Image"}
              alt={product.name}
              className="h-full w-full object-cover"
            />
          </div>

          <div className="md:pt-6">
            <p className="text-[11px] uppercase tracking-[0.25em] text-muted-foreground">
              {product.category}
            </p>

            <h1 className="mt-3 font-serif text-4xl leading-tight md:text-5xl">
              {product.name}
            </h1>

            <p className="mt-4 font-serif text-2xl">
              ₹{product.price.toLocaleString("en-IN")}
            </p>

            <p className="mt-6 leading-relaxed text-muted-foreground">
              {product.description}
            </p>

            {/* Size Selection */}
            <div className="mt-8">
              <p className="mb-3 text-sm uppercase tracking-[0.18em] text-muted-foreground">
                Select Size
              </p>
              <div className="flex gap-3">
                {availableSizes.map((size) => (
                  <button
                    key={size}
                    type="button"
                    onClick={() => setSelectedSize(size)}
                    className={`min-w-[48px] border px-4 py-2 text-sm transition ${
                      selectedSize === size
                        ? "border-black bg-black text-white"
                        : "border-input bg-background hover:border-black"
                    }`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-8 flex items-center gap-4">
              <div className="flex items-center border border-input">
                <button
                  type="button"
                  onClick={() => setQty((q) => Math.max(1, q - 1))}
                  className="px-3 py-2 hover:bg-muted"
                >
                  <Minus className="h-4 w-4" />
                </button>

                <span className="w-10 text-center text-sm">{qty}</span>

                <button
                  type="button"
                  onClick={() => setQty((q) => q + 1)}
                  className="px-3 py-2 hover:bg-muted"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>

              <Button
                size="lg"
                onClick={handleAdd}
                className="flex-1 rounded-sm md:flex-none md:px-12"
              >
                Add to cart
              </Button>
            </div>

            <div className="mt-10 space-y-3 border-t border-border pt-6 text-sm text-muted-foreground">
              <p>· Free shipping across India on orders above ₹1,499</p>
              <p>· Cash on Delivery available</p>
              <p>· Easy 7-day returns & exchanges</p>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default ProductDetail;
