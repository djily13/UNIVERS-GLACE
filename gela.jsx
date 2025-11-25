import React, { useState, useEffect } from "react";

// GestionGlacesApp - Single-file React app (Tailwind classes)
// Usage: place this component in a React app and render <GestionGlacesApp />

const STORAGE_KEYS = {
  PRODUCTS: "gg_products",
  SALES: "gg_sales",
  CUSTOMERS: "gg_customers",
  EXPENSES: "gg_expenses",
};

const sampleProducts = [
  { id: 1, name: "Vanille", price: 1.5, stock: 100 },
  { id: 2, name: "Chocolat", price: 1.7, stock: 80 },
  { id: 3, name: "Fraise", price: 1.6, stock: 60 },
];

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

export default function GestionGlacesApp() {
  const [tab, setTab] = useState("dashboard");

  const [products, setProducts] = useState(() => {
    const raw = localStorage.getItem(STORAGE_KEYS.PRODUCTS);
    return raw ? JSON.parse(raw) : sampleProducts;
  });
  const [sales, setSales] = useState(() => {
    const raw = localStorage.getItem(STORAGE_KEYS.SALES);
    return raw ? JSON.parse(raw) : [];
  });
  const [customers, setCustomers] = useState(() => {
    const raw = localStorage.getItem(STORAGE_KEYS.CUSTOMERS);
    return raw ? JSON.parse(raw) : [];
  });
  const [expenses, setExpenses] = useState(() => {
    const raw = localStorage.getItem(STORAGE_KEYS.EXPENSES);
    return raw ? JSON.parse(raw) : [];
  });

  useEffect(() => localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products)), [products]);
  useEffect(() => localStorage.setItem(STORAGE_KEYS.SALES, JSON.stringify(sales)), [sales]);
  useEffect(() => localStorage.setItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify(customers)), [customers]);
  useEffect(() => localStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify(expenses)), [expenses]);

  // --- Dashboard helpers
  const totalRevenue = sales.reduce((s, sale) => s + sale.total, 0);
  const totalSalesCount = sales.length;
  const stockValue = products.reduce((s, p) => s + p.price * p.stock, 0);

  // --- Product CRUD
  function addProduct({ name, price, stock }) {
    const p = { id: uid(), name, price: Number(price), stock: Number(stock) };
    setProducts(prev => [...prev, p]);
  }
  function updateProduct(id, patch) {
    setProducts(prev => prev.map(p => (p.id === id ? { ...p, ...patch } : p)));
  }
  function deleteProduct(id) {
    if (!confirm("Supprimer ce produit ?")) return;
    setProducts(prev => prev.filter(p => p.id !== id));
  }

  // --- Customers
  function addCustomer({ name, phone }) {
    const c = { id: uid(), name, phone };
    setCustomers(prev => [...prev, c]);
    return c;
  }

  // --- Sales (point-of-sale)
  function createSale({ items, customerId, paymentMethod, note }) {
    if (!items || items.length === 0) return;
    const total = items.reduce((s, it) => s + it.quantity * it.price, 0);
    const sale = { id: uid(), date: new Date().toISOString(), items, total, customerId, paymentMethod, note };
    // reduce stock
    setProducts(prev =>
      prev.map(p => {
        const it = items.find(i => i.productId === p.id);
        if (it) return { ...p, stock: Math.max(0, p.stock - it.quantity) };
        return p;
      })
    );
    setSales(prev => [sale, ...prev]);
    return sale;
  }

  // --- Expenses
  function addExpense({ description, amount }) {
    const ex = { id: uid(), date: new Date().toISOString(), description, amount: Number(amount) };
    setExpenses(prev => [ex, ...prev]);
  }

  // --- Exports
  function exportCSV(data, filename = "export.csv") {
    const keys = Object.keys(data[0] || {});
    const csv = [keys.join(","), ...data.map(row => keys.map(k => JSON.stringify(row[k] ?? "")).join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  // --- Simple components inside the file
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        <header className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-extrabold">Gestion - Glacier</h1>
          <nav className="space-x-2">
            <button onClick={() => setTab("dashboard")} className={`px-3 py-1 rounded ${tab === "dashboard" ? "bg-indigo-600 text-white" : "bg-white"}`}>Tableau de bord</button>
            <button onClick={() => setTab("products")} className={`px-3 py-1 rounded ${tab === "products" ? "bg-indigo-600 text-white" : "bg-white"}`}>Produits</button>
            <button onClick={() => setTab("pos")} className={`px-3 py-1 rounded ${tab === "pos" ? "bg-indigo-600 text-white" : "bg-white"}`}>Point de vente</button>
            <button onClick={() => setTab("history")} className={`px-3 py-1 rounded ${tab === "history" ? "bg-indigo-600 text-white" : "bg-white"}`}>Historique</button>
            <button onClick={() => setTab("settings")} className={`px-3 py-1 rounded ${tab === "settings" ? "bg-indigo-600 text-white" : "bg-white"}`}>Paramètres</button>
          </nav>
        </header>

        <main className="bg-white rounded-lg p-6 shadow">
          {tab === "dashboard" && (
            <section>
              <h2 className="text-xl font-semibold mb-4">Tableau de bord</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 border rounded">
                  <div className="text-sm">Revenu total</div>
                  <div className="text-2xl font-bold">€{totalRevenue.toFixed(2)}</div>
                </div>
                <div className="p-4 border rounded">
                  <div className="text-sm">Ventes</div>
                  <div className="text-2xl font-bold">{totalSalesCount}</div>
                </div>
                <div className="p-4 border rounded">
                  <div className="text-sm">Valeur stock</div>
                  <div className="text-2xl font-bold">€{stockValue.toFixed(2)}</div>
                </div>
              </div>

              <div className="mt-6">
                <h3 className="font-semibold">Produits avec faible stock</h3>
                <ul className="mt-2">
                  {products.filter(p => p.stock <= 10).length === 0 ? (
                    <li className="text-sm text-gray-500">Aucun produit critique</li>
                  ) : (
                    products.filter(p => p.stock <= 10).map(p => (
                      <li key={p.id} className="py-1">{p.name} — {p.stock} unités</li>
                    ))
                  )}
                </ul>
              </div>
            </section>
          )}

          {tab === "products" && (
            <ProductsPanel products={products} addProduct={addProduct} updateProduct={updateProduct} deleteProduct={deleteProduct} />
          )}

          {tab === "pos" && (
            <POSPanel products={products} createSale={createSale} addCustomer={addCustomer} />
          )}

          {tab === "history" && (
            <HistoryPanel sales={sales} products={products} exportCSV={() => exportCSV(sales, "ventes.csv")} />
          )}

          {tab === "settings" && (
            <section>
              <h2 className="text-xl font-semibold mb-4">Paramètres & export</h2>
              <div className="space-y-4">
                <div>
                  <button onClick={() => exportCSV(products, "produits.csv")} className="px-4 py-2 bg-green-600 text-white rounded">Exporter produits</button>
                  <button onClick={() => exportCSV(sales, "ventes.csv")} className="ml-2 px-4 py-2 bg-blue-600 text-white rounded">Exporter ventes</button>
                </div>
                <div>
                  <button onClick={() => { if(confirm('Réinitialiser tout ?')) { localStorage.clear(); location.reload(); } }} className="px-4 py-2 bg-red-600 text-white rounded">Réinitialiser les données</button>
                </div>
              </div>
            </section>
          )}
        </main>
      </div>
    </div>
  );
}

// --- Subcomponents: ProductsPanel, POSPanel, HistoryPanel

function ProductsPanel({ products, addProduct, updateProduct, deleteProduct }) {
  const [form, setForm] = useState({ name: "", price: "", stock: "" });
  return (
    <section>
      <h2 className="text-xl font-semibold mb-4">Produits</h2>
      <div className="grid md:grid-cols-2 gap-6">
        <div className="p-4 border rounded">
          <h3 className="font-semibold">Ajouter un produit</h3>
          <div className="mt-3 space-y-2">
            <input className="w-full p-2 border rounded" placeholder="Nom" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
            <input className="w-full p-2 border rounded" placeholder="Prix (ex: 1.5)" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} />
            <input className="w-full p-2 border rounded" placeholder="Stock" value={form.stock} onChange={e => setForm(f => ({ ...f, stock: e.target.value }))} />
            <div>
              <button className="px-4 py-2 bg-indigo-600 text-white rounded" onClick={() => { if (!form.name) return alert('Nom requis'); addProduct(form); setForm({ name: "", price: "", stock: "" }); }}>Ajouter</button>
            </div>
          </div>
        </div>

        <div className="p-4 border rounded overflow-auto">
          <h3 className="font-semibold">Liste des produits</h3>
          <table className="w-full mt-3 text-sm">
            <thead>
              <tr>
                <th className="text-left">Nom</th>
                <th>Prix</th>
                <th>Stock</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {products.map(p => (
                <tr key={p.id} className="align-top">
                  <td>{p.name}</td>
                  <td>€{p.price.toFixed(2)}</td>
                  <td>{p.stock}</td>
                  <td className="text-right">
                    <button className="px-2 py-1 mr-2 bg-yellow-400 rounded" onClick={() => {
                      const newPrice = prompt('Nouveau prix', p.price);
                      const newStock = prompt('Nouveau stock', p.stock);
                      if (newPrice != null) updateProduct(p.id, { price: Number(newPrice) });
                      if (newStock != null) updateProduct(p.id, { stock: Number(newStock) });
                    }}>Éditer</button>
                    <button className="px-2 py-1 bg-red-500 text-white rounded" onClick={() => deleteProduct(p.id)}>Suppr</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

function POSPanel({ products, createSale, addCustomer }) {
  const [cart, setCart] = useState([]);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("Espèces");
  const [note, setNote] = useState("");

  function addToCart(productId) {
    const prod = products.find(p => p.id === productId);
    if (!prod) return;
    setCart(prev => {
      const found = prev.find(i => i.productId === productId);
      if (found) return prev.map(i => i.productId === productId ? { ...i, quantity: i.quantity + 1 } : i);
      return [...prev, { productId, name: prod.name, price: prod.price, quantity: 1 }];
    });
  }

  function changeQty(productId, quantity) {
    setCart(prev => prev.map(i => i.productId === productId ? { ...i, quantity: Math.max(0, quantity) } : i).filter(i => i.quantity > 0));
  }

  function checkout() {
    if (cart.length === 0) return alert("Panier vide");
    let customerId = null;
    if (customerName) {
      const c = addCustomer({ name: customerName, phone: customerPhone });
      customerId = c.id;
      setCustomerName(""); setCustomerPhone("");
    }
    createSale({ items: cart.map(c => ({ productId: c.productId, name: c.name, price: c.price, quantity: c.quantity })), customerId, paymentMethod, note });
    setCart([]);
    setNote("");
    alert('Vente enregistrée');
  }

  return (
    <section>
      <h2 className="text-xl font-semibold mb-4">Point de vente</h2>
      <div className="grid md:grid-cols-3 gap-4">
        <div className="col-span-2 p-4 border rounded">
          <h3 className="font-semibold">Produits</h3>
          <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-3">
            {products.map(p => (
              <div key={p.id} className="p-3 border rounded flex flex-col justify-between">
                <div>
                  <div className="font-semibold">{p.name}</div>
                  <div className="text-sm">€{p.price.toFixed(2)}</div>
                  <div className="text-xs text-gray-500">Stock: {p.stock}</div>
                </div>
                <div className="mt-3">
                  <button disabled={p.stock <= 0} onClick={() => addToCart(p.id)} className="w-full px-2 py-1 bg-indigo-600 text-white rounded">Ajouter</button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="p-4 border rounded">
          <h3 className="font-semibold">Panier</h3>
          <div className="mt-3 space-y-2">
            {cart.length === 0 ? <div className="text-sm text-gray-500">Vide</div> : cart.map(item => (
              <div key={item.productId} className="flex items-center justify-between">
                <div>
                  <div className="font-medium">{item.name}</div>
                  <div className="text-sm">€{item.price.toFixed(2)} x {item.quantity}</div>
                </div>
                <div className="flex items-center gap-2">
                  <input type="number" value={item.quantity} min={1} onChange={e => changeQty(item.productId, Number(e.target.value))} className="w-16 p-1 border rounded" />
                </div>
              </div>
            ))}

            <div className="border-t pt-2">
              <div className="flex justify-between"><span>Total</span><strong>€{cart.reduce((s, i) => s + i.price * i.quantity, 0).toFixed(2)}</strong></div>
            </div>

            <div className="mt-3">
              <input className="w-full p-2 border rounded mb-2" placeholder="Nom client (optionnel)" value={customerName} onChange={e => setCustomerName(e.target.value)} />
              <input className="w-full p-2 border rounded mb-2" placeholder="Téléphone (optionnel)" value={customerPhone} onChange={e => setCustomerPhone(e.target.value)} />
              <select className="w-full p-2 border rounded mb-2" value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)}>
                <option>Espèces</option>
                <option>Carte</option>
                <option>Mobile Money</option>
                <option>Virement</option>
              </select>
              <input className="w-full p-2 border rounded mb-2" placeholder="Note" value={note} onChange={e => setNote(e.target.value)} />
              <button className="w-full px-4 py-2 bg-green-600 text-white rounded" onClick={checkout}>Encaisser</button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function HistoryPanel({ sales, products, exportCSV }) {
  const [filter, setFilter] = useState("");

  const filtered = sales.filter(s => {
    if (!filter) return true;
    const f = filter.toLowerCase();
    return s.items.some(it => (it.name || "").toLowerCase().includes(f)) || (s.paymentMethod || "").toLowerCase().includes(f);
  });

  return (
    <section>
      <h2 className="text-xl font-semibold mb-4">Historique des ventes</h2>
      <div className="mb-3 flex gap-2">
        <input className="p-2 border rounded flex-1" placeholder="Filtrer par produit ou paiement" value={filter} onChange={e => setFilter(e.target.value)} />
        <button onClick={exportCSV} className="px-4 py-2 bg-blue-600 text-white rounded">Exporter CSV</button>
      </div>

      <div className="overflow-auto">
        <table className="w-full text-sm">
          <thead>
            <tr>
              <th>Date</th>
              <th>Articles</th>
              <th>Méthode</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(s => (
              <tr key={s.id} className="align-top">
                <td>{new Date(s.date).toLocaleString()}</td>
                <td>
                  {s.items.map(it => (
                    <div key={it.productId}>{it.name} x{it.quantity}</div>
                  ))}
                </td>
                <td>{s.paymentMethod}</td>
                <td>€{s.total.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
