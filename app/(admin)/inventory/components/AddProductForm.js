'use client';

import { useState, useEffect } from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { toast } from 'sonner';
import { Loader2, Package, Image as ImageIcon } from 'lucide-react';
import Image from 'next/image';

export default function AddProductForm({ onClose, editMode = false, initialData = null }) {
  const [isLoading, setIsLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(editMode ? initialData?.PictureURL : null);
  
  const [formData, setFormData] = useState({
    ProductName: editMode ? initialData.ProductName : '',
    Quantity: editMode ? initialData.Quantity : '0',
    CostPrice: editMode ? initialData.CostPrice : '',
    SellingPrice: editMode ? initialData.SellingPrice : '',
    ReorderPoint: editMode ? (initialData.ReorderPoint || initialData.ReOrderPoint) : '5',
    PictureURL: editMode ? initialData.PictureURL : '',
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        toast.error('Please select a valid image file (JPEG, PNG, GIF, or WebP).');
        e.target.value = '';
        return;
      }
      
      // Validate file size (max 5MB)
      const maxSize = 5 * 1024 * 1024;
      if (file.size > maxSize) {
        toast.error('Image file size must be less than 5MB');
        e.target.value = '';
        return;
      }
      
      setSelectedImage(file);
      setPreviewUrl(URL.createObjectURL(file));
      setFormData(prev => ({ ...prev, PictureURL: '' })); // Clear existing URL if new file chosen
    }
  };

  const validateForm = () => {
    if (!formData.ProductName.trim()) {
      toast.error('Product name is required');
      return false;
    }
    if (formData.Quantity === '' || isNaN(formData.Quantity) || Number(formData.Quantity) < 0) {
      toast.error('Please enter a valid quantity');
      return false;
    }
    if (formData.CostPrice === '' || isNaN(formData.CostPrice) || Number(formData.CostPrice) < 0) {
      toast.error('Please enter a valid cost price');
      return false;
    }
    if (formData.SellingPrice === '' || isNaN(formData.SellingPrice) || Number(formData.SellingPrice) < 0) {
      toast.error('Please enter a valid selling price');
      return false;
    }
    if (formData.ReorderPoint === '' || isNaN(formData.ReorderPoint) || Number(formData.ReorderPoint) < 0) {
      toast.error('Please enter a valid reorder point');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    setIsLoading(true);

    try {
      let pictureURL = formData.PictureURL;

      // Upload image if a new one is selected
      if (selectedImage) {
        const uploadFormData = new FormData();
        uploadFormData.append('file', selectedImage);

        const uploadResponse = await fetch('/api/upload', {
          method: 'POST',
          body: uploadFormData,
        });

        if (!uploadResponse.ok) {
          throw new Error('Failed to upload image');
        }

        const { url } = await uploadResponse.json();
        pictureURL = url;
      }

      const endpoint = editMode ? `/api/products/${initialData.ProductID}` : '/api/products';
      const method = editMode ? 'PUT' : 'POST';

      const payload = {
        ProductName: formData.ProductName,
        Quantity: parseInt(formData.Quantity),
        CostPrice: parseFloat(formData.CostPrice),
        SellingPrice: parseFloat(formData.SellingPrice),
        ReorderPoint: parseInt(formData.ReorderPoint),
        PictureURL: pictureURL,
      };

      const response = await fetch(endpoint, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.error || 'Failed to save product');
      }

      toast.success(`Product ${editMode ? 'updated' : 'added'} successfully!`);
      onClose();
    } catch (error) {
      toast.error(error.message || 'Failed to save product');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Product Information</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-4 col-span-2">
            <Label>Product Image</Label>
            <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-lg space-y-4 bg-muted/30">
              {previewUrl ? (
                <div className="relative group w-40 h-40">
                  <Image 
                    src={previewUrl} 
                    alt="Product Preview" 
                    fill
                    className="object-cover rounded-md shadow-md"
                  />
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-md">
                    <Button 
                      type="button" 
                      variant="destructive" 
                      size="sm"
                      onClick={() => {
                        setSelectedImage(null);
                        setPreviewUrl(null);
                        setFormData(prev => ({ ...prev, PictureURL: '' }));
                      }}
                    >
                      Remove
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-center">
                  <div className="h-20 w-20 bg-muted rounded-full flex items-center justify-center mx-auto mb-2 text-muted-foreground">
                    <ImageIcon className="h-10 w-10 text-muted-foreground/50" />
                  </div>
                  <p className="text-sm text-muted-foreground">Select an image from your computer</p>
                </div>
              )}
              
              <Input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="max-w-[250px] cursor-pointer"
                disabled={isLoading}
              />
            </div>
            <div className="text-[10px] text-muted-foreground text-center">
              Accepted formats: JPEG, PNG, GIF, WebP (max 5MB)
            </div>
          </div>

          <div className="space-y-2 col-span-2">
            <Label>Product Name</Label>
            <Input
              name="ProductName"
              value={formData.ProductName}
              onChange={handleInputChange}
              placeholder="Enter product name"
              required
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <Label>Quantity</Label>
            <Input
              type="number"
              name="Quantity"
              value={formData.Quantity}
              onChange={handleInputChange}
              placeholder="Enter quantity"
              min="0"
              required
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <Label>Reorder Point</Label>
            <Input
              type="number"
              name="ReorderPoint"
              value={formData.ReorderPoint}
              onChange={handleInputChange}
              placeholder="Enter reorder point"
              min="0"
              required
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <Label>Cost Price</Label>
            <Input
              type="number"
              name="CostPrice"
              value={formData.CostPrice}
              onChange={handleInputChange}
              placeholder="Enter cost price"
              min="0"
              step="0.01"
              required
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <Label>Selling Price</Label>
            <Input
              type="number"
              name="SellingPrice"
              value={formData.SellingPrice}
              onChange={handleInputChange}
              placeholder="Enter selling price"
              min="0"
              step="0.01"
              required
              disabled={isLoading}
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end space-x-2">
        <Button
          type="button"
          variant="outline"
          onClick={onClose}
          disabled={isLoading}
        >
          Cancel
        </Button>
        <Button 
          type="submit" 
          disabled={isLoading}
          className="min-w-[140px]"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {editMode ? 'Updating...' : 'Saving...'}
            </>
          ) : (
            editMode ? 'Update Product' : 'Add Product'
          )}
        </Button>
      </div>
    </form>
  );
}