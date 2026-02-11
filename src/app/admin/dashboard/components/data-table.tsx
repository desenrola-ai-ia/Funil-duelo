'use client';

interface Column<T> {
  key: string;
  label: string;
  align?: 'left' | 'right' | 'center';
  render?: (row: T) => React.ReactNode;
}

export function DataTable<T extends Record<string, any>>({
  columns,
  data,
  emptyMessage = 'Sem dados',
}: {
  columns: Column<T>[];
  data: T[];
  emptyMessage?: string;
}) {
  if (data.length === 0) {
    return <p className="text-gray-500 text-sm text-center py-8">{emptyMessage}</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-800">
            {columns.map((col) => (
              <th
                key={col.key}
                className={
                  'py-2.5 px-3 text-gray-400 font-medium text-xs uppercase tracking-wider ' +
                  (col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left')
                }
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, i) => (
            <tr key={i} className="border-b border-gray-800/50 hover:bg-gray-800/30">
              {columns.map((col) => (
                <td
                  key={col.key}
                  className={
                    'py-2.5 px-3 font-mono text-sm ' +
                    (col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left')
                  }
                >
                  {col.render ? col.render(row) : row[col.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
