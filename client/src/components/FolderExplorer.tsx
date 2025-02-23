
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  FolderIcon, 
  ChevronRight, 
  ChevronDown, 
  Plus,
  Search,
  Link as LinkIcon
} from "lucide-react";

interface FolderProps {
  folder: {
    id: number;
    name: string;
    children?: FolderProps["folder"][];
  };
  level: number;
  currentFolderId: number | null;
  onFolderClick: (id: number) => void;
}

const FolderItem = ({ folder, level, currentFolderId, onFolderClick }: FolderProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const hasChildren = folder.children && folder.children.length > 0;

  return (
    <div className="w-full">
      <div 
        className={`
          flex items-center p-2 rounded-md cursor-pointer
          hover:bg-gray-100 transition-colors
          ${currentFolderId === folder.id ? 'bg-gray-100' : ''}
        `}
        style={{ paddingLeft: `${level * 12 + 8}px` }}
        onClick={() => {
          onFolderClick(folder.id);
          setIsOpen(!isOpen);
        }}
      >
        {hasChildren ? (
          <div className="w-4 h-4 mr-1 text-gray-500">
            {isOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </div>
        ) : (
          <div className="w-4 h-4 mr-1" />
        )}
        <FolderIcon className="w-4 h-4 mr-2 text-yellow-400" />
        <span className="text-sm font-medium text-gray-700">{folder.name}</span>
      </div>
      {hasChildren && isOpen && (
        <div className="ml-2">
          {folder.children.map((child) => (
            <FolderItem
              key={child.id}
              folder={child}
              level={level + 1}
              currentFolderId={currentFolderId}
              onFolderClick={onFolderClick}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export function FolderExplorer({
  folders,
  currentFolderId,
  onFolderSelect,
  onAddFolder,
  onAddLink,
  onSearch
}: {
  folders: FolderProps["folder"][];
  currentFolderId: number | null;
  onFolderSelect: (id: number) => void;
  onAddFolder: () => void;
  onAddLink: () => void;
  onSearch: (query: string) => void;
}) {
  return (
    <div className="h-full flex flex-col md:flex-row bg-white rounded-lg shadow-sm">
      {/* Sidebar */}
      <div className="w-full md:w-64 border-r border-gray-100 flex flex-col">
        <div className="p-4 border-b border-gray-100">
          <Button 
            variant="outline" 
            className="w-full justify-start" 
            onClick={onAddFolder}
          >
            <Plus className="w-4 h-4 mr-2" />
            New Folder
          </Button>
        </div>
        <ScrollArea className="flex-1 p-2">
          {folders.map((folder) => (
            <FolderItem
              key={folder.id}
              folder={folder}
              level={0}
              currentFolderId={currentFolderId}
              onFolderClick={onFolderSelect}
            />
          ))}
        </ScrollArea>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-4 space-y-4">
        <div className="flex items-center gap-2">
          <div className="flex-1">
            <Input
              placeholder="Search links..."
              onChange={(e) => onSearch(e.target.value)}
              className="bg-gray-50"
            />
          </div>
          <Button onClick={onAddLink}>
            <LinkIcon className="w-4 h-4 mr-2" />
            Add Link
          </Button>
        </div>
      </div>
    </div>
  );
}
