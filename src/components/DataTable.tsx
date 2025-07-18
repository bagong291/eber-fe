
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Search, Plus, Edit, Trash2 } from 'lucide-react';

interface Column<T> {
  key: keyof T;
  label: string;
  render?: (value: unknown, row: T) => React.ReactNode;
}

interface DataTableProps<T extends { id: string }> {
  data: T[];
  columns: Column<T>[];
  onAdd: () => void;
  onEdit: (item: T) => void;
  onDelete: (id: string) => void;
  searchPlaceholder?: string;
  title?: string;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
}

function DataTable<T extends { id: string }>({
  data,
  columns,
  onAdd,
  onEdit,
  onDelete,
  searchPlaceholder = "Search...",
  title,
  searchValue,
  onSearchChange
}: DataTableProps<T>) {
  const [internalSearchTerm, setInternalSearchTerm] = useState('');

  // Use external search if provided, otherwise use internal
  const searchTerm = searchValue !== undefined ? searchValue : internalSearchTerm;
  const setSearchTerm = onSearchChange || setInternalSearchTerm;

  const filteredData = data.filter((item) =>
    Object.values(item).some((value) =>
      String(value).toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        {title && <h2 className="text-2xl font-bold text-gray-900">{title}</h2>}
        <Button onClick={onAdd} className="flex items-center space-x-2">
          <Plus className="h-4 w-4" />
          <span>Add New</span>
        </Button>
      </div>
      
      <div className="flex items-center space-x-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <Input
            placeholder={searchPlaceholder}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((column) => (
                <TableHead key={String(column.key)}>{column.label}</TableHead>
              ))}
              <TableHead className="w-24">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredData.map((item) => (
              <TableRow key={item.id}>
                {columns.map((column) => (
                  <TableCell key={String(column.key)}>
                    {column.render 
                      ? column.render(item[column.key], item)
                      : String(item[column.key])
                    }
                  </TableCell>
                ))}
                <TableCell>
                  <div className="flex space-x-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onEdit(item)}
                    >
                      <Edit className="h-3 w-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onDelete(item.id)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {filteredData.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No data found
          </div>
        )}
      </div>
    </div>
  );
}

export default DataTable;
