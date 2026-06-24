import { useState, useEffect, useCallback, useRef } from "react";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:8080/api";
const PAGE_SIZE = 24;

function formatPrice(price) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(price);
}

function formatDate(iso) {
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function CategoryIcon({ category }) {
  // Small deterministic accent color per category, derived from a hash of the name,
  // so the catalog has visual rhythm without us hand-mapping every category string.
  let hash = 0;
  for (let i = 0; i < category.length; i++) hash = category.charCodeAt(i) + ((hash << 5) - hash);
  const hue = Math.abs(hash) % 360;
  return (
    <span
      className="cat-dot"
      style={{ background: `hsl(${hue}, 65%, 55%)` }}
      aria-hidden="true"
    />
  );
}

export default function App() {
  const [categories, setCategories] = useState([]);
  const [activeCategory, setActiveCategory] = useState("all");
  const [products, setProducts] = useState([]);
  const [cursor, setCursor] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastFetchMs, setLastFetchMs] = useState(null);

  const sentinelRef = useRef(null);
  const requestSeq = useRef(0);

  useEffect(() => {
    fetch(`${API_BASE}/categories`)
      .then((r) => r.json())
      .then((data) => setCategories(data.categories || []))
      .catch(() => {
      });
  }, []);

  const loadPage = useCallback(async (category, cursorParam, isFreshLoad) => {
    const seq = ++requestSeq.current;
    setLoading(true);
    setError(null);
    const t0 = performance.now();
    try {
      const params = new URLSearchParams({ limit: String(PAGE_SIZE) });
      if (category !== "all") params.set("category", category);
      if (cursorParam) params.set("cursor", cursorParam);

      const res = await fetch(`${API_BASE}/products?${params.toString()}`);
      if (!res.ok) throw new Error(`Server responded ${res.status}`);
      const data = await res.json();

      if (seq !== requestSeq.current) return;

      setLastFetchMs(Math.round(performance.now() - t0));
      setProducts((prev) => (isFreshLoad ? data.products : [...prev, ...data.products]));
      setCursor(data.nextCursor);
      setHasMore(data.hasMore);
    } catch (err) {
      if (seq !== requestSeq.current) return;
      setError(err.message || "Failed to load products");
    } finally {
      if (seq === requestSeq.current) {
        setLoading(false);
        setInitialLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    setInitialLoading(true);
    setProducts([]);
    setCursor(null);
    setHasMore(true);
    loadPage(activeCategory, null, true);
  }, [activeCategory, loadPage]);

  useEffect(() => {
    if (!sentinelRef.current) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading) {
          loadPage(activeCategory, cursor, false);
        }
      },
      { rootMargin: "400px" }
    );
    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [activeCategory, cursor, hasMore, loading, loadPage]);

  return (
    <div className="page">
      <header className="topbar">
        <div className="brand">
          <span className="brand-mark">◧</span>
          <div>
            <h1>Catalog</h1>
            <p className="brand-sub">200,000 SKUs · live feed</p>
          </div>
        </div>
        {lastFetchMs !== null && (
          <div className="perf-badge" title="Time for the most recent page fetch">
            <span className="perf-dot" />
            {lastFetchMs}ms / page
          </div>
        )}
      </header>

      <nav className="filter-bar" aria-label="Filter by category">
        <button
          className={`chip ${activeCategory === "all" ? "chip--active" : ""}`}
          onClick={() => setActiveCategory("all")}
        >
          All
        </button>
        {categories.map((cat) => (
          <button
            key={cat}
            className={`chip ${activeCategory === cat ? "chip--active" : ""}`}
            onClick={() => setActiveCategory(cat)}
          >
            <CategoryIcon category={cat} />
            {cat}
          </button>
        ))}
      </nav>

      <main>
        {error && (
          <div className="error-banner">
            Couldn't reach the catalog API — {error}. Is the backend running and{" "}
            <code>VITE_API_BASE</code> set correctly?
          </div>
        )}

        {initialLoading ? (
          <div className="grid">
            {Array.from({ length: 12 }).map((_, i) => (
              <div className="card card--skeleton" key={i} />
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="empty-state">
            <p>No products in this category yet.</p>
          </div>
        ) : (
          <>
            <div className="grid">
              {products.map((p) => (
                <article className="card" key={p._id}>
                  <div className="card-top">
                    <CategoryIcon category={p.category} />
                    <span className="card-category">{p.category}</span>
                  </div>
                  <h3 className="card-name">{p.name}</h3>
                  <div className="card-price">{formatPrice(p.price)}</div>
                  <div className="card-meta">
                    <span>{formatDate(p.createdAt)}</span>
                    <span className="card-id">#{p._id.slice(-6)}</span>
                  </div>
                </article>
              ))}
            </div>

            <div ref={sentinelRef} className="sentinel">
              {loading && <span className="loading-text">Loading more…</span>}
              {!hasMore && !loading && <span className="end-text">— end of catalog —</span>}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
