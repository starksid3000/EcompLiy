import { useState, useEffect, useRef } from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";
import { InputText } from "primereact/inputtext";
import { InputTextarea } from "primereact/inputtextarea";
import { InputSwitch } from "primereact/inputswitch";
import { Tag } from "primereact/tag";
import { Toast } from "primereact/toast";
import { ConfirmDialog, confirmDialog } from "primereact/confirmdialog";
import { Toolbar } from "primereact/toolbar";
import { ProgressSpinner } from "primereact/progressspinner";
import api from "../../utils/api";

const emptyCategory = {
  name: "",
  description: "",
  slug: "",
  imageUrl: "",
  isActive: true,
};

const AdminCategories = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogVisible, setDialogVisible] = useState(false);
  const [category, setCategory] = useState(emptyCategory);
  const [editMode, setEditMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const toast = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const res = await api.get("/category", { params: { limit: 100 } });
      setCategories(res.data?.data || []);
    } catch {
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "Failed to fetch categories",
        life: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingImage(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await api.post('/storage/upload?folder=categories', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const url = res.data?.url;
      setCategory((prev) => ({ ...prev, imageUrl: url }));
      toast.current?.show({ severity: 'success', summary: 'Uploaded', detail: 'Image uploaded successfully', life: 2000 });
    } catch (err) {
      toast.current?.show({ severity: 'error', summary: 'Upload Failed', detail: err.response?.data?.message || 'Failed to upload image', life: 3000 });
    } finally {
      setUploadingImage(false);
      e.target.value = '';
    }
  };

  const openNew = () => {
    setCategory({ ...emptyCategory });
    setEditMode(false);
    setDialogVisible(true);
  };

  const openEdit = (cat) => {
    setCategory({
      id: cat.id,
      name: cat.name,
      description: cat.description || "",
      slug: cat.slug || "",
      imageUrl: cat.imageUrl || "",
      isActive: cat.isActive ?? true,
    });
    setEditMode(true);
    setDialogVisible(true);
  };

  const hideDialog = () => {
    setDialogVisible(false);
    setCategory(emptyCategory);
  };

  const saveCategory = async () => {
    if (!category.name?.trim()) {
      toast.current?.show({
        severity: "warn",
        summary: "Validation",
        detail: "Category name is required",
        life: 2000,
      });
      return;
    }

    setSaving(true);
    try {
      const payload = {
        name: category.name.trim(),
        description: category.description?.trim() || undefined,
        slug: category.slug?.trim() || undefined,
        imageUrl: category.imageUrl?.trim() || undefined,
        isActive: category.isActive,
      };

      if (editMode) {
        await api.patch(`/category/${category.id}`, payload);
        toast.current?.show({
          severity: "success",
          summary: "Updated",
          detail: "Category updated successfully",
          life: 2000,
        });
      } else {
        await api.post("/category", payload);
        toast.current?.show({
          severity: "success",
          summary: "Created",
          detail: "Category created successfully",
          life: 2000,
        });
      }
      hideDialog();
      fetchCategories();
    } catch (err) {
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: err?.response?.data?.message || "Save failed",
        life: 3000,
      });
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = (cat) => {
    confirmDialog({
      message: `Delete "${cat.name}"? Categories with products cannot be deleted.`,
      header: "Confirm Delete",
      icon: "pi pi-exclamation-triangle",
      acceptClassName: "p-button-danger",
      accept: async () => {
        try {
          await api.delete(`/category/${cat.id}`);
          toast.current?.show({
            severity: "success",
            summary: "Deleted",
            detail: "Category deleted successfully",
            life: 2000,
          });
          fetchCategories();
        } catch (err) {
          toast.current?.show({
            severity: "error",
            summary: "Error",
            detail: err?.response?.data?.message || "Cannot delete category",
            life: 3000,
          });
        }
      },
    });
  };

  const onInputChange = (field, value) => {
    setCategory((prev) => ({ ...prev, [field]: value }));
  };

  // Auto-generate slug from name
  const autoSlug = () => {
    if (!category.slug && category.name) {
      const slug = category.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");
      setCategory((prev) => ({ ...prev, slug }));
    }
  };

  // Table templates
  const imageBody = (cat) =>
    cat.imageUrl ? (
      <img
        src={cat.imageUrl}
        alt={cat.name}
        className="border-round"
        style={{ width: "50px", height: "50px", objectFit: "cover" }}
      />
    ) : (
      <div
        className="border-round flex align-items-center justify-content-center surface-200"
        style={{ width: "50px", height: "50px" }}
      >
        <i className="pi pi-image text-400" />
      </div>
    );

  const statusBody = (cat) => (
    <Tag
      value={cat.isActive ? "Active" : "Inactive"}
      severity={cat.isActive ? "success" : "danger"}
    />
  );

  const productCountBody = (cat) => (
    <Tag value={cat.productCount ?? 0} severity="info" className="font-bold" />
  );

  const dateBody = (cat) =>
    new Date(cat.createdAt).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });

  const actionBody = (cat) => (
    <div className="flex gap-2">
      <Button
        icon="pi pi-pencil"
        className="p-button-rounded p-button-text p-button-sm"
        tooltip="Edit"
        onClick={() => openEdit(cat)}
      />
      <Button
        icon="pi pi-trash"
        className="p-button-rounded p-button-danger p-button-text p-button-sm"
        tooltip="Delete"
        onClick={() => confirmDelete(cat)}
      />
    </div>
  );

  const toolbarLeft = () => (
    <div className="flex align-items-center gap-3">
      <h2 className="text-900 font-bold text-2xl m-0">
        <i className="pi pi-tags mr-2 text-primary" />
        Manage Categories
      </h2>
    </div>
  );

  const toolbarRight = () => (
    <Button
      label="New Category"
      icon="pi pi-plus"
      className="p-button-rounded shadow-2"
      onClick={openNew}
    />
  );

  const dialogFooter = (
    <div className="flex justify-content-end gap-2">
      <Button
        label="Cancel"
        icon="pi pi-times"
        className="p-button-text"
        onClick={hideDialog}
      />
      <Button
        label={saving ? "Saving..." : editMode ? "Update" : "Create"}
        icon="pi pi-check"
        className="p-button-rounded"
        onClick={saveCategory}
        loading={saving}
      />
    </div>
  );

  if (loading) {
    return (
      <div className="flex justify-content-center py-8">
        <ProgressSpinner />
      </div>
    );
  }

  return (
    <div className="px-2 py-4 md:px-4">
      <Toast ref={toast} />
      <ConfirmDialog />

      <Toolbar
        left={toolbarLeft}
        right={toolbarRight}
        className="mb-4 surface-card shadow-2 border-round-xl border-none"
      />

      <DataTable
        value={categories}
        responsiveLayout="scroll"
        className="shadow-2 border-round-xl"
        stripedRows
        paginator={false}
        rows={10}
        emptyMessage="No categories found"
        sortField="name"
        sortOrder={1}
      >
        <Column body={imageBody} header="" style={{ width: "70px" }} />
        <Column field="name" header="Name" sortable className="font-semibold" />
        <Column
          field="slug"
          header="Slug"
          sortable
          className="font-mono text-sm"
        />
        <Column
          field="description"
          header="Description"
          style={{ maxWidth: "250px" }}
          body={(cat) => (
            <span
              className="text-600 text-sm white-space-nowrap overflow-hidden text-overflow-ellipsis block"
              style={{ maxWidth: "250px" }}
            >
              {cat.description || "—"}
            </span>
          )}
        />
        <Column
          body={productCountBody}
          header="Products"
          sortable
          sortField="productCount"
          style={{ width: "100px" }}
        />
        <Column
          body={statusBody}
          header="Status"
          sortable
          sortField="isActive"
          style={{ width: "100px" }}
        />
        <Column
          body={dateBody}
          header="Created"
          sortable
          sortField="createdAt"
          style={{ width: "120px" }}
        />
        <Column body={actionBody} header="Actions" style={{ width: "100px" }} />
      </DataTable>
      {/* Create/Edit Dialog */}
      <Dialog
        visible={dialogVisible}
        style={{ width: "500px" }}
        header={editMode ? "Edit Category" : "New Category"}
        modal
        className="p-fluid"
        footer={dialogFooter}
        onHide={hideDialog}
      >
        <div className="flex flex-column gap-4 pt-2">
          <div>
            <label
              htmlFor="cat-name"
              className="font-semibold text-900 block mb-2"
            >
              Name *
            </label>
            <InputText
              id="cat-name"
              value={category.name}
              onChange={(e) => onInputChange("name", e.target.value)}
              onBlur={autoSlug}
              placeholder="e.g. Electronics"
              autoFocus
            />
          </div>

          <div>
            <label
              htmlFor="cat-slug"
              className="font-semibold text-900 block mb-2"
            >
              Slug
            </label>
            <InputText
              id="cat-slug"
              value={category.slug}
              onChange={(e) => onInputChange("slug", e.target.value)}
              placeholder="e.g. electronics (auto-generated from name)"
            />
          </div>

          <div>
            <label
              htmlFor="cat-desc"
              className="font-semibold text-900 block mb-2"
            >
              Description
            </label>
            <InputTextarea
              id="cat-desc"
              value={category.description}
              onChange={(e) => onInputChange("description", e.target.value)}
              rows={3}
              placeholder="Brief description of the category"
            />
          </div>

          <div>
            <label htmlFor="cat-img" className="font-semibold text-900 block mb-2">
              Category Image
            </label>

            {/* Live preview */}
            {category.imageUrl && (
              <div className="mb-3 text-center">
                <img
                  src={category.imageUrl}
                  alt="Preview"
                  className="border-round shadow-2"
                  style={{ maxHeight: '150px', maxWidth: '100%', objectFit: 'cover' }}
                />
              </div>
            )}

            {/* Hidden file input */}
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
              label={uploadingImage ? 'Uploading...' : category.imageUrl ? 'Change Image' : 'Upload Image'}
              icon={uploadingImage ? 'pi pi-spin pi-spinner' : 'pi pi-upload'}
              className="p-button-outlined w-full"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingImage}
            />

            {/* URL reference */}
            {category.imageUrl && (
              <small className="text-500 block mt-2" style={{ wordBreak: 'break-all' }}>{category.imageUrl}</small>
            )}
          </div>

          <div className="flex align-items-center gap-3">
            <label htmlFor="cat-active" className="font-semibold text-900">
              Active
            </label>
            <InputSwitch
              id="cat-active"
              checked={category.isActive}
              onChange={(e) => onInputChange("isActive", e.value)}
            />
          </div>
        </div>
      </Dialog>
    </div>
  );
};

export default AdminCategories;
