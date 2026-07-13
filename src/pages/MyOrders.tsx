import { useEffect, useState } from "react";
import { Layout } from "@/components/Layout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";

type Order = {
  id: string;
  created_at: string;
  status: string;
  total: number;
};

type OrderItem = {
  id: string;
  order_id: string;
  image?: string | null;
  name?: string | null;
  price?: number | null;
  quantity: number;
  size?: string | null;
  unit_price: number;
};

const MyOrders = () => {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);

  useEffect(() => {
    const fetchOrders = async () => {
      if (!user) return;

      // fetch orders
      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) {
        alert(error.message);
      } else {
        setOrders((data || []) as unknown as Order[]);
      }

      // fetch order items
      const { data: itemsData, error: itemsError } = await supabase
        .from("order_items")
        .select("*");

      if (!itemsError) {
        setOrderItems((itemsData || []) as unknown as OrderItem[]);
      }
    };

    fetchOrders();
  }, [user]);

  // cancel order function (only pending)
  const cancelOrder = async (orderId: string) => {
    const { error } = await supabase
      .from("orders")
      .update({ status: "cancelled" })
      .eq("id", orderId)
      .eq("status", "pending");

    if (error) {
      alert(error.message);
    } else {
      setOrders((prev) =>
        prev.map((o) =>
          o.id === orderId ? { ...o, status: "cancelled" } : o
        )
      );
    }
  };

  return (
    <Layout>
      <section className="container-editorial py-16">
        <h1 className="font-serif text-4xl">My Orders</h1>

        <div className="mt-8 space-y-6">
          {orders.length === 0 ? (
            <div className="rounded-2xl border bg-background p-6 shadow-sm">
              <p className="text-muted-foreground">You have no orders yet.</p>
            </div>
          ) : (
            orders.map((order) => (
              <div
                key={order.id}
                className="rounded-2xl border bg-background p-6 shadow-sm transition hover:shadow-md"
              >
                {/* Order Header */}
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Order ID</p>
                    <p className="break-all font-medium">{order.id}</p>
                  </div>

                  {/* Status */}
                  <span
                    className={`w-fit rounded-full px-4 py-1 text-sm font-medium ${order.status === "pending"
                      ? "bg-yellow-100 text-yellow-700"
                      : order.status === "shipped"
                        ? "bg-blue-100 text-blue-700"
                        : order.status === "delivered"
                          ? "bg-green-100 text-green-700"
                          : order.status === "cancelled"
                            ? "bg-red-100 text-red-700"
                            : "bg-muted"
                      }`}
                  >
                    {order.status}
                  </span>
                </div>

                {/* Order Info */}
                <div className="mt-6 grid gap-4 md:grid-cols-2">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Amount</p>
                    <p className="text-lg font-semibold">₹{order.total}</p>
                  </div>

                  <div>
                    <p className="text-sm text-muted-foreground">Order Date</p>
                    <p>
                      {new Date(order.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                {/* Products */}
                <div className="mt-6 border-t pt-4">
                  <p className="mb-3 text-sm font-semibold">Products</p>

                  <div className="space-y-3">
                    {orderItems
                      .filter((item) => item.order_id === order.id)
                      .map((item) => (
                        <div
                          key={item.id}
                          className="flex items-center gap-4 rounded-xl bg-muted/40 p-3"
                        >
                          {item.image && (
                            <img
                              src={item.image}
                              alt={item.name}
                              className="h-20 w-20 rounded-lg object-cover"
                            />
                          )}

                          <div>
                            <p className="font-medium">{item.name}</p>
                            <p className="text-sm text-muted-foreground">
                              ₹{item.price || item.unit_price} × {item.quantity}

                              {item.size && (
                                <span className="ml-2 rounded bg-accent/10 px-2 py-0.5 text-xs font-medium text-accent">
                                  Size: {item.size}
                                </span>
                              )}
                            </p>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>

                {/* Cancel Button */}
                {order.status === "pending" && (
                  <div className="flex justify-end">
                    <button
                      size="sm"
                      variant="outline"
                      className="text-xs px-3 py-1 mt-2 text-red-500 border-red-300 hover:bg-red-50"
                      onClick={() => {
                        setSelectedOrderId(order.id);
                        setShowCancelModal(true);
                      }}
                    >
                      Cancel Order
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </section>
      {showCancelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div
            className="w-full max-w-sm rounded-2xl bg-background p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-lg font-semibold">Cancel Order?</h2>

            <p className="mt-2 text-sm text-muted-foreground">
              Are you sure you want to cancel this order? This action cannot be undone.
            </p>

            <div className="mt-6 flex justify-end gap-3">
              <Button
                variant="ghost"
                onClick={() => setShowCancelModal(false)}
              >
                No
              </Button>

              <Button
                className="bg-accent text-accent-foreground hover:opacity-90"
                onClick={() => {
                  if (selectedOrderId) {
                    cancelOrder(selectedOrderId);
                  }
                  setShowCancelModal(false);
                }}
              >
                Yes, Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default MyOrders;
