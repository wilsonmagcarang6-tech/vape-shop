'use client';

import { useState } from 'react';
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
import { Loader2, Package } from 'lucide-react';

export default function RestockForm({ product, onClose, onRestockSuccess }) {
  const [isLoading, setIsLoading] = useState(false);
  const [restockQuantity, setRestockQuantity] = useState('');

  const handleRestock = async (e) => {
    e.preventDefault();
    
    if (!restockQuantity || isNaN(restockQuantity) || Number(restockQuantity) <= 0) {
      toast.error('Please enter a valid restock quantity');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(`/api/products/${product.ProductID}/restock`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          quantity: parseInt(restockQuantity),
        }),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.error || 'Failed to restock product');
      }

      const result = await response.json();
      toast.success(result.message || `Successfully restocked ${restockQuantity} units of ${product.ProductName}`);
      
      if (onRestockSuccess) {
        onRestockSuccess();
      }
      
      onClose();
    } catch (error) {
      console.error('Error restocking product:', error);
      toast.error(error.message || 'Failed to restock product');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto border-none shadow-none">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="h-5 w-5" />
          Restock Product
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="bg-muted p-4 rounded-lg space-y-2 border border-border">
          <h3 className="font-semibold text-sm">Product Details</h3>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <span className="text-muted-foreground">Name:</span>
            <span className="font-medium">{product.ProductName}</span>
            <span className="text-muted-foreground">Current Stock:</span>
            <span className="font-medium">{product.Quantity} units</span>
            <span className="text-muted-foreground">Selling Price:</span>
            <span className="font-medium">₱{parseFloat(product.SellingPrice).toLocaleString()}</span>
          </div>
        </div>

        <form onSubmit={handleRestock} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="restockQuantity">Restock Quantity</Label>
            <Input
              id="restockQuantity"
              type="number"
              value={restockQuantity}
              onChange={(e) => setRestockQuantity(e.target.value)}
              placeholder="Enter quantity to add"
              min="1"
              required
              disabled={isLoading}
              className="h-11"
            />
            <p className="text-xs text-muted-foreground">
              This will be added to the current stock.
            </p>
          </div>

          <div className="flex gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isLoading}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
               className="flex-1"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Restocking...
                </>
              ) : (
                'Restock Product'
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
