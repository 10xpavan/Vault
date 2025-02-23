import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { Folder, Link, Tag } from "@shared/schema";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  ChevronRight,
  FolderPlus,
  Link as LinkIcon,
  Search,
  Share2,
  Tag as TagIcon,
  LogOut,
  Loader2,
  Moon,
  Sun,
  Folder as FolderIcon,
  ChevronLeft,
  Home
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { useTheme } from "@/hooks/use-theme";

export default function HomePage() {
  const { user, logoutMutation } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [currentFolderId, setCurrentFolderId] = useState<number | null>(null);

  const { data: folders = [] } = useQuery<Folder[]>({
    queryKey: ["folders"],
    queryFn: () => apiRequest("/folders")
  });

  const { data: links = [] } = useQuery<Link[]>({
    queryKey: ["links", currentFolderId],
    queryFn: () => apiRequest(`/links${currentFolderId ? `?folderId=${currentFolderId}` : ''}`)
  });

  const shareLinkMutation = useMutation({
    mutationFn: (linkId: number) => apiRequest(`/links/${linkId}/share`, { method: "POST" }),
    onSuccess: () => {
      toast({
        title: "Link shared!",
        description: "Anyone with the link can now view it."
      });
    }
  });

  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto p-4">
        <div className="flex flex-col space-y-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold">Bookmarks</h1>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" onClick={toggleTheme}>
                {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
              </Button>
              <Button variant="ghost" size="icon" onClick={() => logoutMutation.mutate()}>
                <LogOut className="h-5 w-5" />
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-[300px_1fr] gap-4">
            <div className="space-y-4">
              <Button className="w-full" onClick={() => setCurrentFolderId(null)}>
                <Home className="h-4 w-4 mr-2" />
                All Bookmarks
              </Button>
              <div className="space-y-2">
                {folders.map((folder) => (
                  <Button
                    key={folder.id}
                    variant="ghost"
                    className="w-full justify-start"
                    onClick={() => setCurrentFolderId(folder.id)}
                  >
                    <FolderIcon className="h-4 w-4 mr-2" />
                    {folder.name}
                  </Button>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="flex-1">
                  <Input
                    placeholder="Search links..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full"
                  />
                </div>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button>
                      <LinkIcon className="h-4 w-4 mr-2" />
                      Add Link
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add New Link</DialogTitle>
                    </DialogHeader>
                    {/* Add Link Form */}
                  </DialogContent>
                </Dialog>
              </div>

              <AnimatePresence>
                {links
                  .filter(link => 
                    link.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    link.url.toLowerCase().includes(searchQuery.toLowerCase())
                  )
                  .map((link) => (
                    <motion.div
                      key={link.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                    >
                      <Card>
                        <CardHeader>
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-3">
                              {link.favicon && (
                                <img src={link.favicon} alt="" className="w-4 h-4" />
                              )}
                              <div>
                                <CardTitle className="text-base">
                                  <a
                                    href={link.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="hover:underline"
                                  >
                                    {link.title}
                                  </a>
                                </CardTitle>
                                {link.description && (
                                  <CardDescription>
                                    {link.description}
                                  </CardDescription>
                                )}
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => shareLinkMutation.mutate(link.id)}
                            >
                              <Share2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </CardHeader>
                        {link.notes && (
                          <CardContent>
                            <p className="text-sm text-muted-foreground">
                              {link.notes}
                            </p>
                          </CardContent>
                        )}
                      </Card>
                    </motion.div>
                  ))}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}