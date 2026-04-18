'use client';

import { useState, useEffect } from 'react';
import Script from 'next/script';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Search, Plus, Pencil, ChevronDown, ChevronLeft, ChevronRight, Loader2, Package, RefreshCw, Trash2, Filter } from 'lucide-react';
import AddProductForm from './components/AddProductForm';
import RestockForm from './components/RestockForm';
import { toast } from 'sonner';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from '@/components/ui/skeleton';
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogFooter, AlertDialogTitle, AlertDialogDescription, AlertDialogAction, AlertDialogCancel } from '@/components/ui/alert-dialog';

const getStatusBadgeVariant = (product) => {
  if (product.Quantity <= 0) return 'destructive';
  if (product.Quantity <= product.ReorderPoint) return 'warning';
  return 'success';
};

const getStatusText = (product) => {
  if (product.Quantity <= 0) return 'Out of Stock';
  if (product.Quantity <= (product.ReorderPoint || 5)) return 'Low Stock';
  return 'Available';
};

export default function ProductManagement() {
  const [products, setProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: 'ProductName', direction: 'asc' });
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isRestockDialogOpen, setIsRestockDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [availabilityFilter, setAvailabilityFilter] = useState('all');

  const fetchProducts = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/products/all');
      if (!response.ok) throw new Error('Failed to fetch products');
      const data = await response.json();
      setProducts(data.data || []);
    } catch (error) {
      console.error('Error fetching products:', error);
      toast.error('Failed to load products');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleSort = (key) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc',
    }));
  };

  const filteredAndSortedProducts = products
    .filter((product) => {
      const matchesSearch = product.ProductName.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesAvailability = availabilityFilter === 'all' || 
        (availabilityFilter === 'available' && product.Quantity > 0) ||
        (availabilityFilter === 'sold_out' && product.Quantity === 0);
      return matchesSearch && matchesAvailability;
    })
    .sort((a, b) => {
      const aValue = a[sortConfig.key];
      const bValue = b[sortConfig.key];
      if (sortConfig.direction === 'asc') {
        return typeof aValue === 'string' ? aValue.localeCompare(bValue) : aValue - bValue;
      } else {
        return typeof bValue === 'string' ? bValue.localeCompare(aValue) : bValue - aValue;
      }
    });

  const totalPages = Math.ceil(filteredAndSortedProducts.length / itemsPerPage);
  const paginatedProducts = filteredAndSortedProducts.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleDeleteProduct = async () => {
    if (!selectedProduct) return;
    try {
      const response = await fetch(`/api/products/${selectedProduct.ProductID}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete product');
      toast.success('Product deleted successfully');
      fetchProducts();
    } catch (error) {
      toast.error('Failed to delete product');
    } finally {
      setIsDeleteDialogOpen(false);
      setSelectedProduct(null);
    }
  };

  const paginationButtons = [];
  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || (i >= currentPage - 1 && i <= currentPage + 1)) {
      paginationButtons.push(
        <Button
          key={`page-${i}`}
          variant={currentPage === i ? 'default' : 'outline'}
          size="sm"
          onClick={() => setCurrentPage(i)}
          className="h-8 w-8"
        >
          {i}
        </Button>
      );
    } else if (i === currentPage - 2 || i === currentPage + 2) {
      paginationButtons.push(<span key={`ellipsis-${i}`} className="px-2">...</span>);
    }
  }

  return (
    <div className="p-6 space-y-6">
      {/* Cloudinary Widget Script */}
      <Script src="https://upload-widget.cloudinary.com/global/all.js" strategy="lazyOnload" />

      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Inventory Management</h1>
          <p className="text-muted-foreground">Monitor and manage your Vape Shop stock</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={fetchProducts}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Updating...
              </>
            ) : (
              <>
                <RefreshCw className="mr-2 h-4 w-4" />
                Refresh Data
              </>
            )}
          </Button>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => setIsAddDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Add Product
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>Add New Product</DialogTitle>
                <DialogDescription>Fill in the product details below to add a new product to your inventory.</DialogDescription>
              </DialogHeader>
              <AddProductForm onClose={() => { setIsAddDialogOpen(false); fetchProducts(); }} />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Filters Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Search Product</label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name..."
                  value={searchTerm}
                  onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                  className="pl-8"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Stock Status</label>
              <Select
                value={availabilityFilter}
                onValueChange={(value) => { setAvailabilityFilter(value); setCurrentPage(1); }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="available">In Stock</SelectItem>
                  <SelectItem value="sold_out">Out of Stock</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Items per page</label>
              <Select
                value={itemsPerPage.toString()}
                onValueChange={(value) => { setItemsPerPage(Number(value)); setCurrentPage(1); }}
              >
                <SelectTrigger>
                  <SelectValue placeholder={itemsPerPage} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10 records</SelectItem>
                  <SelectItem value="20">20 records</SelectItem>
                  <SelectItem value="50">50 records</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results Table Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Inventory Records</CardTitle>
            <p className="text-sm text-muted-foreground">
              Showing {Math.min(filteredAndSortedProducts.length, itemsPerPage)} of {filteredAndSortedProducts.length} records
            </p>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead className="w-[80px]">Img</TableHead>
                  <TableHead className="w-1/4 cursor-pointer" onClick={() => handleSort('ProductName')}>
                    <div className="flex items-center gap-2">
                      Product Name
                      {sortConfig.key === 'ProductName' && <ChevronDown className={`h-4 w-4 ${sortConfig.direction === 'desc' ? 'rotate-180' : ''}`} />}
                    </div>
                  </TableHead>
                  <TableHead className="w-1/4 cursor-pointer" onClick={() => handleSort('Quantity')}>
                    <div className="flex items-center gap-2">
                      Qty in Stock
                      {sortConfig.key === 'Quantity' && <ChevronDown className={`h-4 w-4 ${sortConfig.direction === 'desc' ? 'rotate-180' : ''}`} />}
                    </div>
                  </TableHead>
                  <TableHead className="w-1/4 cursor-pointer" onClick={() => handleSort('SellingPrice')}>
                    <div className="flex items-center gap-2">
                      Selling Price
                      {sortConfig.key === 'SellingPrice' && <ChevronDown className={`h-4 w-4 ${sortConfig.direction === 'desc' ? 'rotate-180' : ''}`} />}
                    </div>
                  </TableHead>
                  <TableHead className="w-1/4">Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={`loading-${i}`}>
                      <TableCell><Skeleton className="h-4 w-3/4" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-1/2" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-1/2" /></TableCell>
                      <TableCell><Skeleton className="h-6 w-24 rounded-full" /></TableCell>
                      <TableCell><Skeleton className="h-8 w-20 float-right" /></TableCell>
                    </TableRow>
                  ))
                ) : paginatedProducts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-12">
                      <div className="flex flex-col items-center gap-2">
                        <Package className="h-8 w-8 text-muted-foreground" />
                        <p className="text-muted-foreground">No products found</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedProducts.map((product) => (
                    <TableRow key={product.ProductID} className="hover:bg-muted/50">
                      <TableCell>
                        <div className="h-10 w-10 rounded-md bg-muted flex items-center justify-center overflow-hidden border">
                          {product.PictureURL ? (
                            <img 
                              src={product.PictureURL} 
                              alt={product.ProductName} 
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <Package className="h-5 w-5 text-muted-foreground/30" />
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">{product.ProductName}</TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span>{product.Quantity} units</span>
                          <span className="text-[10px] text-muted-foreground">Reorder at: {product.ReorderPoint}</span>
                        </div>
                      </TableCell>
                      <TableCell className="font-semibold text-green-600">
                        ₱{parseFloat(product.SellingPrice).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={getStatusBadgeVariant(product)}
                          className="font-medium"
                        >
                          {getStatusText(product)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                            onClick={() => { setSelectedProduct(product); setIsRestockDialogOpen(true); }}
                            title="Restock"
                          >
                            <RefreshCw className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => { setSelectedProduct(product); setIsEditDialogOpen(true); }}
                            title="Edit"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                            onClick={() => { setSelectedProduct(product); setIsDeleteDialogOpen(true); }}
                            title="Delete"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
          
          {/* Pagination */}
          {filteredAndSortedProducts.length > 0 && totalPages > 1 && (
            <div className="flex items-center justify-center mt-6">
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <div className="flex items-center space-x-1">
                  {paginationButtons}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Forms & Dialogs */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Edit Product</DialogTitle>
            <DialogDescription>Update the product details below.</DialogDescription>
          </DialogHeader>
          {selectedProduct && <AddProductForm editMode initialData={selectedProduct} onClose={() => { setIsEditDialogOpen(false); fetchProducts(); }} />}
        </DialogContent>
      </Dialog>

      <Dialog open={isRestockDialogOpen} onOpenChange={setIsRestockDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Restock Product</DialogTitle>
            <DialogDescription>Enter the quantity to add to the current stock.</DialogDescription>
          </DialogHeader>
          {selectedProduct && <RestockForm product={selectedProduct} onClose={() => { setIsRestockDialogOpen(false); fetchProducts(); }} onRestockSuccess={fetchProducts} />}
        </DialogContent>
      </Dialog>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Permanent Deletion</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <span className="font-bold text-foreground">"{selectedProduct?.ProductName}"</span>? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteProduct} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground">Delete Permanently</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
