import type { ReactNode } from "react";
import { Search } from "lucide-react";

export interface TableColumn<T> {
  key: string;
  header: ReactNode;
  className?: string;
  render: (row: T) => ReactNode;
}

export interface FilterableTableProps<T> {
  columns: TableColumn<T>[];
  rows: T[];
  getRowId: (row: T) => string;
  selectedId?: string;
  onRowClick?: (row: T) => void;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  searchPlaceholder?: string;
  filters?: ReactNode;
  emptyMessage?: string;
  footer?: ReactNode;
}

/**
 * Shared filter-row + table shell matching the Fleet page's markup/CSS classes
 * (.filter-row, .table-search, .table-wrap, table). Column shape and row data are
 * fully caller-defined, so every module's table stays visually consistent without
 * re-implementing the filter bar or table chrome per page.
 */
export function FilterableTable<T>({
  columns,
  rows,
  getRowId,
  selectedId,
  onRowClick,
  searchValue,
  onSearchChange,
  searchPlaceholder = "Search...",
  filters,
  emptyMessage = "No records match the current filters.",
  footer,
}: FilterableTableProps<T>) {
  return (
    <>
      {(onSearchChange || filters) && (
        <div className="filter-row">
          {onSearchChange && (
            <div className="table-search">
              <Search size={16} />
              <input
                value={searchValue}
                onChange={e => onSearchChange(e.target.value)}
                placeholder={searchPlaceholder}
              />
            </div>
          )}
          {filters}
        </div>
      )}
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              {columns.map(col => <th key={col.key} className={col.className}>{col.header}</th>)}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr><td colSpan={columns.length} className="table-empty">{emptyMessage}</td></tr>
            )}
            {rows.map(row => {
              const id = getRowId(row);
              return (
                <tr
                  key={id}
                  className={selectedId === id ? "selected-row" : ""}
                  onClick={() => onRowClick?.(row)}
                >
                  {columns.map(col => <td key={col.key} className={col.className}>{col.render(row)}</td>)}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {footer}
    </>
  );
}
