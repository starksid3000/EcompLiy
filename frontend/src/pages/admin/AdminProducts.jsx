import React, { useState, useEffect, useRef } from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";
import { InputText } from "primereact/inputtext";
import { InputNumber } from "primereact/inputnumber";
import { InputTextarea } from "primereact/inputtextarea";
import { Dropdown } from "primereact/dropdown";
import { InputSwitch } from "primereact/inputswitch";
import { Tag } from "primereact/tag";
import { ProgressSpinner } from "primereact/progressspinner";
import { Toast } from "primereact/toast";
import { ConfirmDialog, confirmDialog } from "primereact/confirmdialog";
import { Toolbar } from "primereact/toolbar";
import api from "../../utils/api";
import { Paginator } from "primereact/paginator";
import MobilePaginator from "../../components/MobilePaginator";

const emptyProduct = {
  name: "",
  description: "",
  price: 0,
  stock: 0,
  sku: "",
  imageUrl: "",
  categoryId: "",
  isActive: true,
};

const AdminProducts = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogVisible, setDialogVisible] = useState(false);
  const [product, setProduct] = useState(emptyProduct);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [galleryImages, setGalleryImages] = useState([]);
  const [uploadingGallery, setUploadingGallery] = useState(false);
  const [draggedImage, setDraggedImage] = useState(null);
  const [totalRecords, setTotalRecords] = useState(0);
  const [lazyParams, setLazyParams] = useState({ first: 0, rows: 10, page: 1 });
  const toast = useRef(null);
  const fileInputRef = useRef(null);
  const galleryInputRef = useRef(null);

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [lazyParams]);

  const fetchCategories = async () => {
    try {
      const res = await api.get("/category", { params: { limit: 50 } });
      setCategories(
        (res.data?.data || []).map((c) => ({ label: c.name, value: c.id })),
      );
    } catch {
      // silent
    }
  };

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const res = await api.get("/products", {
        params: { page: lazyParams.page, limit: lazyParams.rows },
      });
      setProducts(res.data?.data || []);
      setTotalRecords(res.data?.meta?.total || 0);
    } catch {
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "Failed to load products",
        life: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  const onPage = (e) => {
    setLazyParams({
      first: e.first,
      rows: e.rows,
      page: Math.floor(e.first / e.rows) + 1,
    });
  };

  // Create product - handle image upload 
  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingImage(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await api.post('/storage/upload?folder=products', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const url = res.data?.url;
      setProduct((prev) => ({ ...prev, imageUrl: url }));
      toast.current?.show({ severity: 'success', summary: 'Uploaded', detail: 'Image uploaded successfully', life: 2000 });
    } catch (err) {
      toast.current?.show({ severity: 'error', summary: 'Upload Failed', detail: err.response?.data?.message || 'Failed to upload image', life: 3000 });
    } finally {
      setUploadingImage(false);
      e.target.value = '';
    }
  };

  const openNew = () => {
    setProduct({ ...emptyProduct });
    setIsEditing(false);
    setDialogVisible(true);
  };

  const openEdit = (p) => {
    setProduct({
      id: p.id,
      name: p.name,
      description: p.description || "",
      price: Number(p.price),
      stock: p.stock,
      sku: p.sku,
      imageUrl: p.imageUrl || "",
      categoryId: p.categoryId,
      isActive: p.isActive,
    });
    setIsEditing(true);
    setDialogVisible(true);
    fetchGalleryImages(p.id);
  };

  const fetchGalleryImages = async (productId) => {
    try {
      const res = await api.get(`/products/${productId}/images`);
      setGalleryImages(res.data || []);
    } catch {
      setGalleryImages([]);
    }
  };

  const handleGalleryUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    setUploadingGallery(true);
    try {
      for (const file of files) {
        const formData = new FormData();
        formData.append('file', file);
        await api.post(`/products/${product.id}/images`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      }
      toast.current?.show({ severity: 'success', summary: 'Uploaded', detail: `${files.length} image(s) added to gallery`, life: 2000 });
      fetchGalleryImages(product.id);
    } catch (err) {
      toast.current?.show({ severity: 'error', summary: 'Upload Failed', detail: err.response?.data?.message || 'Failed to upload gallery image', life: 3000 });
    } finally {
      setUploadingGallery(false);
      e.target.value = '';
    }
  };

  const handleDeleteGalleryImage = async (imageId) => {
    try {
      await api.delete(`/products/${product.id}/images/${imageId}`);
      toast.current?.show({ severity: 'success', summary: 'Deleted', detail: 'Image removed from gallery', life: 2000 });
      fetchGalleryImages(product.id);
    } catch {
      toast.current?.show({ severity: 'error', summary: 'Error', detail: 'Failed to delete image', life: 3000 });
    }
  };

  const handleDragStart = (img) => {
    setDraggedImage(img);
  };

  const handleDragOver = (e) => {
    e.preventDefault(); // Necessary to allow dropping
  };

  const handleDrop = async (targetImg) => {
    if (!draggedImage || draggedImage.id === targetImg.id) return;
    
    // Optimistic UI update
    const newImages = [...galleryImages];
    const draggedIdx = newImages.findIndex(img => img.id === draggedImage.id);
    const targetIdx = newImages.findIndex(img => img.id === targetImg.id);
    
    // Reorder array
    newImages.splice(draggedIdx, 1);
    newImages.splice(targetIdx, 0, draggedImage);
    
    setGalleryImages(newImages);
    setDraggedImage(null);

    // Sync with backend API
    try {
      await api.patch(`/products/${product.id}/images/reorder`, {
        order: newImages.map(img => img.id)
      });
      // Optional: hide toast for drag-and-drop to keep it quiet and smooth
      // toast.current?.show({ severity: 'success', summary: 'Reordered', detail: 'Gallery order saved', life: 1000 });
    } catch (err) {
      toast.current?.show({ severity: 'error', summary: 'Error', detail: 'Failed to reorder images', life: 3000 });
      fetchGalleryImages(product.id); // Revert UI if API fails
    }
  };

  const handleSave = async () => {
    if (!product.name || !product.sku || !product.categoryId) {
      toast.current?.show({
        severity: "warn",
        summary: "Validation",
        detail: "Name, SKU, and Category are required",
        life: 3000,
      });
      return;
    }
    setSaving(true);
    try {
      if (isEditing) {
        const { id, ...data } = product;
        await api.patch(`/products/${id}`, data);
        toast.current?.show({
          severity: "success",
          summary: "Updated",
          detail: "Product updated successfully",
          life: 2000,
        });
      } else {
        await api.post("/products", product);
        toast.current?.show({
          severity: "success",
          summary: "Created",
          detail: "Product created successfully",
          life: 2000,
        });
      }
      setDialogVisible(false);
      fetchProducts();
    } catch (err) {
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: err.response?.data?.message || "Failed to save product",
        life: 3000,
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (p) => {
    confirmDialog({
      message: `Delete "${p.name}"? This action cannot be undone.`,
      header: "Confirm Delete",
      icon: "pi pi-exclamation-triangle",
      acceptClassName: "p-button-danger",
      accept: async () => {
        try {
          await api.delete(`/products/${p.id}`);
          toast.current?.show({
            severity: "success",
            summary: "Deleted",
            detail: "Product deleted",
            life: 2000,
          });
          fetchProducts();
        } catch (err) {
          toast.current?.show({
            severity: "error",
            summary: "Error",
            detail: err.response?.data?.message || "Could not delete product",
            life: 3000,
          });
        }
      },
    });
  };

  // Column templates
  const imageBody = (p) => (
    <img
      src={
        p.imageUrl ||
        "https://primefaces.org/cdn/primereact/images/usercard.png"
      }
      alt={p.name}
      className="border-round"
      style={{ width: "50px", height: "50px", objectFit: "cover" }}
    />
  );

  const priceBody = (p) => (
    <span className="font-semibold">${Number(p.price).toFixed(2)}</span>
  );

  const stockBody = (p) => (
    <Tag
      value={p.stock}
      severity={p.stock > 10 ? "success" : p.stock > 0 ? "warning" : "danger"}
    />
  );

  const statusBody = (p) => (
    <Tag
      value={p.isActive ? "Active" : "Inactive"}
      severity={p.isActive ? "success" : "danger"}
    />
  );

  const actionBody = (p) => (
    <div className="flex gap-2">
      <Button
        icon="pi pi-pencil"
        className="p-button-rounded p-button-text p-button-sm"
        onClick={() => openEdit(p)}
        tooltip="Edit"
      />
      <Button
        icon="pi pi-trash"
        className="p-button-rounded p-button-danger p-button-text p-button-sm"
        onClick={() => handleDelete(p)}
        tooltip="Delete"
      />
    </div>
  );

  const leftToolbar = () => (
    <Button
      label="New Product"
      icon="pi pi-plus"
      className="p-button-rounded"
      onClick={openNew}
    />
  );

  const rightToolbar = () => (
    <span className="text-500 text-sm">{totalRecords} total products</span>
  );

  return (
    <div className="px-2 py-4 md:px-4">
      <Toast ref={toast} />
      <ConfirmDialog />

      <h1 className="text-900 font-bold text-3xl mb-5">
        <i className="pi pi-box mr-3 text-primary" />
        Manage Products
      </h1>

      <Toolbar
        left={leftToolbar}
        right={rightToolbar}
        className="mb-4 border-round-xl"
      />

      {loading ? (
        <div className="flex justify-content-center py-8">
          <ProgressSpinner />
        </div>
      ) : (
        <DataTable
          value={products}
          responsiveLayout="scroll"
          className="shadow-2 border-round-xl"
          stripedRows
          lazy
          paginator={false}
          first={lazyParams.first}
          rows={lazyParams.rows}
          totalRecords={totalRecords}
          onPage={onPage}
          rowsPerPageOptions={[5, 10, 25]}
          emptyMessage="No products found"
        >
          <Column body={imageBody} header="" style={{ width: "70px" }} />
          <Column
            field="name"
            header="Name"
            sortable
            style={{ minWidth: "200px" }}
          />
          <Column field="sku" header="SKU" sortable className="font-mono" />
          <Column field="category" header="Category" sortable />
          <Column body={priceBody} header="Price" sortable sortField="price" />
          <Column body={stockBody} header="Stock" sortable sortField="stock" />
          <Column body={statusBody} header="Status" />
          <Column
            body={actionBody}
            header="Actions"
            style={{ width: "120px" }}
          />
        </DataTable>
      )}
      {totalRecords > lazyParams.rows && (
        <div className="flex justify-content-center mt-4">
          {/* Mobile paginator */}
          <MobilePaginator
            first={lazyParams.first}
            rows={lazyParams.rows}
            totalRecords={totalRecords}
            onPageChange={onPage}
          />

          {/* Desktop paginator */}
          <div className="hidden md:flex">
            <Paginator
              first={lazyParams.first}
              rows={lazyParams.rows}
              totalRecords={totalRecords}
              rowsPerPageOptions={[5, 10, 25]}
              onPageChange={onPage}
              className="border-round-xl"
            />
          </div>
        </div>
      )}
      {/* Create/Edit Dialog */}
      <Dialog
        visible={dialogVisible}
        onHide={() => setDialogVisible(false)}
        header={isEditing ? "Edit Product" : "New Product"}
        style={{ width: "550px" }}
        modal
        className="p-fluid"
      >
        <div className="flex flex-column gap-4 pt-3">
          <div className="field">
            <label className="font-semibold mb-2 block">Name *</label>
            <InputText
              value={product.name}
              onChange={(e) => setProduct({ ...product, name: e.target.value })}
            />
          </div>
          <div className="field">
            <label className="font-semibold mb-2 block">Description</label>
            <InputTextarea
              value={product.description}
              onChange={(e) =>
                setProduct({ ...product, description: e.target.value })
              }
              rows={3}
              autoResize
            />
          </div>
          <div className="grid">
            <div className="col-6">
              <label className="font-semibold mb-2 block">Price *</label>
              <InputNumber
                value={product.price}
                onValueChange={(e) =>
                  setProduct({ ...product, price: e.value })
                }
                mode="currency"
                currency="USD"
              />
            </div>
            <div className="col-6">
              <label className="font-semibold mb-2 block">Stock *</label>
              <InputNumber
                value={product.stock}
                onValueChange={(e) =>
                  setProduct({ ...product, stock: e.value })
                }
                min={0}
              />
            </div>
          </div>
          <div className="grid">
            <div className="col-6">
              <label className="font-semibold mb-2 block">SKU *</label>
              <InputText
                value={product.sku}
                onChange={(e) =>
                  setProduct({ ...product, sku: e.target.value })
                }
              />
            </div>
            <div className="col-6">
              <label className="font-semibold mb-2 block">Category *</label>
              <Dropdown
                value={product.categoryId}
                options={categories}
                onChange={(e) =>
                  setProduct({ ...product, categoryId: e.value })
                }
                placeholder="Select"
              />
            </div>
          </div>
          <div className="field">
            <label className="font-semibold mb-2 block">Product Image</label>

            {/* Image preview */}
            {product.imageUrl && (
              <div className="mb-3 text-center">
                <img
                  src={product.imageUrl}
                  alt="Preview"
                  className="border-round shadow-2"
                  style={{ maxHeight: '160px', maxWidth: '100%', objectFit: 'cover' }}
                />
              </div>
            )}

            {/* Hidden real file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              style={{ display: 'none' }}
              onChange={handleImageUpload}
            />

            {/* Styled upload button */}
            <Button
              type="button"
              label={uploadingImage ? 'Uploading...' : product.imageUrl ? 'Change Image' : 'Upload Image'}
              icon={uploadingImage ? 'pi pi-spin pi-spinner' : 'pi pi-upload'}
              className="p-button-outlined w-full"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingImage}
            />

            {/* Show current URL as small text for reference */}
            {product.imageUrl && (
              <small className="text-500 block mt-2" style={{ wordBreak: 'break-all' }}>{product.imageUrl}</small>
            )}
          </div>

          {/* ─── Gallery Images (edit mode only) ─── */}
          {isEditing && product.id && (
            <div className="field">
              <label className="font-semibold mb-2 block">
                <i className="pi pi-images mr-2" />
                Gallery Images
              </label>

              {/* Gallery thumbnails */}
              {galleryImages.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-3">
                  {galleryImages.map((img) => (
                    <div 
                      key={img.id} 
                      className="relative cursor-move" 
                      style={{ width: '80px', height: '80px', opacity: draggedImage?.id === img.id ? 0.5 : 1 }}
                      draggable
                      onDragStart={() => handleDragStart(img)}
                      onDragOver={handleDragOver}
                      onDrop={() => handleDrop(img)}
                    >
                      <img
                        src={img.url}
                        alt={img.altText || 'Gallery'}
                        className="border-round shadow-1 w-full h-full"
                        style={{ objectFit: 'cover' }}
                        draggable={false} // Prevent browser's default image drag
                      />
                      <Button
                        icon="pi pi-times"
                        className="p-button-rounded p-button-danger p-button-sm"
                        style={{ position: 'absolute', top: '-8px', right: '-8px', width: '24px', height: '24px' }}
                        onClick={() => handleDeleteGalleryImage(img.id)}
                        tooltip="Remove"
                      />
                    </div>
                  ))}
                </div>
              )}

              {/* Hidden multi-file input */}
              <input
                ref={galleryInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                multiple
                style={{ display: 'none' }}
                onChange={handleGalleryUpload}
              />

              <Button
                type="button"
                label={uploadingGallery ? 'Uploading...' : 'Add Gallery Images'}
                icon={uploadingGallery ? 'pi pi-spin pi-spinner' : 'pi pi-plus'}
                className="p-button-outlined p-button-sm w-full"
                onClick={() => galleryInputRef.current?.click()}
                disabled={uploadingGallery}
              />
              <small className="text-500 block mt-1">Select multiple images at once. Max 5MB each.</small>
            </div>
          )}

          <div className="flex align-items-center gap-3">
            <label className="font-semibold">Active</label>
            <InputSwitch
              checked={product.isActive}
              onChange={(e) => setProduct({ ...product, isActive: e.value })}
            />
          </div>
          <div className="flex justify-content-end gap-2 pt-3">
            <Button
              label="Cancel"
              icon="pi pi-times"
              className="p-button-text"
              onClick={() => setDialogVisible(false)}
            />
            <Button
              label={saving ? "Saving..." : "Save"}
              icon="pi pi-check"
              onClick={handleSave}
              loading={saving}
            />
          </div>
        </div>
      </Dialog>
    </div>
  );
};

export default AdminProducts;
