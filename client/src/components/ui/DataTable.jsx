import React, { useState } from 'react';

export function DataTable({
  columns = [],
  data = [],
  keyField = '_id',
  onRowClick,
  emptyMessage = 'No records found',
  emptySubtext = 'Try adjusting your filters or check back later.',
  emptyAction,
  loading = false,
  pageSize = 10,
  className = ''
}) {
  const [currentPage, setCurrentPage] = useState(1);
  const [sortField, setSortField] = useState(null);
  const [sortAsc, setSortAsc] = useState(true);

  // Sorting
  const sortedData = React.useMemo(() => {
    if (!sortField) return data;
    return [...data].sort((a, b) => {
      let aVal = a[sortField];
      let bVal = b[sortField];
      if (typeof aVal === 'string') aVal = aVal.toLowerCase();
      if (typeof bVal === 'string') bVal = bVal.toLowerCase();
      if (aVal < bVal) return sortAsc ? -1 : 1;
      if (aVal > bVal) return sortAsc ? 1 : -1;
      return 0;
    });
  }, [data, sortField, sortAsc]);

  // Pagination
  const totalPages = Math.ceil(sortedData.length / pageSize) || 1;
  const paginatedData = React.useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedData.slice(start, start + pageSize);
  }, [sortedData, currentPage, pageSize]);

  const handleSort = (field) => {
    if (!field) return;
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  return (
    <div className={`w-full bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden ${className}`}>
      {/* Constrained local horizontal scroll container to prevent page overflow */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-gray-600 border-collapse">
          <thead className="bg-gray-50/80 border-b border-gray-200 text-xs uppercase font-semibold text-gray-500 tracking-wider sticky top-0 z-10">
            <tr>
              {columns.map((col, idx) => (
                <th
                  key={col.key || idx}
                  scope="col"
                  onClick={() => col.sortable && handleSort(col.key)}
                  className={`py-3.5 px-4 whitespace-nowrap ${
                    col.sortable ? 'cursor-pointer select-none hover:text-[#0F2A4A]' : ''
                  } ${col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left'} ${
                    col.headerClassName || ''
                  }`}
                >
                  <div className={`inline-flex items-center space-x-1 ${col.align === 'right' ? 'justify-end' : ''}`}>
                    <span>{col.label}</span>
                    {col.sortable && (
                      <span className="text-gray-400 text-xs">
                        {sortField === col.key ? (sortAsc ? '↑' : '↓') : '↕'}
                      </span>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              // Loading Skeleton Rows
              Array.from({ length: 4 }).map((_, rIdx) => (
                <tr key={`skel-${rIdx}`} className="animate-pulse">
                  {columns.map((col, cIdx) => (
                    <td key={`skel-td-${cIdx}`} className="py-4 px-4">
                      <div className="h-4 bg-gray-100 rounded w-3/4"></div>
                    </td>
                  ))}
                </tr>
              ))
            ) : paginatedData.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="py-12 px-4 text-center">
                  <div className="max-w-sm mx-auto flex flex-col items-center">
                    <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 mb-3 text-xl">
                      📂
                    </div>
                    <p className="text-sm font-semibold text-gray-900">{emptyMessage}</p>
                    <p className="text-xs text-gray-500 mt-1 mb-4">{emptySubtext}</p>
                    {emptyAction}
                  </div>
                </td>
              </tr>
            ) : (
              paginatedData.map((row, rIdx) => (
                <tr
                  key={row[keyField] || rIdx}
                  onClick={() => onRowClick && onRowClick(row)}
                  className={`transition-colors ${
                    onRowClick ? 'cursor-pointer hover:bg-blue-50/40' : 'hover:bg-gray-50/60'
                  }`}
                >
                  {columns.map((col, cIdx) => (
                    <td
                      key={col.key || cIdx}
                      className={`py-3.5 px-4 whitespace-nowrap ${
                        col.align === 'right' ? 'text-right font-mono' : col.align === 'center' ? 'text-center' : 'text-left'
                      } ${col.cellClassName || ''}`}
                    >
                      {col.render ? col.render(row[col.key], row, rIdx) : (row[col.key] ?? '—')}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      {!loading && sortedData.length > pageSize && (
        <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
          <div>
            Showing <span className="font-semibold text-gray-900">{(currentPage - 1) * pageSize + 1}</span> to{' '}
            <span className="font-semibold text-gray-900">
              {Math.min(currentPage * pageSize, sortedData.length)}
            </span>{' '}
            of <span className="font-semibold text-gray-900">{sortedData.length}</span> results
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-2.5 py-1 rounded border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <span className="font-medium text-gray-700">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-2.5 py-1 rounded border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default DataTable;
