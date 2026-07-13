import { Link } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { useCart } from "@/contexts/CartContext";
import { Button } from "@/components/ui/button";
import { Minus, Plus, X } from "lucide-react";

const Cart = () => {
  const { items, updateQty, removeItem, total } = useCart();

  return (
    <Layout>
      <section className="container-editorial py-12 md:py-16">
        <p className="text-[11px] uppercase tracking-[0.25em] text-muted-foreground">
          Your bag
        </p>
        <h1 className="mt-2 font-serif text-4xl md:text-5xl">Cart</h1>

        {items.length === 0 ? (
          <div className="mt-16 border-t border-border pt-16 text-center">
            <p className="text-muted-foreground">Your cart is quiet.</p>
            <Link to="/shop" className="mt-6 inline-block">
              <Button className="rounded-sm">Browse the catalog</Button>
            </Link>
          </div>
        ) : (
          <div className="mt-10 grid gap-12 lg:grid-cols-3">
            <ul className="divide-y divide-border border-y border-border lg:col-span-2">
              {items.map((item, index) => (
                <li
                  key={`${item.id}-${item.size || "nosize"}-${index}`}
                  className="flex gap-5 py-6"
                >
                  <Link
                    to={item.slug ? `/product/${item.slug}` : "#"}
                    className="block w-24 shrink-0 sm:w-32"
                  >
                    <img
                      src={
                        item.image_url ||
                        "https://via.placeholder.com/300x400?text=No+Image"
                      }
                      alt={item.name}
                      className="aspect-[4/5] w-full object-cover"
                    />
                  </Link>

                  <div className="flex flex-1 flex-col justify-between">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <Link
                          to={item.slug ? `/product/${item.slug}` : "#"}
                          className="font-serif text-lg hover:text-accent"
                        >
                          {item.name}
                        </Link>

                        <p className="mt-1 text-sm text-muted-foreground">
                          ₹{item.price.toLocaleString("en-IN")}
                        </p>

                        {item.size && (
                          <p className="mt-1 text-sm text-muted-foreground">
                            Size: {item.size}
                          </p>
                        )}
                      </div>

                      <button
                        onClick={() => removeItem(item.id, item.size)}
                        className="p-1 text-muted-foreground hover:text-foreground"
                        aria-label="Remove"
                        type="button"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center border border-input">
                        <button
                          onClick={() =>
                            updateQty(item.id, item.quantity - 1, item.size)
                          }
                          className="px-2 py-1 hover:bg-muted"
                          type="button"
                        >
                          <Minus className="h-3 w-3" />
                        </button>

                        <span className="w-8 text-center text-sm">
                          {item.quantity}
                        </span>

                        <button
                          onClick={() =>
                            updateQty(item.id, item.quantity + 1, item.size)
                          }
                          className="px-2 py-1 hover:bg-muted"
                          type="button"
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>

                      <p className="font-serif text-lg">
                        ₹{(item.price * item.quantity).toLocaleString("en-IN")}
                      </p>
                    </div>
                  </div>
                </li>
              ))}
            </ul>

            <aside className="h-fit bg-secondary/40 p-6">
              <h2 className="font-serif text-xl">Summary</h2>

              <dl className="mt-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <dt>Subtotal</dt>
                  <dd>₹{total.toLocaleString("en-IN")}</dd>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <dt>Shipping</dt>
                  <dd>Calculated at checkout</dd>
                </div>
              </dl>

              <div className="mt-4 flex justify-between border-t border-border pt-4 font-serif text-lg">
                <span>Total</span>
                <span>₹{total.toLocaleString("en-IN")}</span>
              </div>

              <Link to="/checkout" className="mt-6 block">
                <Button className="w-full rounded-sm" size="lg">
                  Checkout
                </Button>
              </Link>

              <Link
                to="/shop"
                className="mt-3 block text-center text-sm text-muted-foreground hover:text-foreground"
              >
                Continue shopping
              </Link>
            </aside>
          </div>
        )}
      </section>
    </Layout>
  );
};

export default Cart;
