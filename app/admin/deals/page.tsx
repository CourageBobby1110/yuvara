"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { 
  Zap, 
  Flame, 
  Plus, 
  Trash2, 
  Edit3, 
  Clock, 
  Search, 
  X, 
  Check, 
  AlertCircle,
  Tag,
  Star,
  ExternalLink,
  RefreshCw
} from "lucide-react";
import { toast } from "sonner";
import AdminSkeleton from "@/components/AdminSkeleton";
import styles from "./DealsAdmin.module.css";

interface Product {
  _id: string;
  name: string;
  price: number;
  images: string[];
  category: string;
  slug: string;
  stock: number;
}

interface Deal {
  _id: string;
  type: "countdown" | "limited";
  product: Product;
  customTitle?: string;
  dealPrice: number;
  originalPrice?: number;
  discountPercent?: number;
  endTime?: string;
  durationHours?: number;
  claimedPercent?: number;
  stockRemaining?: number;
  stockTag?: string;
  rating?: number;
  reviewCount?: number;
  isActive: boolean;
  order: number;
}

export default function DealsAdminPage() {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"countdown" | "limited">("countdown");

  // Modal / Form state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDealId, setEditingDealId] = useState<string | null>(null);
  
  // Product Search for adding
  const [productSearchQuery, setProductSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [searchingProducts, setSearchingProducts] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  // Form Fields
  const [formType, setFormType] = useState<"countdown" | "limited">("countdown");
  const [customTitle, setCustomTitle] = useState("");
  const [dealPrice, setDealPrice] = useState<number | "">("");
  const [originalPrice, setOriginalPrice] = useState<number | "">("");
  const [durationHours, setDurationHours] = useState<number>(24);
  const [claimedPercent, setClaimedPercent] = useState<number>(80);
  const [stockRemaining, setStockRemaining] = useState<number>(5);
  const [stockTag, setStockTag] = useState<string>("Only 5 left");
  const [rating, setRating] = useState<number>(4.9);
  const [reviewCount, setReviewCount] = useState<number>(120);
  const [isActive, setIsActive] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchDeals();
  }, []);

  const fetchDeals = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/deals");
      if (!res.ok) throw new Error("Failed to fetch deals");
      const data = await res.json();
      setDeals(data);
    } catch (err: any) {
      toast.error(err.message || "Failed to load deals");
    } finally {
      setLoading(false);
    }
  };

  // Search products
  useEffect(() => {
    if (!isModalOpen) return;
    const timer = setTimeout(async () => {
      try {
        setSearchingProducts(true);
        const res = await fetch(`/api/admin/deals?searchProduct=${encodeURIComponent(productSearchQuery)}`);
        if (res.ok) {
          const data = await res.json();
          setSearchResults(data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setSearchingProducts(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [productSearchQuery, isModalOpen]);

  const handleOpenAdd = (type: "countdown" | "limited") => {
    setEditingDealId(null);
    setFormType(type);
    setSelectedProduct(null);
    setProductSearchQuery("");
    setCustomTitle("");
    setDealPrice("");
    setOriginalPrice("");
    setDurationHours(24);
    setClaimedPercent(80);
    setStockRemaining(5);
    setStockTag("Only 5 left");
    setRating(4.9);
    setReviewCount(120);
    setIsActive(true);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (deal: Deal) => {
    setEditingDealId(deal._id);
    setFormType(deal.type);
    setSelectedProduct(deal.product);
    setCustomTitle(deal.customTitle || "");
    setDealPrice(deal.dealPrice);
    setOriginalPrice(deal.originalPrice || "");
    setDurationHours(deal.durationHours || 24);
    setClaimedPercent(deal.claimedPercent || 80);
    setStockRemaining(deal.stockRemaining || 5);
    setStockTag(deal.stockTag || "Only 5 left");
    setRating(deal.rating || 4.9);
    setReviewCount(deal.reviewCount || 120);
    setIsActive(deal.isActive);
    setIsModalOpen(true);
  };

  const handleSelectProduct = (product: Product) => {
    setSelectedProduct(product);
    if (!dealPrice) {
      setDealPrice(Number((product.price * 0.7).toFixed(2))); // Default 30% off
    }
    if (!originalPrice) {
      setOriginalPrice(product.price);
    }
  };

  const handleSaveDeal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) {
      toast.error("Please select a store product");
      return;
    }
    if (!dealPrice || Number(dealPrice) <= 0) {
      toast.error("Please enter a valid deal price");
      return;
    }

    try {
      setSubmitting(true);
      const payload: any = {
        type: formType,
        product: selectedProduct._id,
        customTitle: customTitle.trim() || undefined,
        dealPrice: Number(dealPrice),
        originalPrice: originalPrice ? Number(originalPrice) : Number(dealPrice) * 1.5,
        durationHours: Number(durationHours),
        claimedPercent: Number(claimedPercent),
        stockRemaining: Number(stockRemaining),
        stockTag: stockTag.trim(),
        rating: Number(rating),
        reviewCount: Number(reviewCount),
        isActive: isActive,
      };

      if (editingDealId) {
        payload.id = editingDealId;
        const res = await fetch("/api/admin/deals", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error("Failed to update deal");
        toast.success("Deal updated successfully");
      } else {
        const res = await fetch("/api/admin/deals", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error("Failed to create deal");
        toast.success("Deal created successfully");
      }

      setIsModalOpen(false);
      fetchDeals();
    } catch (err: any) {
      toast.error(err.message || "Failed to save deal");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteDeal = async (id: string) => {
    if (!confirm("Are you sure you want to remove this deal?")) return;
    try {
      const res = await fetch(`/api/admin/deals?id=${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete");
      toast.success("Deal deleted");
      setDeals((prev) => prev.filter((d) => d._id !== id));
    } catch (err: any) {
      toast.error(err.message || "Failed to delete deal");
    }
  };

  const handleToggleActive = async (deal: Deal) => {
    try {
      const updated = !deal.isActive;
      setDeals((prev) =>
        prev.map((d) => (d._id === deal._id ? { ...d, isActive: updated } : d))
      );
      const res = await fetch("/api/admin/deals", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: deal._id, isActive: updated }),
      });
      if (!res.ok) throw new Error("Failed to toggle");
      toast.success(updated ? "Deal activated" : "Deal deactivated");
    } catch (err: any) {
      toast.error("Failed to update status");
      fetchDeals();
    }
  };

  if (loading) return <AdminSkeleton variant="dashboard" />;

  const filteredDeals = deals.filter((d) => d.type === activeTab);

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Deals &amp; Countdown Management</h1>
          <p className={styles.subtitle}>
            Select real products from your catalog to feature in the Hero Timed Editions and Limited Clearance Vault.
          </p>
        </div>
        <div className={styles.headerActions}>
          <button 
            onClick={() => handleOpenAdd(activeTab)} 
            className={styles.primaryBtn}
          >
            <Plus size={16} strokeWidth={2.5} />
            <span>Add {activeTab === "countdown" ? "Countdown Deal" : "Limited Deal"}</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className={styles.tabsRow}>
        <button
          onClick={() => setActiveTab("countdown")}
          className={`${styles.tabBtn} ${activeTab === "countdown" ? styles.tabActive : ""}`}
        >
          <Zap size={16} strokeWidth={2.5} />
          <span>Timed Countdown Deals ({deals.filter((d) => d.type === "countdown").length})</span>
        </button>

        <button
          onClick={() => setActiveTab("limited")}
          className={`${styles.tabBtn} ${activeTab === "limited" ? styles.tabActive : ""}`}
        >
          <Flame size={16} strokeWidth={2.5} />
          <span>Limited &amp; Clearance Vault ({deals.filter((d) => d.type === "limited").length})</span>
        </button>
      </div>

      {/* Deals List */}
      <div className={styles.contentSection}>
        {filteredDeals.length === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyIconWrap}>
              {activeTab === "countdown" ? <Zap size={32} /> : <Flame size={32} />}
            </div>
            <h3 className={styles.emptyTitle}>No {activeTab} deals configured yet</h3>
            <p className={styles.emptyText}>
              The homepage is currently showcasing automatic fallback products. Click &quot;Add Deal&quot; to pick specific products from your store.
            </p>
            <button
              onClick={() => handleOpenAdd(activeTab)}
              className={styles.secondaryBtn}
            >
              <Plus size={16} />
              <span>Add Your First Product</span>
            </button>
          </div>
        ) : (
          <div className={styles.dealsGrid}>
            {filteredDeals.map((deal) => {
              const p = deal.product;
              const imgUrl = p?.images?.[0] || "/placeholder.png";

              return (
                <div 
                  key={deal._id} 
                  className={`${styles.dealCard} ${!deal.isActive ? styles.dealCardDisabled : ""}`}
                >
                  <div className={styles.cardImageWrap}>
                    <Image
                      src={imgUrl}
                      alt={p?.name || "Product"}
                      fill
                      className={styles.cardImage}
                    />
                    {deal.discountPercent && deal.discountPercent > 0 && (
                      <span className={styles.cardDiscountBadge}>
                        -{deal.discountPercent}%
                      </span>
                    )}
                  </div>

                  <div className={styles.cardContent}>
                    <div className={styles.cardTopRow}>
                      <span className={styles.cardCategory}>{p?.category || "General"}</span>
                      <div className={styles.switchWrapper}>
                        <label className={styles.switch}>
                          <input
                            type="checkbox"
                            checked={deal.isActive}
                            onChange={() => handleToggleActive(deal)}
                          />
                          <span className={styles.slider}></span>
                        </label>
                        <span className={styles.statusLabel}>
                          {deal.isActive ? "Active" : "Hidden"}
                        </span>
                      </div>
                    </div>

                    <h4 className={styles.cardProductTitle}>
                      {deal.customTitle || p?.name}
                    </h4>

                    <div className={styles.cardPriceRow}>
                      <span className={styles.cardDealPrice}>${deal.dealPrice.toFixed(2)}</span>
                      {deal.originalPrice && (
                        <span className={styles.cardOriginalPrice}>
                          ${deal.originalPrice.toFixed(2)}
                        </span>
                      )}
                    </div>

                    {deal.type === "countdown" ? (
                      <div className={styles.metaRow}>
                        <div className={styles.metaItem}>
                          <Clock size={13} />
                          <span>{deal.durationHours || 24}h Countdown</span>
                        </div>
                        <div className={styles.metaItem}>
                          <span>Claimed: {deal.claimedPercent || 80}%</span>
                        </div>
                      </div>
                    ) : (
                      <div className={styles.metaRow}>
                        <div className={styles.metaItem}>
                          <AlertCircle size={13} />
                          <span>{deal.stockTag || "Limited"}</span>
                        </div>
                        <div className={styles.metaItem}>
                          <Star size={13} fill="#996515" color="#996515" />
                          <span>{deal.rating || 5.0} ({deal.reviewCount || 120})</span>
                        </div>
                      </div>
                    )}

                    <div className={styles.cardActions}>
                      <button
                        onClick={() => handleOpenEdit(deal)}
                        className={styles.editBtn}
                      >
                        <Edit3 size={14} />
                        <span>Edit</span>
                      </button>
                      <button
                        onClick={() => handleDeleteDeal(deal._id)}
                        className={styles.deleteBtn}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* =================================================================
          MODAL: ADD / EDIT DEAL PRODUCT
         ================================================================= */}
      {isModalOpen && (
        <div className={styles.modalBackdrop}>
          <div className={styles.modalContainer}>
            <div className={styles.modalHeader}>
              <div>
                <h3 className={styles.modalTitle}>
                  {editingDealId ? "Edit Deal" : `Add New ${formType === "countdown" ? "Countdown" : "Limited"} Deal`}
                </h3>
                <p className={styles.modalSubtitle}>
                  Choose a product from your store and configure its deal parameters.
                </p>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)} 
                className={styles.closeBtn}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveDeal} className={styles.modalForm}>
              {/* Product Selection */}
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Selected Product *</label>
                {selectedProduct ? (
                  <div className={styles.selectedProductCard}>
                    <div className={styles.selectedImg}>
                      <Image
                        src={selectedProduct.images?.[0] || "/placeholder.png"}
                        alt={selectedProduct.name}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div className={styles.selectedInfo}>
                      <h4 className={styles.selectedTitle}>{selectedProduct.name}</h4>
                      <p className={styles.selectedPrice}>
                        Store Price: ${selectedProduct.price} | Stock: {selectedProduct.stock}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelectedProduct(null)}
                      className={styles.changeProductBtn}
                    >
                      Change
                    </button>
                  </div>
                ) : (
                  <div className={styles.productPickerWrapper}>
                    <div className={styles.searchBar}>
                      <Search size={16} className="text-gray-400" />
                      <input
                        type="text"
                        placeholder="Search products by title or category..."
                        value={productSearchQuery}
                        onChange={(e) => setProductSearchQuery(e.target.value)}
                        className={styles.searchInput}
                      />
                      {searchingProducts && <RefreshCw size={14} className="animate-spin text-gray-400" />}
                    </div>

                    <div className={styles.productResultsList}>
                      {searchResults.length === 0 ? (
                        <p className={styles.noResults}>No products found matching query.</p>
                      ) : (
                        searchResults.map((prod) => (
                          <div
                            key={prod._id}
                            onClick={() => handleSelectProduct(prod)}
                            className={styles.resultItem}
                          >
                            <div className={styles.resultImg}>
                              <Image
                                src={prod.images?.[0] || "/placeholder.png"}
                                alt={prod.name}
                                fill
                                className="object-cover"
                              />
                            </div>
                            <div className={styles.resultText}>
                              <p className={styles.resultName}>{prod.name}</p>
                              <span className={styles.resultMeta}>
                                ${prod.price} • {prod.category}
                              </span>
                            </div>
                            <button type="button" className={styles.selectItemBtn}>
                              Select
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Deal Settings */}
              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Deal Price ($) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="e.g. 19.99"
                    value={dealPrice}
                    onChange={(e) => setDealPrice(e.target.value === "" ? "" : Number(e.target.value))}
                    className={styles.inputField}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Original Crossed Price ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="e.g. 39.99"
                    value={originalPrice}
                    onChange={(e) => setOriginalPrice(e.target.value === "" ? "" : Number(e.target.value))}
                    className={styles.inputField}
                  />
                </div>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Custom Display Title (Optional)</label>
                <input
                  type="text"
                  placeholder="Leave empty to use original product title"
                  value={customTitle}
                  onChange={(e) => setCustomTitle(e.target.value)}
                  className={styles.inputField}
                />
              </div>

              {formType === "countdown" ? (
                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Countdown Duration (Hours)</label>
                    <input
                      type="number"
                      value={durationHours}
                      onChange={(e) => setDurationHours(Number(e.target.value))}
                      className={styles.inputField}
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Claimed Progress (%)</label>
                    <input
                      type="number"
                      min="10"
                      max="98"
                      value={claimedPercent}
                      onChange={(e) => setClaimedPercent(Number(e.target.value))}
                      className={styles.inputField}
                    />
                  </div>
                </div>
              ) : (
                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Stock Urgency Tag</label>
                    <input
                      type="text"
                      placeholder="e.g. Only 3 pieces left"
                      value={stockTag}
                      onChange={(e) => setStockTag(e.target.value)}
                      className={styles.inputField}
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Rating Stars (1 - 5)</label>
                    <input
                      type="number"
                      step="0.1"
                      min="1"
                      max="5"
                      value={rating}
                      onChange={(e) => setRating(Number(e.target.value))}
                      className={styles.inputField}
                    />
                  </div>
                </div>
              )}

              <div className={styles.modalFooter}>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className={styles.cancelBtn}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className={styles.saveBtn}
                >
                  {submitting ? "Saving..." : editingDealId ? "Update Deal" : "Create Deal"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
