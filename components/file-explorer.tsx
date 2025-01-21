import { useState } from 'react';
import { ChevronRight, ChevronDown, File as FileIcon, Folder as FolderIcon } from 'lucide-react';

interface FileNode {
  id: string;
  name: string;
  type: 'file' | 'folder';
  children?: FileNode[];
  content?: string;
}

interface FileExplorerProps {
  files: FileNode[];
  onFileSelect: (file: FileNode) => void;
  loading?: boolean;     
  disabled?: boolean;       
}

function FileTreeNode({
  node,
  onFileSelect,
  disabled,
}: {
  node: FileNode;
  onFileSelect: (file: FileNode) => void;
  disabled: boolean;
}) {
  const [isOpen, setIsOpen] = useState(false);

  const toggleOpen = () => {
    if (disabled) return;
    if (node.type === 'folder') {
      setIsOpen(!isOpen);
    }
  };

  return (
    <div>
      <div
        className={`flex items-center gap-2 px-2 py-1 rounded-md ${
          disabled ? 'cursor-not-allowed text-zinc-500' : 'cursor-pointer hover:bg-zinc-800'
        }`}
        onClick={toggleOpen}
      >
        {node.type === 'folder' ? (
          isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />
        ) : (
          <FileIcon className="h-4 w-4" />
        )}

        <span
          onClick={(e) => {
            e.stopPropagation();
            if (node.type === 'file' && !disabled) {
              onFileSelect(node);
            }
          }}
        >
          {node.name}
        </span>
      </div>

      {node.type === 'folder' && isOpen && node.children && (
        <div className="ml-4">
          {node.children.map((child) => (
            <FileTreeNode key={child.id} node={child} onFileSelect={onFileSelect} disabled={disabled} />
          ))}
        </div>
      )}
    </div>
  );
}

export function FileExplorer({
  files,
  onFileSelect,
  loading = false,
  disabled = false,
}: FileExplorerProps) {
  if (loading) {
    return (
      <div className="p-4 text-sm text-zinc-400">
        <p>Loading files...</p>
      </div>
    );
  }

  if (!files || files.length === 0) {
    return (
      <div className="p-4 text-sm text-zinc-400">
        <p>No files found.</p>
      </div>
    );
  }

  return (
    <div className="p-2">
      <h2 className="text-lg font-semibold mb-2 flex items-center gap-2">
        <FolderIcon className="h-5 w-5 text-zinc-300" />
        File Explorer
      </h2>
      {files.map((file) => (
        <FileTreeNode key={file.id} node={file} onFileSelect={onFileSelect} disabled={disabled} />
      ))}
    </div>
  );
}
