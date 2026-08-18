import React, { useState, useMemo } from 'react';
import { 
  FileText, 
  ChevronLeft, 
  ChevronRight, 
  ArrowUpDown, 
  Download, 
  CheckCircle2, 
  RotateCcw
} from 'lucide-react';
import { SaleRecord } from '../types';

interface OrdersTableProps {
  records: SaleRecord[];
  onExportCsv: () => void;
}

export const OrdersTable: React.FC<OrdersTableProps> = ({
  records,
  onExportCsv,
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);
  const [sortField, setSortField] = useState<keyof SaleRecord>('dateStr');
  const [sortAsc, setSortAsc] = useState(false);

  const handleSort = (field: keyof SaleRecord) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(false);
    }
  };

  const sortedRecords = useMemo(() => {
    return [...records].sort((a, b) => {
      let valA = a[sortField];
      let valB = b[sortField];

      if (typeof valA === 'string') {
        valA = (valA as string).toLowerCase();
        valB = ((valB as string) || '').toLowerCase();
      }

      if (valA < valB) return sortAsc ? -1 : 1;
      if (valA > valB) return sortAsc ? 1 : -1;
      return 0;
    });
  }, [records, sortField, sortAsc]);

  const totalPages = Math.ceil(sortedRecords.length / pageSize) || 1;
  const paginatedRecords = sortedRecords.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  return (
    <div className="bg-white border border-[#EBE5D9] rounded-[28px] p-6 shadow-sm mb-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3.5 border-b border-[#EBE5D9]">
        <div>
          <h3 className="text-base font-extrabold text-[#2D2A26] flex items-center gap-2 tracking-tight">
            <FileText className="w-4 h-4 text-[#5F7161]" />
            Orders & Line-Items Data Explorer
          </h3>
          <p className="text-xs text-[#8C8376] font-medium mt-0.5">
            Showing {records.length.toLocaleString()} transactions matching your active filters
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Page Size Selector */}
          <div className="flex items-center gap-1.5 text-xs text-[#8C8376] font-semibold">
            <span>Rows:</span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="bg-[#F9F7F2] border border-[#EBE5D9] rounded-lg px-2.5 py-1 text-xs text-[#2D2A26] font-bold focus:outline-none focus:ring-2 focus:ring-[#5F7161]"
            >
              <option value={10}>10</option>
              <option value={15}>15</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>

          {/* Export Button */}
          <button
            onClick={onExportCsv}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-[#433E37] bg-[#F1EDE5] hover:bg-[#EBE5D9] rounded-xl transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Table</span>
          </button>
        </div>
      </div>

      {/* Table Element */}
      <div className="overflow-x-auto">
        <table className="w-full text-xs text-left">
          <thead>
            <tr className="bg-[#FAF8F5] border-b border-[#EBE5D9] text-[#8C8376] font-bold uppercase tracking-wider text-[11px] select-none">
              <th className="py-2.5 px-3 cursor-pointer" onClick={() => handleSort('dateStr')}>
                <div className="flex items-center gap-1">
                  <span>Date</span>
                  <ArrowUpDown className="w-3 h-3 text-[#CEC4B5]" />
                </div>
              </th>
              <th className="py-2.5 px-3 cursor-pointer" onClick={() => handleSort('orderNumber')}>
                <div className="flex items-center gap-1">
                  <span>Order #</span>
                  <ArrowUpDown className="w-3 h-3 text-[#CEC4B5]" />
                </div>
              </th>
              <th className="py-2.5 px-3 cursor-pointer" onClick={() => handleSort('channel')}>
                <div className="flex items-center gap-1">
                  <span>Channel</span>
                  <ArrowUpDown className="w-3 h-3 text-[#CEC4B5]" />
                </div>
              </th>
              <th className="py-2.5 px-3 cursor-pointer" onClick={() => handleSort('productName')}>
                <div className="flex items-center gap-1">
                  <span>Product & Category</span>
                  <ArrowUpDown className="w-3 h-3 text-[#CEC4B5]" />
                </div>
              </th>
              <th className="py-2.5 px-3 text-right cursor-pointer" onClick={() => handleSort('qty')}>
                <div className="flex items-center justify-end gap-1">
                  <span>QTY</span>
                  <ArrowUpDown className="w-3 h-3 text-[#CEC4B5]" />
                </div>
              </th>
              <th className="py-2.5 px-3 text-right cursor-pointer" onClick={() => handleSort('saleValue')}>
                <div className="flex items-center justify-end gap-1">
                  <span>Sale Value</span>
                  <ArrowUpDown className="w-3 h-3 text-[#CEC4B5]" />
                </div>
              </th>
              <th className="py-2.5 px-3 text-right cursor-pointer" onClick={() => handleSort('scoobiesMargin')}>
                <div className="flex items-center justify-end gap-1">
                  <span>Margin</span>
                  <ArrowUpDown className="w-3 h-3 text-[#CEC4B5]" />
                </div>
              </th>
              <th className="py-2.5 px-3 cursor-pointer" onClick={() => handleSort('deliveryPlace')}>
                <div className="flex items-center gap-1">
                  <span>Location</span>
                  <ArrowUpDown className="w-3 h-3 text-[#CEC4B5]" />
                </div>
              </th>
              <th className="py-2.5 px-3 text-center cursor-pointer" onClick={() => handleSort('status')}>
                <div className="flex items-center justify-center gap-1">
                  <span>Status</span>
                  <ArrowUpDown className="w-3 h-3 text-[#CEC4B5]" />
                </div>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#F1EDE5]">
            {paginatedRecords.length === 0 ? (
              <tr>
                <td colSpan={9} className="py-8 text-center text-[#8C8376] font-medium">
                  No records match your selected filters.
                </td>
              </tr>
            ) : (
              paginatedRecords.map((r) => (
                <tr key={r.id} className="hover:bg-[#FAF8F5] transition-colors">
                  <td className="py-2.5 px-3 text-[#433E37] font-medium whitespace-nowrap">
                    {r.dateStr}
                  </td>
                  <td className="py-2.5 px-3 font-mono font-bold text-[#2D2A26] whitespace-nowrap">
                    {r.orderNumber}
                  </td>
                  <td className="py-2.5 px-3 text-[#433E37] whitespace-nowrap">
                    <span className="inline-block px-2 py-0.5 bg-[#F1EDE5] border border-[#EBE5D9] rounded-md text-[11px] font-bold text-[#2D2A26]">
                      {r.channel}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 max-w-[200px]">
                    <div className="font-bold text-[#2D2A26] truncate" title={r.productName}>
                      {r.productName}
                    </div>
                    <div className="text-[10px] text-[#8C8376] flex items-center gap-1 font-medium">
                      <span>{r.category}</span>
                      {r.color && <span>• {r.color}</span>}
                    </div>
                  </td>
                  <td className={`py-2.5 px-3 text-right font-bold whitespace-nowrap ${
                    r.qty < 0 ? 'text-[#AF8260]' : 'text-[#2D2A26]'
                  }`}>
                    {r.qty}
                  </td>
                  <td className={`py-2.5 px-3 text-right font-black whitespace-nowrap ${
                    r.saleValue < 0 ? 'text-[#AF8260]' : 'text-[#5F7161]'
                  }`}>
                    ₹{r.saleValue.toLocaleString()}
                  </td>
                  <td className="py-2.5 px-3 text-right font-semibold text-[#433E37] whitespace-nowrap">
                    ₹{r.scoobiesMargin.toLocaleString()}
                  </td>
                  <td className="py-2.5 px-3 text-[#433E37] whitespace-nowrap">
                    <div className="font-medium">{r.deliveryPlace}</div>
                    <div className="text-[10px] text-[#8C8376] font-medium">{r.state} ({r.zone})</div>
                  </td>
                  <td className="py-2.5 px-3 text-center whitespace-nowrap">
                    {r.status === 'Return' ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#FAF0E6] text-[#AF8260] border border-[#E8D2C2]">
                        <RotateCcw className="w-2.5 h-2.5" /> Return
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#E9EFEA] text-[#5F7161] border border-[#C5D5C7]">
                        <CheckCircle2 className="w-2.5 h-2.5" /> Dispatched
                      </span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mt-4 pt-3.5 border-t border-[#EBE5D9] text-xs text-[#8C8376] font-medium">
        <div>
          Showing {(currentPage - 1) * pageSize + 1} to{' '}
          {Math.min(currentPage * pageSize, sortedRecords.length)} of{' '}
          {sortedRecords.length.toLocaleString()} entries
        </div>

        <div className="flex items-center gap-1.5 self-center sm:self-auto">
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="p-1.5 rounded-lg border border-[#EBE5D9] hover:bg-[#F1EDE5] disabled:opacity-40 disabled:cursor-not-allowed text-[#433E37]"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="px-2.5 py-1 font-bold text-[#2D2A26]">
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="p-1.5 rounded-lg border border-[#EBE5D9] hover:bg-[#F1EDE5] disabled:opacity-40 disabled:cursor-not-allowed text-[#433E37]"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
