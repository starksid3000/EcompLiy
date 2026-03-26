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
  const [totalRecords, setTotalRecords] = useState(0);
  const [lazyParams, setLazyParams] = useState({ first: 0, rows: 10, page: 1 });
  const toast = useRef(null);

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
            <label className="font-semibold mb-2 block">Image URL</label>
            <InputText
              value={product.imageUrl}
              onChange={(e) =>
                setProduct({ ...product, imageUrl: e.target.value })
              }
            />
          </div>
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
