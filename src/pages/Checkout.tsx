import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const Field = ({
  label,
  ...props
}: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) => (
  <label className="block">
    <span className="mb-1.5 block text-xs uppercase tracking-wider text-muted-foreground">
      {label}
    </span>
    <input
      {...props}
      className="w-full rounded-sm border border-input bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring"
    />
  </label>
);

type OrderInsertWithEmail = {
  user_id: string;
  customer_email?: string | null;
  total: number;
  status: string;
  shipping_full_name: string;
  shipping_address: string;
  shipping_city: string;
  shipping_postal_code: string;
  shipping_country: string;
  shipping_phone: string;
};

type OrderItemSnapshotInsert = {
  order_id: string;
  product_id: string;
  quantity: number;
  unit_price: number;
  size: string | null;
  name: string;
  image?: string;
  price: number;
};

const Checkout = () => {
  const { items, total, clear } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    full_name: "",
    address: "",
    city: "",
    postal_code: "",
    country: "",
    phone: "",
  });

  useEffect(() => {
    document.title = "Checkout — URBANX";

    if (!user) return;

    const loadProfile = async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .maybeSingle();

      if (error) {
        console.log("Profile load error:", error.message);
        return;
      }

      if (data) {
        setForm({
          full_name: data.full_name || "",
          address: data.shipping_address || "",
          city: data.city || "",
          postal_code: data.postal_code || "",
          country: data.country || "",
          phone: data.phone || "",
        });
      }
    };

    loadProfile();
  }, [user]);

  const update =
    (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm((f) => ({ ...f, [k]: e.target.value }));

  const handlePlace = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      toast.error("Please login first.");
      return;
    }

    if (items.length === 0) {
      toast.error("Your cart is empty.");
      return;
    }

    if (
      !form.full_name ||
      !form.address ||
      !form.city ||
      !form.postal_code ||
      !form.country
    ) {
      toast.error("Please fill all required shipping details.");
      return;
    }

    setSubmitting(true);

    try {
      // 1. Create order
      const orderData: OrderInsertWithEmail = {
        user_id: user.id,
        customer_email: user.email,
        total,
        status: "pending",
        shipping_full_name: form.full_name,
        shipping_address: form.address,
        shipping_city: form.city,
        shipping_postal_code: form.postal_code,
        shipping_country: form.country,
        shipping_phone: form.phone,
      };

      const { data: order, error: orderErr } = await supabase
        .from("orders")
        .insert(orderData as never)
        .select()
        .single();

      if (orderErr || !order) {
        console.log("Order insert error:", orderErr);
        toast.error(
          `Could not place order: ${orderErr?.message || "Unknown error"}`
        );
        setSubmitting(false);
        return;
      }

      // 2. Insert order items with product details
      const orderItemsData: OrderItemSnapshotInsert[] = items.map((i) => ({
        order_id: order.id,
        product_id: i.id,
        quantity: i.quantity,
        unit_price: i.price,
        size: i.size || null,
        name: i.name,
        image: i.image_url,
        price: i.price,
      }));

      const { error: itemsErr } = await supabase.from("order_items").insert(
        orderItemsData as never
      );

      if (itemsErr) {
        console.log("Order items insert error:", itemsErr);
        toast.error(`Order created, but items failed: ${itemsErr.message}`);
        setSubmitting(false);
        return;
      }

      // 3. Best-effort profile update
      const { error: profileErr } = await supabase.from("profiles").upsert(
        {
          id: user.id,
          full_name: form.full_name,
          shipping_address: form.address,
          city: form.city,
          postal_code: form.postal_code,
          country: form.country,
          phone: form.phone,
        },
        { onConflict: "id" }
      );

      if (profileErr) {
        console.log("Profile update error:", profileErr.message);
      }

      toast.success("Order placed successfully ✅");
      clear();
      navigate("/");
    } catch (err) {
      console.log("Unexpected checkout error:", err);
      toast.error("Something went wrong while placing the order.");
    }

    setSubmitting(false);
  };

  if (items.length === 0) {
    return (
      <Layout>
        <div className="container-editorial py-20 text-center">
          <p className="text-muted-foreground">Your cart is empty.</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <section className="container-editorial py-12 md:py-16">
        <p className="text-[11px] uppercase tracking-[0.25em] text-muted-foreground">
          Almost there
        </p>
        <h1 className="mt-2 font-serif text-4xl md:text-5xl">Checkout</h1>

        <form
          onSubmit={handlePlace}
          className="mt-10 grid gap-12 lg:grid-cols-3"
        >
          <div className="space-y-6 lg:col-span-2">
            <h2 className="font-serif text-xl">Shipping details</h2>

            <Field
              label="Full name"
              required
              value={form.full_name}
              onChange={update("full_name")}
            />

            <Field
              label="Address"
              required
              value={form.address}
              onChange={update("address")}
            />

            <div className="grid gap-6 sm:grid-cols-2">
              <Field
                label="City"
                required
                value={form.city}
                onChange={update("city")}
              />
              <Field
                label="Postal code"
                required
                value={form.postal_code}
                onChange={update("postal_code")}
              />
            </div>

            <div className="grid gap-6 sm:grid-cols-2">
              <Field
                label="Country"
                required
                value={form.country}
                onChange={update("country")}
              />
              <Field
                label="Phone"
                value={form.phone}
                onChange={update("phone")}
              />
            </div>
          </div>

          <aside className="h-fit bg-secondary/40 p-6">
            <h2 className="font-serif text-xl">Your order</h2>

            <ul className="mt-4 space-y-3 border-b border-border pb-4 text-sm">
              {items.map((i) => (
                <li key={i.id} className="flex justify-between gap-3">
                  <span className="text-muted-foreground">
                    {i.name} × {i.quantity}
                  </span>
                  <span>₹{(i.price * i.quantity).toLocaleString("en-IN")}</span>
                </li>
              ))}
            </ul>

            <div className="mt-4 flex justify-between font-serif text-lg">
              <span>Total</span>
              <span>₹{total.toLocaleString("en-IN")}</span>
            </div>

            <Button
              type="submit"
              disabled={submitting}
              className="mt-6 w-full rounded-sm"
              size="lg"
            >
              {submitting ? "Placing order…" : "Place order"}
            </Button>

            <p className="mt-3 text-center text-xs text-muted-foreground">
              Demo checkout — no payment is taken.
            </p>
          </aside>
        </form>
      </section>
    </Layout>
  );
};

export default Checkout;
