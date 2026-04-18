"use client"
import React, { useEffect, useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { PlusCircle, MinusCircle, XCircle, ShoppingCart, Check, ChevronsUpDown } from 'lucide-react';
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
import { cn } from "@/lib/utils";

const ProductsPage = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [cart, setCart] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [customerName, setCustomerName] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("Cash");
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [amountPaid, setAmountPaid] = useState("");
  const [discountPercent, setDiscountPercent] = useState(0);
  const [discountType, setDiscountType] = useState('none');

  // Add this ref for debouncing toast messages
  const toastTimeoutRef = useRef({});


  const fetchProducts = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/products/fifo');
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
  };


  useEffect(() => {
    fetchProducts();
  }, []);

  const filteredProducts = products.filter(product =>
    product.ProductName.toLowerCase().includes(search.toLowerCase()) &&
    product.Status !== 'Unavailable'
  );

  // Name helpers for guest (Walk_In)
  const namePattern = /^[\p{L}]+(?:[ '\-][\p{L}]+)*$/u; // letters with optional single separators
  const sanitizeName = (val) => val.replace(/[^a-zA-Z\s'\-]/g, '');

  // Helper function to calculate available quantity using FIFO logic
  const calculateAvailableQuantity = (product, currentCartQuantity = 0) => {
    let availableQuantity = 0;
    for (const batch of product.Batches) {
      if (batch.Quantity > 0) {
        availableQuantity += batch.Quantity;
      }
    }
    return availableQuantity - currentCartQuantity;
  };

  // Helper function to get the current selling batch using FIFO logic
  const getCurrentSellingBatch = (product, currentCartQuantity = 0) => {
    let remainingToSell = currentCartQuantity + 1; // +1 for the item we're trying to add

    for (const batch of product.Batches) {
      if (batch.Quantity > 0) {
        if (remainingToSell <= batch.Quantity) {
          return batch;
        }
        remainingToSell -= batch.Quantity;
      }
    }

    // If we can't fulfill from any batch, return the first available batch
    return product.Batches.find(batch => batch.Quantity > 0) || null;
  };

  // Helper: Add quantity to cart using FIFO batches with price grouping
  const addProductToCartFIFO = (product, quantityToAdd = 1) => {
    setCart(prevCart => {
      let qtyLeft = quantityToAdd;
      let newCart = [...prevCart];
      // Get batches in FIFO order
      const batches = product.Batches.filter(b => b.Quantity > 0).sort((a, b) => a.BatchNumber - b.BatchNumber);

      for (const batch of batches) {
        if (qtyLeft <= 0) break;

        // Find existing cart item with same product name and selling price
        const existingItemIdx = newCart.findIndex(
          item => item.ProductName === product.ProductName &&
            Number(item.SellingPrice) === Number(batch.SellingPrice)
        );

        const alreadyInCart = existingItemIdx >= 0 ? newCart[existingItemIdx].quantity : 0;
        const available = batch.Quantity;
        if (available <= 0) continue;

        const addQty = Math.min(qtyLeft, available);
        if (addQty > 0) {
          if (existingItemIdx >= 0) {
            // Add to existing item with same price
            newCart[existingItemIdx] = {
              ...newCart[existingItemIdx],
              quantity: newCart[existingItemIdx].quantity + addQty,
              batches: [...(newCart[existingItemIdx].batches || []), { batchNumber: batch.BatchNumber, quantity: addQty }]
            };
          } else {
            // Create new item grouped by price
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

  // Replace handleAddToCart with FIFO logic
  const handleAddToCart = (product) => {
    addProductToCartFIFO(product, 1);
  };

  const handleReduceQuantity = (item) => {
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

  const handleRemoveFromCart = (item) => {
    setCart(prev => prev.filter(cartItem =>
      !(cartItem.ProductName === item.ProductName &&
        Number(cartItem.SellingPrice) === Number(item.SellingPrice))
    ));
    toast.info(`${item.ProductName} removed from list.`);
  };

  const subtotal = cart.reduce((sum, item) => sum + (item.quantity * item.SellingPrice), 0);
  const discountAmount = (subtotal * discountPercent) / 100;
  const discountedTotal = subtotal - discountAmount;

  const handlePayment = async () => {
    if (cart.length === 0) return;

    const numericAmountPaid = parseFloat((amountPaid || '').toString().trim());
    const roundedPaid = Math.round(numericAmountPaid * 100) / 100;
    const roundedTotal = Math.round(discountedTotal * 100) / 100;
    if (
      isNaN(roundedPaid) ||
      roundedPaid < roundedTotal
    ) {
      toast.error("Amount paid must be a number and at least equal to the total after discount.");
      return;
    }


    setIsConfirmOpen(false);
    setIsProcessing(true);
    try {
      const payload = {
        cart,
        paymentMethod,
        amountPaid: numericAmountPaid,
        Discount: discountAmount,
      };
      const nameParts = (customerName || '').trim().split(' ');
      payload.FirstName = nameParts[0] || '-';
      payload.LastName = nameParts.slice(1).join(' ') || '-';
      payload.ClientID = null;

      const res = await fetch('/api/sales/products/fifo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const result = await res.json();

      if (res.ok) {
        const change = Math.round((numericAmountPaid - discountedTotal) * 100) / 100;
        toast.success(`Purchase Success!`);
        setCart([]);
        setCustomerName("");
        setAmountPaid("");
        setDiscountPercent(0);
        setDiscountType('none');
        fetchProducts(); // Refetch products to update stock
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


  // Clean up timeouts on unmount
  useEffect(() => {
    return () => {
      Object.values(toastTimeoutRef.current).forEach(timeout => {
        clearTimeout(timeout);
      });
    };
  }, []);

  return (
    <div className="flex flex-row h-[85vh] bg-background ">
      {/* Products (Left Side) */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header (Not scrollable) */}
        <div className="mt-4 ml-5">
          <Input
            type="text"
            placeholder="Search products..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full sm:w-96"
          />
        </div>

        {/* Grid (Scrollable) */}
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
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredProducts.length === 0 ? (
                <div className="col-span-full text-center text-muted-foreground pt-10">No products found.</div>
              ) : (
                filteredProducts.map(product => (
                  <Card key={product.ProductID} className="p-0 flex flex-col shadow-md hover:shadow-xl transition-all duration-200 ease-in-out hover:scale-[1.02] rounded-xl bg-card">
                    <div className="h-50 w-full flex-shrink-0 bg-muted rounded-t-xl overflow-hidden">
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
                      {/* {(() => {
                        const currentCartQuantity = cart.find(item => item.ProductID === product.ProductID)?.quantity || 0;
                        const currentBatch = getCurrentSellingBatch(product, currentCartQuantity);
                        return currentBatch && (
                          <div className="text-xs text-blue-600 mb-1 font-medium">
                            Selling from Batch #{currentBatch.BatchNumber} ({currentBatch.Quantity} units)
                          </div>
                        );
                      })()} */}
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
          )}
        </div>
      </div>

      {/* Cart (Right Side) */}
      <div className="w-100  flex-shrink-0 bg-card border-l flex flex-col shadow-lg">
        <div className="px-4 py-2 border-b bg-card">
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
                      <div className="text-[10px] text-blue-600">
                        {/* {item.batches && item.batches.length > 1 ? (
                          `Batches: ${item.batches.map(b => `#${b.batchNumber}`).join(', ')}`
                        ) : (
                          `Batch #${item.batches?.[0]?.batchNumber || 'N/A'}`
                        )} */}
                      </div>
                      <div className="text-[10px] text-muted-foreground">₱{(Number(item.SellingPrice) || 0).toLocaleString()}</div>
                      <div className="flex items-center gap-1 mt-1">
                        <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => handleReduceQuantity(item)} disabled={isProcessing}>
                          <MinusCircle className="h-3 w-3" />
                        </Button>
                        <span className="font-semibold text-xs">{item.quantity}</span>
                        <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => handleAddToCart(products.find(p => p.ProductName === item.ProductName))} disabled={isProcessing}>
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

        {/* Footer (Not scrollable) */}
        {cart.length > 0 && (
          <div className="flex-shrink-0 px-4 py-3 border-t bg-card mt-auto space-y-3">
            <div className="flex justify-between items-center mb-2 text-xs font-medium">
              <span>Subtotal</span>
              <span className="font-bold">₱{subtotal.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
            </div>
            {/* <div className="flex justify-between items-center mb-2 text-xs font-medium">
              <span>Discount Type</span>
              <Select
                value={discountType}
                onValueChange={value => {
                  setDiscountType(value);
                  if (value === 'senior') setDiscountPercent(20);
                  else if (value === 'pwd') setDiscountPercent(20);
                  else setDiscountPercent(0);
                }}
                className="w-32 text-xs"
              >
                <SelectTrigger className="w-32 h-7 text-xs px-2">
                  <SelectValue placeholder="Select discount" />
                </SelectTrigger>
                <SelectContent className="text-xs">
                  <SelectItem value="none">None</SelectItem>
                  <SelectItem value="senior">Senior Citizen</SelectItem>
                  <SelectItem value="pwd">PWD</SelectItem>
                </SelectContent>
              </Select>
            </div> */}
            {/* <div className="flex justify-between items-center mb-2 text-xs font-medium">
              <span>Discount</span>
              <span className="font-bold text-green-600">-₱{discountAmount.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
            </div> */}
            <div className="flex justify-between items-center mb-2 text-xs font-medium">
              <span>Total</span>
              <span className="font-bold">₱{discountedTotal.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
            </div>
            <div className="space-y-4">
              <div className="flex items-center mb-1 gap-2">
                <span className="text-xs font-medium whitespace-nowrap">Cash</span>
                <Input
                  type="number"
                  placeholder="Amount Paid"
                  value={amountPaid}
                  onChange={(e) => setAmountPaid(e.target.value)}
                  min={isNaN(discountedTotal) ? 0 : discountedTotal}
                  className="h-7 px-2 text-xs flex-1 ml-15"
                  disabled={isProcessing}
                />
              </div>
              <div className="flex justify-between items-center text-xs font-medium">
                <span>Change</span>
                <span className="font-bold">₱{(parseFloat(amountPaid) >= discountedTotal ? (parseFloat(amountPaid) - discountedTotal).toLocaleString() : '0')}</span>
              </div>
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
                      {/* <span className="font-medium">Discount (%):</span>
                      <span>{discountPercent}%</span> */}
                      {/* Only show discount row if discountAmount > 0 */}
                      {discountAmount > 0 && (
                        <>
                          {/* <span className="font-medium">Discount:</span>
                          <span>-₱{discountAmount.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span> */}
                        </>
                      )}
                      {/* <span className="font-medium">Total After Discount:</span>
                      <span>₱{discountedTotal.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span> */}
                      <span className="font-medium">Cash:</span>
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
                    <Button onClick={handlePayment} disabled={isProcessing}>
                      {isProcessing ? 'Confirming...' : 'Confirm'}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        )}
      </div>
      {/* Removed receipt overlay */}
    </div>
  );
};

export default ProductsPage;
