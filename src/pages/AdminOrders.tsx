import { useEffect, useState } from "react";
import { Layout } from "@/components/Layout";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

type Order = {
    id: string;
    created_at: string;
    customer_email?: string | null;
    shipping_address?: string | null;
    shipping_full_name?: string | null;
    shipping_phone?: string | null;
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

const AdminOrders = () => {
    const { user, loading } = useAuth();

    const ADMIN_EMAIL = "om07674@gmail.com"; // change this

    const [orders, setOrders] = useState<Order[]>([]);
    const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
    const [selectedUserEmail, setSelectedUserEmail] = useState("");

    useEffect(() => {
        const fetchData = async () => {
            const { data: ordersData, error: ordersError } = await supabase
                .from("orders")
                .select("*")
                .order("created_at", { ascending: false });

            if (!ordersError) {
                setOrders((ordersData || []) as unknown as Order[]);
            }

            const { data: itemsData, error: itemsError } = await supabase
                .from("order_items")
                .select("*");

            if (!itemsError) {
                setOrderItems((itemsData || []) as unknown as OrderItem[]);
            }
        };

        fetchData();
    }, []);

    const updateStatus = async (orderId: string, newStatus: string) => {
        const { error } = await supabase
            .from("orders")
            .update({ status: newStatus })
            .eq("id", orderId);

        if (!error) {
            setOrders((prev) =>
                prev.map((order) =>
                    order.id === orderId ? { ...order, status: newStatus } : order
                )
            );
        }
    };

    const customers = Array.from(
        new Set(
            orders
                .map((order) => order.customer_email)
                .filter((email): email is string => Boolean(email))
        )
    );

    const filteredOrders = selectedUserEmail
        ? orders.filter((order) => order.customer_email === selectedUserEmail)
        : [];

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

    const totalOrders = orders.length;

    const pendingOrders = orders.filter(
        (order) => order.status === "pending"
    ).length;

    const deliveredOrders = orders.filter(
        (order) => order.status === "delivered"
    ).length;

    const totalRevenue = orders
        .filter((order) => order.status !== "cancelled")
        .reduce((sum, order) => sum + Number(order.total || 0), 0);

    return (
        <Layout>
            <section className="container-editorial py-16">
                <div className="flex flex-col gap-2">
                    <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground">
                        Admin Panel
                    </p>
                    <h1 className="font-serif text-4xl md:text-5xl">Customer Orders</h1>
                    <p className="text-sm text-muted-foreground">
                        Select a customer to view and manage their orders.
                    </p>
                    <div className="mt-8 grid gap-4 md:grid-cols-4">
                        <div className="rounded-2xl border bg-background p-5 shadow-sm">
                            <p className="text-sm text-muted-foreground">Total Orders</p>
                            <h3 className="mt-2 text-2xl font-semibold">{totalOrders}</h3>
                        </div>

                        <div className="rounded-2xl border bg-background p-5 shadow-sm">
                            <p className="text-sm text-muted-foreground">Pending</p>
                            <h3 className="mt-2 text-2xl font-semibold">{pendingOrders}</h3>
                        </div>

                        <div className="rounded-2xl border bg-background p-5 shadow-sm">
                            <p className="text-sm text-muted-foreground">Delivered</p>
                            <h3 className="mt-2 text-2xl font-semibold">{deliveredOrders}</h3>
                        </div>

                        <div className="rounded-2xl border bg-background p-5 shadow-sm">
                            <p className="text-sm text-muted-foreground">Revenue</p>
                            <h3 className="mt-2 text-2xl font-semibold">
                                ₹{totalRevenue.toLocaleString("en-IN")}
                            </h3>
                        </div>
                    </div>
                </div>

                <div className="mt-8 max-w-md">
                    <label className="mb-2 block text-sm font-medium text-muted-foreground">
                        Select Customer
                    </label>

                    <select
                        value={selectedUserEmail}
                        onChange={(e) => setSelectedUserEmail(e.target.value)}
                        className="w-full rounded-lg border border-border bg-background px-4 py-3 text-sm outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20"
                    >
                        <option value="">Choose customer</option>

                        {customers.map((email) => (
                            <option key={email} value={email}>
                                {email}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="mt-8 space-y-5">
                    {!selectedUserEmail ? (
                        <div className="rounded-2xl border bg-background p-6 shadow-sm">
                            <p className="text-muted-foreground">
                                Please select a customer to view orders.
                            </p>
                        </div>
                    ) : filteredOrders.length === 0 ? (
                        <div className="rounded-2xl border bg-background p-6 shadow-sm">
                            <p className="text-muted-foreground">
                                No orders found for this customer.
                            </p>
                        </div>
                    ) : (
                        filteredOrders.map((order) => {
                            const itemsForOrder = orderItems.filter(
                                (item) => item.order_id === order.id
                            );

                            return (
                                <div
                                    key={order.id}
                                    className="rounded-2xl border bg-background p-6 shadow-sm transition hover:shadow-md"
                                >
                                    <div className="grid gap-4 md:grid-cols-2">
                                        <p>
                                            <b>Order ID:</b> {order.id}
                                        </p>

                                        <p>
                                            <b>Customer:</b>{" "}
                                            {order.customer_email || "Not available"}
                                        </p>

                                        <p>
                                            <b>Date:</b>{" "}
                                            {order.created_at
                                                ? new Date(order.created_at).toLocaleString()
                                                : "Not available"}
                                        </p>

                                        <p>
                                            <b>Name:</b>{" "}
                                            {order.shipping_full_name || "Not available"}
                                        </p>

                                        <p className="md:col-span-2">
                                            <b>Address:</b>{" "}
                                            {order.shipping_address || "Not available"}
                                        </p>

                                        <p>
                                            <b>Phone:</b>{" "}
                                            {order.shipping_phone || "Not available"}
                                        </p>

                                        <p>
                                            <b>Total:</b> ₹{order.total}
                                        </p>
                                    </div>

                                    <div className="mt-5 border-t pt-5">
                                        <p className="mb-3 text-sm font-semibold">Products</p>

                                        {itemsForOrder.length === 0 ? (
                                            <p className="text-sm text-muted-foreground">
                                                No products found for this order.
                                            </p>
                                        ) : (
                                            <div className="space-y-3">
                                                {itemsForOrder.map((item) => (
                                                    <div
                                                        key={item.id}
                                                        className="flex items-center gap-4 rounded-xl bg-muted/40 p-3"
                                                    >
                                                        {item.image && (
                                                            <img
                                                                src={item.image}
                                                                alt={item.name}
                                                                className="h-16 w-16 rounded-lg object-cover"
                                                            />
                                                        )}

                                                        <div className="flex-1">
                                                            <p className="font-medium">
                                                                {item.name || "Product Name"}
                                                            </p>
                                                            <p className="text-sm text-muted-foreground">
                                                                ₹{item.price || item.unit_price} × {item.quantity}
                                                                {item.size && (
                                                                    <span className="ml-2 rounded bg-accent/10 px-2 py-0.5 text-xs font-medium text-accent">
                                                                        (Size: {item.size})
                                                                    </span>
                                                                )}
                                                            </p>
                                                        </div>

                                                        <p className="text-sm font-semibold">
                                                            ₹
                                                            {(
                                                                (item.price || item.unit_price || 0) *
                                                                (item.quantity || 1)
                                                            ).toLocaleString("en-IN")}
                                                        </p>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    <div className="mt-5 flex flex-wrap items-center gap-3">
                                        <span className="text-sm font-medium text-muted-foreground">
                                            Update Status
                                        </span>

                                        <select
                                            value={order.status}
                                            onChange={(e) =>
                                                updateStatus(order.id, e.target.value)
                                            }
                                            className="min-w-36 rounded-full border border-accent/30 bg-accent/10 px-4 py-2 text-sm font-medium text-foreground outline-none transition hover:bg-accent/15 focus:border-accent focus:ring-2 focus:ring-accent/30"
                                        >
                                            <option value="pending">Pending</option>
                                            <option value="shipped">Shipped</option>
                                            <option value="delivered">Delivered</option>
                                            <option value="cancelled">Cancelled</option>
                                        </select>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </section>
        </Layout>
    );
};

export default AdminOrders;
