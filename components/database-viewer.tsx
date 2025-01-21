import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

interface DatabaseViewerProps {
  tables: {
    name: string;
    columns: string[];
    rows: any[][];
  }[];
}

export function DatabaseViewer({ tables }: DatabaseViewerProps) {
  return null;
}

