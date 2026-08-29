"use client";

import { useState, useEffect } from "react";
import { 
  Send, 
  Sparkles, 
  Eye, 
  Search,
  CheckCircle2,
  Package,
  Layers
} from "lucide-react";
import styles from "./AdminMarketing.module.css";
import AdminSkeleton from "@/components/AdminSkeleton";
import { getProductMainImage } from "@/lib/utils";

interface User {
  _id: string;
  name: string;
  email: string;
}

interface Product {
  _id: string;
  name: string;
  slug: string;
  price: number;
  image?: string;
  images?: string[] | string;
  description?: string;
  category?: string;
}

export default function MarketingPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<string>("");
  const [selectedCatalogue, setSelectedCatalogue] = useState<string[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [subject, setSubject] = useState<string>("");
  const [headline, setHeadline] = useState<string>("Curated Atelier Release & Seasonal Drops");
  const [searchUser, setSearchUser] = useState<string>("");
  const [searchProd, setSearchProd] = useState<string>("");
  const [showPreview, setShowPreview] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [autoCatalogue, setAutoCatalogue] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [usersRes, productsRes] = await Promise.all([
        fetch("/api/admin/users"),
        fetch("/api/products"),
      ]);

      if (usersRes.ok && productsRes.ok) {
        const usersData = await usersRes.json();
        const productsData = await productsRes.json();
        setUsers(usersData);
        setProducts(productsData);

        if (productsData.length > 0) {
          setSelectedProduct(productsData[0]._id);
          setSubject(`Exclusive VIP Spotlight: ${productsData[0].name} + Curated Catalogue`);
        }
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      alert("Failed to load marketing data");
    } finally {
      setLoading(false);
    }
  };

  const handlePrimaryProductChange = (prodId: string) => {
    setSelectedProduct(prodId);
    const prod = products.find((p) => p._id === prodId);
    if (prod) {
      setSubject(`Exclusive VIP Spotlight: ${prod.name} + Curated Catalogue`);
    }
  };

  const handleSelectAllUsers = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedUsers(users.map((u) => u._id));
    } else {
      setSelectedUsers([]);
    }
  };

  const handleUserSelect = (userId: string) => {
    setSelectedUsers((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId]
    );
  };

  const toggleCatalogueItem = (prodId: string) => {
    setSelectedCatalogue((prev) =>
      prev.includes(prodId)
        ? prev.filter((id) => id !== prodId)
        : [...prev, prodId]
    );
  };

  const handleSelectTopN = (count: number) => {
    const topItems = products
      .filter((p) => p._id !== selectedProduct)
      .slice(0, count)
      .map((p) => p._id);
    setSelectedCatalogue(topItems);
  };

  const handleSend = async () => {
    if (!selectedProduct || selectedUsers.length === 0) {
      alert("Please select a primary featured product and at least one recipient.");
      return;
    }

    if (
      !confirm(
        `Send promotional catalogue email (featuring 20+ top catalogue items) to ${selectedUsers.length} customer(s)?`
      )
    )
      return;

    setSending(true);
    try {
      const res = await fetch("/api/admin/marketing/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: selectedProduct,
          userIds: selectedUsers,
          subject: subject.trim() || undefined,
          headline: headline.trim() || undefined,
          catalogueProductIds: autoCatalogue ? undefined : selectedCatalogue,
        }),
      });

      if (res.ok) {
        alert("✨ 24-Product Promotional Catalogue email dispatched successfully!");
        setSelectedUsers([]);
      } else {
        const data = await res.json();
        alert(data.error || "Failed to send promotional emails.");
      }
    } catch (error) {
      console.error("Error sending promotional emails:", error);
      alert("Something went wrong while sending.");
    } finally {
      setSending(false);
    }
  };

  const primaryProd = products.find((p) => p._id === selectedProduct);
  
  // Show up to 24 products in the catalogue grid
  const catalogueProds = autoCatalogue
    ? products.filter((p) => p._id !== selectedProduct).slice(0, 24)
    : products.filter((p) => selectedCatalogue.includes(p._id) && p._id !== selectedProduct);

  const filteredUsers = users.filter(
    (u) =>
      u.name?.toLowerCase().includes(searchUser.toLowerCase()) ||
      u.email?.toLowerCase().includes(searchUser.toLowerCase())
  );

  const filteredProducts = products.filter((p) =>
    p.name?.toLowerCase().includes(searchProd.toLowerCase())
  );

  if (loading) return <AdminSkeleton variant="cards" />;

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <div className={styles.kicker}>
            <Sparkles size={13} className="text-[#996515]" />
            <span>VIP Campaign Studio</span>
          </div>
          <h1 className={styles.title}>Promotional Catalogue Dispatch</h1>
          <p className={styles.subtitle}>
            Send luxury promotional newsletters featuring a spotlight hero piece and up to 24 curated catalogue items.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowPreview(!showPreview)}
          className={styles.previewToggleBtn}
        >
          <Eye size={15} />
          <span>{showPreview ? "Hide Preview" : "Live Email Preview (24 Drops)"}</span>
        </button>
      </div>

      <div className={styles.mainGrid}>
        {/* LEFT COLUMN: Campaign Configuration */}
        <div className={styles.configColumn}>
          {/* Step 1: Campaign Headers */}
          <div className={styles.cardSection}>
            <div className={styles.sectionHeader}>
              <span className={styles.stepBadge}>1</span>
              <h3 className={styles.sectionTitle}>Campaign Subject &amp; Tagline</h3>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Email Subject Line</label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="e.g. Exclusive VIP Spotlight: Handcrafted Loafers + 24 New Arrivals"
                className={styles.input}
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Top Banner Tagline</label>
              <input
                type="text"
                value={headline}
                onChange={(e) => setHeadline(e.target.value)}
                placeholder="e.g. Curated Atelier Release & Seasonal Drops"
                className={styles.input}
              />
            </div>
          </div>

          {/* Step 2: Primary Spotlight Product */}
          <div className={styles.cardSection}>
            <div className={styles.sectionHeader}>
              <span className={styles.stepBadge}>2</span>
              <h3 className={styles.sectionTitle}>Primary Hero Spotlight</h3>
            </div>
            <p className={styles.helpText}>
              Takes center stage in the email with full image, discount tag, and primary CTA.
            </p>

            <div className={styles.formGroup}>
              <select
                className={styles.select}
                value={selectedProduct}
                onChange={(e) => handlePrimaryProductChange(e.target.value)}
              >
                {products.map((p) => (
                  <option key={p._id} value={p._id}>
                    {p.name} — ${p.price}
                  </option>
                ))}
              </select>
            </div>

            {primaryProd && (
              <div className={styles.primaryPreviewCard}>
                <div className={styles.primaryImgWrap}>
                  <img
                    src={getProductMainImage(primaryProd)}
                    alt={primaryProd.name}
                    className={styles.primaryImg}
                  />
                </div>
                <div className={styles.primaryInfo}>
                  <span className={styles.spotlightTag}>Spotlight Hero</span>
                  <h4 className={styles.primaryTitle}>{primaryProd.name}</h4>
                  <div className={styles.primaryPriceRow}>
                    <span className={styles.primaryPrice}>${primaryProd.price.toFixed(2)}</span>
                    <span className={styles.primaryOldPrice}>${(primaryProd.price * 1.75).toFixed(2)}</span>
                    <span className={styles.discountBadge}>-42% OFF</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Step 3: Catalogue Grid Products */}
          <div className={styles.cardSection}>
            <div className={styles.sectionHeader}>
              <span className={styles.stepBadge}>3</span>
              <h3 className={styles.sectionTitle}>
                Curated Catalogue Grid ({autoCatalogue ? `${catalogueProds.length} Auto Drops` : `${selectedCatalogue.length} Selected`})
              </h3>
            </div>
            <p className={styles.helpText}>
              Displays up to 24 products in a responsive 2-column email catalog to maximize conversion.
            </p>

            <div className={styles.toggleRow}>
              <label className={styles.toggleLabel}>
                <input
                  type="checkbox"
                  checked={autoCatalogue}
                  onChange={(e) => setAutoCatalogue(e.target.checked)}
                  className={styles.checkbox}
                />
                <span>Auto-curate top 24 store best-sellers automatically (Recommended)</span>
              </label>
            </div>

            {!autoCatalogue && (
              <div className={styles.manualCatalogueBox}>
                <div style={{ display: "flex", gap: "0.5rem", marginBottom: "0.25rem" }}>
                  <button
                    type="button"
                    onClick={() => handleSelectTopN(24)}
                    style={{
                      fontSize: "0.6875rem",
                      fontWeight: 700,
                      padding: "0.3rem 0.6rem",
                      borderRadius: "4px",
                      border: "1px solid #e5e7eb",
                      background: "#f9fafb",
                      cursor: "pointer",
                    }}
                  >
                    + Pick Top 24 Drops
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSelectTopN(12)}
                    style={{
                      fontSize: "0.6875rem",
                      fontWeight: 700,
                      padding: "0.3rem 0.6rem",
                      borderRadius: "4px",
                      border: "1px solid #e5e7eb",
                      background: "#f9fafb",
                      cursor: "pointer",
                    }}
                  >
                    + Pick Top 12 Drops
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedCatalogue([])}
                    style={{
                      fontSize: "0.6875rem",
                      fontWeight: 700,
                      padding: "0.3rem 0.6rem",
                      borderRadius: "4px",
                      border: "1px solid #e5e7eb",
                      background: "#ffffff",
                      color: "#ef4444",
                      cursor: "pointer",
                    }}
                  >
                    Clear Selection
                  </button>
                </div>

                <div className={styles.searchBox}>
                  <Search size={14} className="text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search catalogue items..."
                    value={searchProd}
                    onChange={(e) => setSearchProd(e.target.value)}
                    className={styles.searchInput}
                  />
                </div>

                <div className={styles.catalogueSelectorList}>
                  {filteredProducts
                    .filter((p) => p._id !== selectedProduct)
                    .map((p) => (
                      <div
                        key={p._id}
                        onClick={() => toggleCatalogueItem(p._id)}
                        className={`${styles.catalogueSelectCard} ${
                          selectedCatalogue.includes(p._id) ? styles.catalogueSelectCardActive : ""
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={selectedCatalogue.includes(p._id)}
                          readOnly
                          className={styles.checkbox}
                        />
                        <div className={styles.catalogueThumb}>
                          <img
                            src={getProductMainImage(p)}
                            alt={p.name}
                            className="object-cover w-full h-full"
                          />
                        </div>
                        <div className={styles.catalogueSelectInfo}>
                          <span className={styles.catalogueSelectTitle}>{p.name}</span>
                          <span className={styles.catalogueSelectPrice}>${p.price}</span>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: Recipients & Dispatch */}
        <div className={styles.recipientsColumn}>
          <div className={styles.cardSection}>
            <div className={styles.sectionHeader}>
              <span className={styles.stepBadge}>4</span>
              <h3 className={styles.sectionTitle}>Select Customer Recipients</h3>
            </div>

            <div className={styles.selectAllBar}>
              <label className={styles.selectAllLabel}>
                <input
                  type="checkbox"
                  checked={selectedUsers.length === users.length && users.length > 0}
                  onChange={handleSelectAllUsers}
                  className={styles.checkbox}
                />
                <span>Select All Customers ({users.length})</span>
              </label>
              <span className={styles.recipientCountBadge}>
                {selectedUsers.length} Selected
              </span>
            </div>

            <div className={styles.searchBox}>
              <Search size={14} className="text-gray-400" />
              <input
                type="text"
                placeholder="Filter by name or email..."
                value={searchUser}
                onChange={(e) => setSearchUser(e.target.value)}
                className={styles.searchInput}
              />
            </div>

            <div className={styles.userList}>
              {filteredUsers.map((user) => (
                <div
                  key={user._id}
                  className={`${styles.userItem} ${
                    selectedUsers.includes(user._id) ? styles.userItemActive : ""
                  }`}
                  onClick={() => handleUserSelect(user._id)}
                >
                  <input
                    type="checkbox"
                    checked={selectedUsers.includes(user._id)}
                    readOnly
                    className={styles.checkbox}
                  />
                  <div className={styles.userInfo}>
                    <span className={styles.userName}>{user.name || "Customer"}</span>
                    <span className={styles.userEmail}>{user.email}</span>
                  </div>
                </div>
              ))}
            </div>

            <button
              type="button"
              className={styles.sendMainBtn}
              onClick={handleSend}
              disabled={sending || !selectedProduct || selectedUsers.length === 0}
            >
              <Send size={15} />
              <span>
                {sending
                  ? "Dispatching 24-Product VIP Newsletters..."
                  : `Send Catalogue Newsletter (${selectedUsers.length} Recipients)`}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* LIVE EMAIL PREVIEW MODAL */}
      {showPreview && (
        <div className={styles.previewOverlay} onClick={() => setShowPreview(false)}>
          <div className={styles.previewModal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.previewHeader}>
              <div>
                <span className={styles.previewBadge}>Live Email Preview</span>
                <h3 className="font-bold text-xs text-gray-900 m-0">{subject}</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowPreview(false)}
                className={styles.closePreviewBtn}
              >
                ✕
              </button>
            </div>

            <div className={styles.previewBody}>
              {/* Simulated Mobile Email Container (Matches clean Gmail Mobile) */}
              <div className={styles.emailMockContainer}>
                {/* 1. Minimal Header */}
                <div className={styles.emailHeader}>
                  <h2 className={styles.emailLogo}>
                    YU<span style={{ color: "#996515" }}>VARA</span>
                  </h2>
                  <p className={styles.emailSub}>{headline}</p>
                </div>

                {/* 2. Seamless 2-Column Product Wall (Up to 24 items) */}
                <div className={styles.emailCatalogueSection}>
                  <div className={styles.emailCatalogueGrid}>
                    {catalogueProds.map((item) => (
                      <div key={item._id} className={styles.emailCatalogueCard}>
                        <img
                          src={getProductMainImage(item)}
                          alt={item.name}
                          className={styles.emailCatalogueImg}
                        />
                        <div className="pt-1 pb-2">
                          <h5 className={styles.emailCardTitle}>{item.name}</h5>
                          <div className={styles.emailCardPrice}>
                            ${Number(item.price).toFixed(2)}
                            <span className={styles.emailCardOldPrice}>
                              ${(item.price * 1.6).toFixed(2)}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="text-center mt-3 mb-2">
                    <div className={styles.emailViewAllBtn}>
                      Shop Entire Collection &rarr;
                    </div>
                  </div>
                </div>

                {/* 3. Minimal Clean Footer */}
                <div className={styles.emailFooter}>
                  <p style={{ margin: "0 0 2px 0", color: "#4b5563", fontWeight: 600 }}>YuVara &bull; Curated Essentials</p>
                  <p style={{ margin: 0, color: "#9ca3af" }}>You received this email because you are a registered customer.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
