import React, { useState, useEffect } from 'react';

export interface Column {
  key: string;
  label: React.ReactNode;
  initialWidth: number;
  minWidth?: number;
}

interface UnifiedTableProps {
  columns: Column[];
  data: any[];
  renderRow: (item: any, index: number, widths: number[]) => React.ReactNode;
  loading?: boolean;
  emptyText?: string;
  maxHeight?: string;
}

const UnifiedTable: React.FC<UnifiedTableProps> = ({
  columns,
  data,
  renderRow,
  loading = false,
  emptyText = 'Không có dữ liệu hiển thị.',
  maxHeight = 'calc(100vh - 280px)'
}) => {
  const [widths, setWidths] = useState<number[]>([]);

  useEffect(() => {
    setWidths(columns.map(c => c.initialWidth));
  }, [columns]);

  const handleMouseDown = (index: number, e: React.MouseEvent) => {
    e.preventDefault();
    const startX = e.clientX;
    const startWidth = widths[index];

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const deltaX = moveEvent.clientX - startX;
      const minW = columns[index].minWidth || 40;
      const newWidth = Math.max(minW, startWidth + deltaX);
      
      setWidths(prev => {
        const updated = [...prev];
        updated[index] = newWidth;
        return updated;
      });
    };

    const handleMouseUp = () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  return (
    <div className="unified-table-wrapper" style={{ maxHeight }}>
      <table className="unified-table">
        <colgroup>
          {widths.map((w, idx) => (
            <col key={idx} style={{ width: `${w}px` }} />
          ))}
        </colgroup>
        <thead>
          <tr>
            {columns.map((col, idx) => (
              <th key={col.key} style={{ position: 'relative' }}>
                <span style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {col.label}
                </span>
                <div
                  className="column-resizer-handle"
                  onMouseDown={(e) => handleMouseDown(idx, e)}
                />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr>
              <td colSpan={columns.length} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                Đang tải dữ liệu...
              </td>
            </tr>
          ) : data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                {emptyText}
              </td>
            </tr>
          ) : (
            data.map((item, idx) => renderRow(item, idx, widths))
          )}
        </tbody>
      </table>
    </div>
  );
};

export default UnifiedTable;
