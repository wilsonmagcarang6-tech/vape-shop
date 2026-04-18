"use client";

import { useState, useEffect } from 'react';
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
import { Badge } from '@/components/ui/badge';
import {
  Search,
  Filter,
  Download,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Loader2,
  PhilippinePeso,
  Package,
  ShoppingCart,
  Award,
  FileText,
  Users,
  UserCheck,
  UserX,
  RefreshCcw,
  TrendingUp
} from 'lucide-react';
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
import { format } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';
import { useSmoothCounter } from '@/hooks/use-smooth-counter';

export default function ProductSalesReport() {
  const [salesData, setSalesData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);

  // Filter states
  const [searchTerm, setSearchTerm] = useState(''); // product or client name
  const [selectedDate, setSelectedDate] = useState('');
  const [dateRange, setDateRange] = useState({ startDate: '', endDate: '' });
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [pageSizeOptions] = useState([5, 10, 20, 50, 100]);

  // Fetch sales data
  const fetchSalesData = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/sales/products?report=true');
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }
      const data = await response.json();
      setSalesData(data);
      setFilteredData(data);
    } catch (error) {
      toast.error(`Failed to fetch sales data: ${error.message}`);
      setSalesData([]);
      setFilteredData([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSalesData();
  }, []);

  // Apply filters
  const applyFilters = () => {
    if (dateRange.startDate && dateRange.endDate) {
      const start = new Date(dateRange.startDate);
      const end = new Date(dateRange.endDate);
      if (start > end) {
        toast.error('The "From" date cannot be after the "To" date.');
        return;
      }
    }
    let filtered = salesData;
    // Filter by search term (product or client name)
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(item => {
        const productName = item.product?.ProductName?.toLowerCase() || '';
        const clientName = (item.billing?.client?.FirstName && item.billing?.client?.LastName)
          ? `${item.billing.client.FirstName} ${item.billing.client.LastName}`.toLowerCase()
          : ((item.billing?.FirstName || '') + ' ' + (item.billing?.LastName || '')).toLowerCase();
        return productName.includes(searchLower) || clientName.includes(searchLower);
      });
    }
    // Filter by single date
    if (selectedDate) {
      const selectedDateObj = new Date(selectedDate);
      const startOfDay = new Date(selectedDateObj.getFullYear(), selectedDateObj.getMonth(), selectedDateObj.getDate());
      const endOfDay = new Date(selectedDateObj.getFullYear(), selectedDateObj.getMonth(), selectedDateObj.getDate(), 23, 59, 59);
      filtered = filtered.filter(item => {
        const saleDate = new Date(item.TransactionDate);
        return saleDate >= startOfDay && saleDate <= endOfDay;
      });
    }
    // Filter by date range
    if (dateRange.startDate && dateRange.endDate) {
      const startDate = new Date(dateRange.startDate);
      const endDate = new Date(dateRange.endDate);
      endDate.setHours(23, 59, 59);
      filtered = filtered.filter(item => {
        const saleDate = new Date(item.TransactionDate);
        return saleDate >= startDate && saleDate <= endDate;
      });
    }
    setFilteredData(filtered);
    setCurrentPage(1);
  };

  // Pagination
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const paginatedData = filteredData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // --- Update summary statistics ---
  const totalSales = filteredData.reduce((sum, item) => sum + Number(item.Amount), 0);
  const totalCost = filteredData.reduce((sum, item) => sum + (Number(item.CostPrice || 0) * (item.Qty || 0)), 0);
  const totalProfit = filteredData.reduce((sum, item) => sum + Number(item.Profit || 0), 0);
  const totalQuantity = filteredData.reduce((sum, item) => sum + (item.Qty || 0), 0);
  const uniqueProducts = new Set(filteredData.map(item => item.product?.ProductID)).size;
  const uniqueClients = new Set(filteredData.map(item => item.billing?.client?.ClientID || item.billing?.FirstName + item.billing?.LastName)).size;

  // Top seller product
  let topSeller = { name: '-', qty: 0 };
  if (filteredData.length > 0) {
    const productSales = {};
    filteredData.forEach(item => {
      const id = item.product?.ProductID;
      if (!id) return;
      if (!productSales[id]) {
        productSales[id] = { name: item.product.ProductName, qty: 0 };
      }
      productSales[id].qty += item.Qty || 0;
    });
    const top = Object.values(productSales).sort((a, b) => b.qty - a.qty)[0];
    if (top) topSeller = top;
  }

  // Animated counters
  const { displayValue: animatedTotalSales } = useSmoothCounter(totalSales, 1000, 200);
  const { displayValue: animatedTotalProfit } = useSmoothCounter(totalProfit, 1000, 300);
  const { displayValue: animatedTotalQuantity } = useSmoothCounter(totalQuantity, 1000, 400);
  const { displayValue: animatedUniqueProducts } = useSmoothCounter(uniqueProducts, 1000, 600);
  const { displayValue: animatedTopSellerQty } = useSmoothCounter(topSeller.qty, 1000, 800);

  // Pagination buttons
  const paginationButtons = [];
  const maxVisiblePages = 5;
  if (totalPages <= maxVisiblePages) {
    for (let i = 1; i <= totalPages; i++) {
      paginationButtons.push(
        <Button
          key={`page-${i}`}
          variant={currentPage === i ? 'default' : 'outline'}
          size="sm"
          onClick={() => setCurrentPage(i)}
        >
          {i}
        </Button>
      );
    }
  } else {
    const startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    const endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
    if (startPage > 1) {
      paginationButtons.push(
        <Button key="page-1" variant="outline" size="sm" onClick={() => setCurrentPage(1)}>
          1
        </Button>
      );
      if (startPage > 2) {
        paginationButtons.push(<span key="ellipsis-start" className="px-2">...</span>);
      }
    }
    for (let i = startPage; i <= endPage; i++) {
      paginationButtons.push(
        <Button
          key={`page-${i}`}
          variant={currentPage === i ? 'default' : 'outline'}
          size="sm"
          onClick={() => setCurrentPage(i)}
        >
          {i}
        </Button>
      );
    }
    if (endPage < totalPages) {
      if (endPage < totalPages - 1) {
        paginationButtons.push(<span key="ellipsis-end" className="px-2">...</span>);
      }
      paginationButtons.push(
        <Button key={`page-${totalPages}`} variant="outline" size="sm" onClick={() => setCurrentPage(totalPages)}>
          {totalPages}
        </Button>
      );
    }
  }

  // Export to PDF
  const exportToPDF = async () => {
    setIsExporting(true);
    try {
      const { jsPDF } = await import('jspdf');
      // Landscape for more horizontal space with 7 columns
      const pdf = new jsPDF('l', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 15;
      const contentWidth = pageWidth - (2 * margin);
      let yPosition = 15;

      // Helper: add text that wraps within a max width
      const addWrappedText = (text, x, y, maxWidth, fontSize = 10) => {
        pdf.setFontSize(fontSize);
        const lines = pdf.splitTextToSize(text, maxWidth);
        pdf.text(lines, x, y);
        return lines.length * (fontSize * 0.45);
      };

      // Helper: draw text clipped to a cell (no overflow into next column)
      const drawCellText = (text, x, y, cellWidth, cellHeight) => {
        const textStr = String(text);
        const maxTextWidth = cellWidth - 4; // 2mm padding on each side
        let displayText = textStr;
        // Truncate with ellipsis if text is too wide
        if (pdf.getTextWidth(displayText) > maxTextWidth) {
          while (displayText.length > 0 && pdf.getTextWidth(displayText + '...') > maxTextWidth) {
            displayText = displayText.slice(0, -1);
          }
          displayText = displayText + '...';
        }
        pdf.text(displayText, x + 2, y + (cellHeight * 0.65));
      };

      // --- Title ---
      pdf.setFontSize(18);
      pdf.setFont('helvetica', 'bold');
      const title = 'Product Sales Report';
      const titleWidth = pdf.getTextWidth(title);
      pdf.text(title, (pageWidth - titleWidth) / 2, yPosition);
      yPosition += 12;

      // --- Filters ---
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Filters Applied:', margin, yPosition);
      yPosition += 6;
      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'normal');
      const dateRangeText = `Date Range: ${dateRange.startDate && dateRange.endDate
        ? `${format(new Date(dateRange.startDate), 'MMM dd, yyyy')} - ${format(new Date(dateRange.endDate), 'MMM dd, yyyy')}`
        : selectedDate
          ? `Specific date: ${format(new Date(selectedDate), 'MMM dd, yyyy')}`
          : 'All dates'}`;
      yPosition += addWrappedText(dateRangeText, margin, yPosition, contentWidth, 9);
      const searchTermText = `Search Term: ${searchTerm || 'All products/clients'}`;
      yPosition += addWrappedText(searchTermText, margin, yPosition, contentWidth, 9);
      yPosition += 8;

      // --- Summary ---
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Summary Statistics:', margin, yPosition);
      yPosition += 6;
      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'normal');
      const summaryItems = [
        `Total Sales: P${totalSales.toFixed(2)}`,
        `Total Revenue (Profit): P${totalProfit.toFixed(2)}`,
        `Total Quantity Sold: ${totalQuantity}`,
        `Unique Products Sold: ${uniqueProducts}`,
        `Unique Clients: ${uniqueClients}`,
      ];
      summaryItems.forEach(text => {
        yPosition += addWrappedText(text, margin, yPosition, contentWidth, 9);
      });
      yPosition += 10;

      // --- Table ---
      const headers = ['Product', 'Qty', 'Cost', 'Amount', 'Profit', 'Client', 'Date'];
      const colWidthPercentages = [0.20, 0.07, 0.13, 0.13, 0.13, 0.16, 0.18];
      const colWidths = colWidthPercentages.map(p => contentWidth * p);
      const rowHeight = 8;
      const headerHeight = 9;

      // Draw table headers
      const drawTableHeaders = (y) => {
        let xPos = margin;
        pdf.setFontSize(9);
        pdf.setFont('helvetica', 'bold');
        headers.forEach((header, index) => {
          pdf.setFillColor(41, 128, 185);
          pdf.rect(xPos, y, colWidths[index], headerHeight, 'F');
          pdf.setDrawColor(41, 128, 185);
          pdf.rect(xPos, y, colWidths[index], headerHeight, 'S');
          pdf.setTextColor(255, 255, 255);
          drawCellText(header, xPos, y, colWidths[index], headerHeight);
          xPos += colWidths[index];
        });
        pdf.setTextColor(0, 0, 0);
        pdf.setDrawColor(0, 0, 0);
        return y + headerHeight;
      };

      yPosition = drawTableHeaders(yPosition);

      // Draw table rows
      pdf.setFontSize(8);
      pdf.setFont('helvetica', 'normal');
      filteredData.forEach((item, index) => {
        // Check if we need a new page (leave room for footer)
        if (yPosition + rowHeight > pageHeight - 15) {
          // Footer on current page
          pdf.setFontSize(8);
          pdf.setFont('helvetica', 'italic');
          const pageNum = `Page ${pdf.getNumberOfPages()}`;
          pdf.text(pageNum, pageWidth - margin - pdf.getTextWidth(pageNum), pageHeight - 8);
          // New page
          pdf.addPage();
          yPosition = 15;
          yPosition = drawTableHeaders(yPosition);
          pdf.setFontSize(8);
          pdf.setFont('helvetica', 'normal');
        }

        let xPos = margin;

        // Zebra striping
        if (index % 2 === 0) {
          pdf.setFillColor(245, 248, 255);
          pdf.rect(xPos, yPosition, colWidths.reduce((a, b) => a + b, 0), rowHeight, 'F');
        }

        const row = [
          item.product?.ProductName || '-',
          String(item.Qty || '-'),
          `P${(Number(item.CostPrice || 0) * (item.Qty || 0)).toFixed(2)}`,
          `P${Number(item.Amount).toFixed(2)}`,
          `P${Number(item.Profit || 0).toFixed(2)}`,
          (item.billing?.client
            ? `${item.billing.client.FirstName || ''} ${item.billing.client.LastName || ''}`.trim()
            : ((item.billing?.FirstName || '') + ' ' + (item.billing?.LastName || '')).trim()) || '-',
          format(new Date(item.TransactionDate), 'M/d/yyyy h:mm a'),
        ];

        row.forEach((cell, colIdx) => {
          pdf.setDrawColor(220, 220, 220);
          pdf.rect(xPos, yPosition, colWidths[colIdx], rowHeight, 'S');
          pdf.setTextColor(0, 0, 0);
          drawCellText(cell, xPos, yPosition, colWidths[colIdx], rowHeight);
          xPos += colWidths[colIdx];
        });
        yPosition += rowHeight;
      });

      // Footer on last page
      pdf.setFontSize(8);
      pdf.setFont('helvetica', 'italic');
      pdf.setTextColor(120, 120, 120);
      const footerText = `Report generated on ${new Date().toLocaleString()}`;
      const footerWidth = pdf.getTextWidth(footerText);
      pdf.text(footerText, (pageWidth - footerWidth) / 2, pageHeight - 8);
      const pageNum = `Page ${pdf.getNumberOfPages()}`;
      pdf.text(pageNum, pageWidth - margin - pdf.getTextWidth(pageNum), pageHeight - 8);
      pdf.setTextColor(0, 0, 0);

      // Save as downloadable file
      const timestamp = format(new Date(), 'yyyy-MM-dd_HHmm');
      pdf.save(`Sales_Report_${timestamp}.pdf`);
      toast.success('Report downloaded successfully.');
    } catch (error) {
      toast.error('Failed to export PDF. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  const isDateRangeInvalid = dateRange.startDate && dateRange.endDate && new Date(dateRange.startDate) > new Date(dateRange.endDate);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          {/* <h1 className="text-3xl font-bold">Product Sales Report</h1>
          <p className="text-muted-foreground">Track and analyze product sales</p> */}
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={fetchSalesData}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Loading...
              </>
            ) : (
              <>
                <RefreshCcw className="mr-2 h-4 w-4" />
                Refresh Data
              </>
            )}
          </Button>
          <Button
            onClick={exportToPDF}
            disabled={isExporting || filteredData.length === 0}
            className="min-w-[140px]"
          >
            {isExporting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Exporting...
              </>
            ) : (
              <>
                <Download className="mr-2 h-4 w-4" />
                Export PDF
              </>
            )}
          </Button>
        </div>
      </div>
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          {isLoading ? (
            <>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-4" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-32 mb-2" />
                <Skeleton className="h-3 w-24" />
              </CardContent>
            </>
          ) : (
            <>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Sales</CardTitle>
                <PhilippinePeso className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">₱{animatedTotalSales.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                <p className="text-xs text-muted-foreground">Total sales amount</p>
              </CardContent>
            </>
          )}
        </Card>
        <Card>
          {isLoading ? (
            <>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-4" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-32 mb-2" />
                <Skeleton className="h-3 w-24" />
              </CardContent>
            </>
          ) : (
            <>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                <TrendingUp className="h-4 w-4 text-emerald-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-emerald-600">₱{animatedTotalProfit.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                <p className="text-xs text-muted-foreground">Profit (Sales - Cost)</p>
              </CardContent>
            </>
          )}
        </Card>
        <Card>
          {isLoading ? (
            <>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-4" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16 mb-2" />
                <Skeleton className="h-3 w-32" />
              </CardContent>
            </>
          ) : (
            <>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Unique Products</CardTitle>
                <Package className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{animatedUniqueProducts}</div>
                <p className="text-xs text-muted-foreground">Total number of unique products</p>
              </CardContent>
            </>
          )}
        </Card>
        <Card>
          {isLoading ? (
            <>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-4 w-4" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16 mb-2" />
                <Skeleton className="h-3 w-32" />
              </CardContent>
            </>
          ) : (
            <>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Product Sold</CardTitle>
                <ShoppingCart className="h-4 w-4 text-orange-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{animatedTotalQuantity}</div>
                <p className="text-xs text-muted-foreground">Total quantity of product sold</p>
              </CardContent>
            </>
          )}
        </Card>
        <Card>
          {isLoading ? (
            <>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-4 w-4" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-6 w-24 mb-2" />
                <Skeleton className="h-3 w-20" />
              </CardContent>
            </>
          ) : (
            <>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Most Selling Product</CardTitle>
                <Award className="h-4 w-4 text-yellow-600" />
              </CardHeader>
              <CardContent>
                <div className="text-lg font-bold">{topSeller.name}</div>
                <p className="text-xs text-muted-foreground">Quantity Sold: {animatedTopSellerQty}</p>
              </CardContent>
            </>
          )}
        </Card>
      </div>
      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Use either Specific Date OR Date Range (not both). Leave both empty to see all dates.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search by product or client name */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Search by Product/Client Name</label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search product or client name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            {/* Single date filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Specific Date</label>
              <div className="relative">
                <Calendar className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="pl-8"
                  placeholder="Select a specific date"
                />
              </div>
              <p className="text-xs text-muted-foreground">Filter sales for a single day</p>
            </div>
            {/* Date range */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Date Range</label>
              <div className="space-y-2">
                <div className="relative">
                  <Calendar className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="date"
                    value={dateRange.startDate}
                    onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
                    className="pl-8"
                    placeholder="From date"
                  />
                </div>
                <div className="relative">
                  <Calendar className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="date"
                    value={dateRange.endDate}
                    onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
                    className="pl-8"
                    placeholder="To date"
                  />
                </div>
              </div>
              {isDateRangeInvalid ? (
                <p className="text-xs text-red-600 font-semibold">The "From" date cannot be after the "To" date.</p>
              ) : (
                <p className="text-xs text-muted-foreground">Filter sales between two dates</p>
              )}
            </div>
            {/* (Optional) Add more filters here if needed */}
          </div>
          {/* Filter action buttons */}
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setSearchTerm('');
                setSelectedDate('');
                setDateRange({ startDate: '', endDate: '' });
                setFilteredData(salesData);
                setCurrentPage(1);
              }}
            >
              Clear Filters
            </Button>
            <Button
              onClick={applyFilters}
              className="min-w-[120px]"
              disabled={isDateRangeInvalid}
            >
              Apply Filters
            </Button>
          </div>
        </CardContent>
      </Card>
      {/* Results Table */}
      <Card>
        <CardHeader>
          <CardTitle>Sales Records</CardTitle>
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredData.length)} of {filteredData.length} records
            </p>
            {filteredData.length > 0 && (
              <div className="flex items-center space-x-2">
                <span className="text-sm text-muted-foreground">Page size:</span>
                <Select value={itemsPerPage.toString()} onValueChange={(value) => {
                  setItemsPerPage(parseInt(value));
                  setCurrentPage(1);
                }}>
                  <SelectTrigger className="w-20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {pageSizeOptions.map(size => (
                      <SelectItem key={size} value={size.toString()}>
                        {size}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>Qty</TableHead>
                  <TableHead>Cost</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Profit</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={`loading-sales-${i}`}>
                      <TableCell>
                        <Skeleton className="h-4 w-28" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-12" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-20" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-20" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-20" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-24" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-24" />
                      </TableCell>
                    </TableRow>
                  ))
                ) : paginatedData.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      <div className="space-y-2">
                        <p className="text-muted-foreground">No sales records found</p>
                        <p className="text-sm text-muted-foreground">
                          {filteredData.length === 0 && salesData.length === 0
                            ? "No sales data available. Sales will appear here once products are sold."
                            : "No records match your current filters. Try adjusting your search criteria."}
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedData.map((item, index) => (
                    <TableRow key={`${item.TransactionID}-${index}`}>
                      <TableCell>{item.product?.ProductName || '-'}</TableCell>
                      <TableCell>{item.Qty || '-'}</TableCell>
                      <TableCell>₱{(Number(item.CostPrice || 0) * (item.Qty || 0)).toFixed(2)}</TableCell>
                      <TableCell>₱{Number(item.Amount).toFixed(2)}</TableCell>
                      <TableCell className="text-emerald-600 font-medium">₱{Number(item.Profit || 0).toFixed(2)}</TableCell>
                      <TableCell>{(item.billing?.client
                        ? `${item.billing.client.FirstName || ''} ${item.billing.client.LastName || ''}`.trim()
                        : ((item.billing?.FirstName || '') + ' ' + (item.billing?.LastName || '')).trim()) || '-'
                      }</TableCell>
                      <TableCell>{format(new Date(item.TransactionDate), 'M/d/yyyy h:mm a')}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
          {/* Pagination */}
          {filteredData.length > 0 && totalPages > 1 && (
            <div className="flex items-center justify-center mt-4">
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
    </div>
  );
}
