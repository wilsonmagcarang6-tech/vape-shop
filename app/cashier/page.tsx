"use client"

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { Card, CardContent, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { PlusCircle, MinusCircle, XCircle, ShoppingCart, ChevronLeft, ChevronRight } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface Batch {
  BatchNumber: number;
  Quantity: number;
  SellingPrice: number;
  BasePrice: number;
  ProductID: number;
}

interface Product {
  ProductID: number;
  ProductName: string;
  PictureURL: string | null;
  TotalQuantity: number;
  SellingPrice: number;
  Batches: Batch[];
}

interface CartItem {
  ProductID: number;
  ProductName: string;
  quantity: number;
  SellingPrice: number;
  BasePrice: number;
  PictureURL: string | null;
  batches: { batchNumber: number; quantity: number }[];
}

export default function CashierPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(0);
  const productsPerPage = 12;
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [customerName, setCustomerName] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("Cash");
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [amountPaid, setAmountPaid] = useState("");
  const [isGcashConfirmed, setIsGcashConfirmed] = useState(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const fetchProducts = useCallback(async (page = 1, searchQuery = '') => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: productsPerPage.toString(),
      });
      if (searchQuery) params.append('search', searchQuery);
      const res = await fetch(`/api/products/fifo?${params}`);
      const data = await res.json();
      if (res.ok && data.data) {
        setProducts(data.data);
      } else {
        setError(data.message || 'Failed to fetch products');
      }
    } catch (err) {
      setError('Failed to fetch products');
    } finally {
      setLoading(false);
    }
  }, [productsPerPage]);

  useEffect(() => {
    fetchProducts(1, '');
  }, []);

  useEffect(() => {
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    searchTimeoutRef.current = setTimeout(() => {
      setCurrentPage(0);
      fetchProducts(1, search);
    }, 300);
    return () => {
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    };
  }, [search, fetchProducts]);

  const filteredProducts = products;

  const paginatedProducts = filteredProducts.slice(
    currentPage * productsPerPage,
    (currentPage + 1) * productsPerPage
  );

  const totalPages = Math.ceil(filteredProducts.length / productsPerPage);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 0 && newPage < totalPages) {
      setCurrentPage(newPage);
      fetchProducts(newPage + 1, search);
    }
  };

  const calculateAvailableQuantity = (product: Product, currentCartQuantity = 0): number => {
    let availableQuantity = 0;
    for (const batch of product.Batches) {
      if (batch.Quantity > 0) {
        availableQuantity += batch.Quantity;
      }
    }
    return availableQuantity - currentCartQuantity;
  };

  const addProductToCartFIFO = (product: Product, quantityToAdd = 1) => {
    setCart(prevCart => {
      let qtyLeft = quantityToAdd;
      const newCart = [...prevCart];
      const batches = product.Batches.filter(b => b.Quantity > 0).sort((a, b) => a.BatchNumber - b.BatchNumber);

      for (const batch of batches) {
        if (qtyLeft <= 0) break;

        const existingItemIdx = newCart.findIndex(
          item => item.ProductName === product.ProductName &&
            Number(item.SellingPrice) === Number(batch.SellingPrice)
        );

        const available = batch.Quantity;
        if (available <= 0) continue;

        const addQty = Math.min(qtyLeft, available);
        if (addQty > 0) {
          if (existingItemIdx >= 0) {
            const existingBatches = newCart[existingItemIdx].batches || [];
            const existingBatchIdx = existingBatches.findIndex(b => b.batchNumber === batch.BatchNumber);
            let mergedBatches;
            if (existingBatchIdx >= 0) {
              mergedBatches = existingBatches.map((b: any, idx: number) =>
                idx === existingBatchIdx ? { ...b, quantity: b.quantity + addQty } : b
              );
            } else {
              mergedBatches = [...existingBatches, { batchNumber: batch.BatchNumber, quantity: addQty }];
            }
            newCart[existingItemIdx] = {
              ...newCart[existingItemIdx],
              quantity: newCart[existingItemIdx].quantity + addQty,
              batches: mergedBatches
            };
          } else {
            newCart.push({
              ProductID: batch.ProductID,
              ProductName: product.ProductName,
              quantity: addQty,
              SellingPrice: Number(batch.SellingPrice) || 0,
              BasePrice: Number(batch.BasePrice) || 0,
              PictureURL: product.PictureURL,
              batches: [{ batchNumber: batch.BatchNumber, quantity: addQty }]
            });
          }
          qtyLeft -= addQty;
        }
      }
      if (qtyLeft > 0) {
        toast.error(`Not enough stock for ${product.ProductName}.`);
      }
      return newCart;
    });
  };

  const handleAddToCart = (product: Product) => {
    addProductToCartFIFO(product, 1);
  };

  const handleReduceQuantity = (item: CartItem) => {
    setCart(prev => {
      const existingItem = prev.find(cartItem =>
        cartItem.ProductName === item.ProductName &&
        Number(cartItem.SellingPrice) === Number(item.SellingPrice)
      );
      if (existingItem && existingItem.quantity === 1) {
        return prev.filter(cartItem =>
          !(cartItem.ProductName === item.ProductName &&
            Number(cartItem.SellingPrice) === Number(item.SellingPrice))
        );
      }
      return prev.map(cartItem =>
        (cartItem.ProductName === item.ProductName &&
          Number(cartItem.SellingPrice) === Number(item.SellingPrice))
          ? { ...cartItem, quantity: cartItem.quantity - 1 }
          : cartItem
      );
    });
  };

  const handleRemoveFromCart = (item: CartItem) => {
    setCart(prev => prev.filter(cartItem =>
      !(cartItem.ProductName === item.ProductName &&
        Number(cartItem.SellingPrice) === Number(item.SellingPrice))
    ));
    toast.info(`${item.ProductName} removed from list.`);
  };

  const getProductByName = (name: string): Product | undefined => {
    return products.find(p => p.ProductName === name);
  };

  const subtotal = cart.reduce((sum, item) => sum + (item.quantity * item.SellingPrice), 0);
  const discountedTotal = subtotal;

  const handlePayment = async () => {
    if (cart.length === 0) return;

    const numericAmountPaid = parseFloat((amountPaid || '').toString().trim());
    const roundedPaid = Math.round(numericAmountPaid * 100) / 100;
    const roundedTotal = Math.round(discountedTotal * 100) / 100;
    if (isNaN(roundedPaid) || roundedPaid < roundedTotal) {
      toast.error("Amount paid must be at least equal to the total.");
      return;
    }

    setIsConfirmOpen(false);
    setIsProcessing(true);
    try {
      const nameParts = (customerName || '').trim().split(' ');
      const payload = {
        cart,
        paymentMethod,
        amountPaid: numericAmountPaid,
        Discount: 0,
        FirstName: nameParts[0] || '-',
        LastName: nameParts.slice(1).join(' ') || '-',
        ClientID: null,
      };

      const res = await fetch('/api/sales/products/fifo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const result = await res.json();

      if (res.ok) {
        toast.success('Purchase Success!');
        setCart([]);
        setCustomerName("");
        setAmountPaid("");
        setIsGcashConfirmed(false);
        fetchProducts(1, '');
      } else {
        toast.error(result.message || 'Failed to process payment.');
      }
    } catch (error) {
      toast.error('An unexpected error occurred.');
      console.error(error);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="flex flex-row h-[calc(100vh-3.5rem)] bg-background">
      {/* Products (Left Side) */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="mt-4 ml-5">
          <Input
            type="text"
            placeholder="Search products..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full sm:w-96"
          />
        </div>

        <div className="flex-1 overflow-y-auto p-6 mr-1">
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className="h-80 w-full rounded-xl" />
              ))}
            </div>
          ) : error ? (
            <div className="text-destructive text-center">{error}</div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {paginatedProducts.length === 0 ? (
                  <div className="col-span-full text-center text-muted-foreground pt-10">No products found.</div>
                ) : (
                  paginatedProducts.map((product: Product) => (
                    <Card key={product.ProductID} className="p-0 flex flex-col shadow-md hover:shadow-xl transition-all duration-200 ease-in-out hover:scale-[1.02] rounded-xl bg-card">
                      <div className="h-[200px] w-full flex-shrink-0 bg-muted rounded-t-xl overflow-hidden">
                        {product.PictureURL ? (
                          <img src={product.PictureURL} alt={product.ProductName} className="h-full w-full object-cover" />
                        ) : (
                          <div className="h-full w-full flex items-center justify-center text-muted-foreground">No Image</div>
                        )}
                      </div>
                      <div className="p-3 flex flex-col flex-1">
                        <CardTitle className="text-base font-semibold truncate mb-1">{product.ProductName}</CardTitle>
                        <div className="text-muted-foreground text-sm mb-1">
                          Total Stock: {product.TotalQuantity}
                        </div>
                        <div className="text-primary font-bold text-xl">₱{Number(product.SellingPrice).toLocaleString()}</div>
                        <div className="mt-auto pt-2">
                          <Button
                            className="w-full"
                            onClick={() => handleAddToCart(product)}
                            disabled={isProcessing || calculateAvailableQuantity(product, cart.find(item => item.ProductID === product.ProductID)?.quantity || 0) <= 0}
                          >
                            {calculateAvailableQuantity(product, cart.find(item => item.ProductID === product.ProductID)?.quantity || 0) > 0 ? 'Add' : 'Out of Stock'}
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))
                )}
              </div>
              {totalPages > 1 && (
                <div className="flex justify-center gap-2 mt-6 p-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 0}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Previous
                  </Button>
                  <span className="flex items-center px-3 py-1 text-sm text-muted-foreground bg-muted rounded-md">
                    Page {currentPage + 1} of {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages - 1}
                  >
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Cart (Right Side) */}
      <div className="w-[400px] flex-shrink-0 bg-card border-l flex flex-col shadow-lg">
        <div className="px-4 py-3 border-b bg-card">
          <h2 className="text-xl font-semibold tracking-tight">Cart</h2>
        </div>

        <div className="px-4 py-3 border-b space-y-2 bg-muted/40">
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Customer</label>
          <Input
            type="text"
            placeholder="Customer Name"
            value={customerName}
            onChange={e => setCustomerName(e.target.value)}
            className="h-9 px-3 text-sm"
          />
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-3">
          {cart.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
              <ShoppingCart size={48} className="text-muted-foreground/50" />
              <p className="mt-4">No products added yet</p>
            </div>
          ) : (
            <ul className="divide-y">
              {cart.map(item => (
                <li key={`${item.ProductName}-${item.SellingPrice}`} className="flex items-center justify-between py-2">
                  <div className="flex items-center gap-2 flex-1">
                    <div className="h-10 w-10 flex-shrink-0 bg-muted rounded-md">
                      {item.PictureURL ? (
                        <img src={item.PictureURL} alt={item.ProductName} className="h-full w-full object-cover rounded-md" />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center text-muted-foreground text-xs">No Image</div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-xs truncate">{item.ProductName}</div>
                      <div className="text-[10px] text-muted-foreground">₱{(Number(item.SellingPrice) || 0).toLocaleString()}</div>
                      <div className="flex items-center gap-1 mt-1">
                        <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => handleReduceQuantity(item)} disabled={isProcessing}>
                          <MinusCircle className="h-3 w-3" />
                        </Button>
                        <span className="font-semibold text-xs">{item.quantity}</span>
                        <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => {
                          const p = getProductByName(item.ProductName);
                          if (p) handleAddToCart(p);
                        }} disabled={isProcessing}>
                          <PlusCircle className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col items-end ml-1">
                    <div className="font-semibold text-primary text-xs mb-1">₱{((Number(item.SellingPrice) || 0) * item.quantity).toLocaleString()}</div>
                    <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground/50 hover:text-red-500" onClick={() => handleRemoveFromCart(item)} disabled={isProcessing}>
                      <XCircle className="h-4 w-4" />
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {cart.length > 0 && (
          <div className="flex-shrink-0 px-4 py-3 border-t bg-card mt-auto space-y-3">
            <div className="flex justify-between items-center mb-2 text-xs font-medium">
              <span>Subtotal</span>
              <span className="font-bold">₱{subtotal.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
            </div>
            <div className="flex justify-between items-center mb-2 text-xs font-medium">
              <span>Total</span>
              <span className="font-bold">₱{discountedTotal.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
            </div>
            <div className="space-y-4">
              <div className="flex items-center mb-1 gap-2">
                <span className="text-xs font-medium whitespace-nowrap">Payment</span>
                <Select value={paymentMethod} onValueChange={(value) => {
                  setPaymentMethod(value);
                  if (value !== 'GCash') setIsGcashConfirmed(false);
                }}>
                  <SelectTrigger className="h-7 px-2 text-xs flex-1 ml-6">
                    <SelectValue placeholder="Select payment method" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Cash">Cash</SelectItem>
                    <SelectItem value="GCash">GCash</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center mb-1 gap-2">
                <span className="text-xs font-medium whitespace-nowrap">
                  {paymentMethod === 'GCash' ? 'Amount Sent' : 'Amount Received'}
                </span>
                <Input
                  type="number"
                  placeholder={paymentMethod === 'GCash' ? 'GCash Amount' : 'Amount Paid'}
                  value={amountPaid}
                  onChange={(e) => setAmountPaid(e.target.value)}
                  min={isNaN(discountedTotal) ? 0 : discountedTotal}
                  className="h-7 px-2 text-xs flex-1"
                  disabled={isProcessing}
                />
              </div>
              <div className="flex justify-between items-center text-xs font-medium">
                <span>Change</span>
                <span className="font-bold">₱{(parseFloat(amountPaid) >= discountedTotal ? (parseFloat(amountPaid) - discountedTotal).toLocaleString() : '0')}</span>
              </div>
              {paymentMethod === 'GCash' && (
                <label className="flex items-start gap-2 text-xs">
                  <input
                    type="checkbox"
                    checked={isGcashConfirmed}
                    onChange={(e) => setIsGcashConfirmed(e.target.checked)}
                    className="mt-0.5"
                    disabled={isProcessing}
                  />
                  <span>I confirm that the GCash payment has been received before completing this sale.</span>
                </label>
              )}
              <Dialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
                <DialogTrigger asChild>
                  <Button className="w-full" disabled={isProcessing || !amountPaid || parseFloat(amountPaid) < discountedTotal}>
                    {isProcessing ? 'Processing...' : 'Proceed to Payment'}
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <div className="mb-2 text-base font-medium">
                      Customer: {customerName || <span className="italic text-muted-foreground">-</span>}
                    </div>
                    <DialogTitle>Confirm Sale</DialogTitle>
                    <div className="grid grid-cols-2 gap-2 my-4">
                      <span className="font-medium">Total:</span>
                      <span>₱{discountedTotal.toLocaleString()}</span>
                      <span className="font-medium">Payment Method:</span>
                      <span>{paymentMethod}</span>
                      <span className="font-medium">{paymentMethod === 'GCash' ? 'Amount Sent:' : 'Cash:'}</span>
                      <span>₱{Number(amountPaid).toLocaleString()}</span>
                      <span className="font-medium">Change:</span>
                      <span>₱{(Number(amountPaid) - discountedTotal).toLocaleString()}</span>
                    </div>
                    <DialogDescription>
                      Are you sure you want to complete this sale?
                    </DialogDescription>
                  </DialogHeader>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsConfirmOpen(false)}>Cancel</Button>
                    <Button onClick={handlePayment} disabled={isProcessing || (paymentMethod === 'GCash' && !isGcashConfirmed)}>
                      {isProcessing ? 'Confirming...' : 'Confirm'}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
