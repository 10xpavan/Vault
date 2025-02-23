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

  const { data: currentFolder } = useQuery<Folder>({
    queryKey: ["/api/folders", currentFolderId],
    enabled: currentFolderId !== null
  });

  const { data: folderPath = [] } = useQuery<Folder[]>({
    queryKey: ["/api/folders", currentFolderId, "path"],
    enabled: currentFolderId !== null
  });

  const { data: folders = [] } = useQuery<Folder[]>({
    queryKey: ["/api/folders", currentFolderId, "children"]
  });

  const { data: links = [] } = useQuery<Link[]>({
    queryKey: ["/api/links", currentFolderId, searchQuery]
  });

  const { data: tags = [] } = useQuery<Tag[]>({
    queryKey: ["/api/tags"]
  });

  const addFolderSchema = z.object({
    name: z.string().min(1, "Folder name is required")
  });

  const addLinkSchema = z.object({
    url: z.string().url("Please enter a valid URL"),
    notes: z.string().optional()
  });

  const addFolderForm = useForm({
    resolver: zodResolver(addFolderSchema),
    defaultValues: {
      name: ""
    }
  });

  const addLinkForm = useForm({
    resolver: zodResolver(addLinkSchema),
    defaultValues: {
      url: "",
      notes: ""
    }
  });

  const addFolderMutation = useMutation({
    mutationFn: async (data: z.infer<typeof addFolderSchema>) => {
      const res = await apiRequest("POST", "/api/folders", {
        ...data,
        parentId: currentFolderId
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/folders"] });
      toast({ title: "Folder created successfully" });
      addFolderForm.reset();
    }
  });

  const addLinkMutation = useMutation({
    mutationFn: async (data: z.infer<typeof addLinkSchema>) => {
      const res = await apiRequest("POST", "/api/links", {
        ...data,
        folderId: currentFolderId || folders[0]?.id
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/links"] });
      toast({ title: "Link added successfully" });
      addLinkForm.reset();
    }
  });

  const shareLinkMutation = useMutation({
    mutationFn: async (linkId: number) => {
      const res = await apiRequest("POST", `/api/links/${linkId}/share`);
      return res.json();
    },
    onSuccess: (data) => {
      const shareUrl = `${window.location.origin}/shared/${data.token}`;
      navigator.clipboard.writeText(shareUrl);
      toast({ title: "Share link copied to clipboard" });
    }
  });

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b p-4">
        <div className="container mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold">LinkVault</h1>
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={toggleTheme}>
              {theme === 'dark' ? (
                <Sun className="h-4 w-4" />
              ) : (
                <Moon className="h-4 w-4" />
              )}
            </Button>
            <span className="text-muted-foreground">{user?.email}</span>
            <Button variant="ghost" size="icon" onClick={() => logoutMutation.mutate()}>
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto p-4">
        <div className="grid grid-cols-1 md:grid-cols-[300px_1fr] gap-8">
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Folders</CardTitle>
              </CardHeader>
              <CardContent>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button className="w-full" variant="outline">
                      <FolderPlus className="h-4 w-4 mr-2" />
                      New Folder
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Create Folder</DialogTitle>
                    </DialogHeader>
                    <Form {...addFolderForm}>
                      <form onSubmit={addFolderForm.handleSubmit((data) => addFolderMutation.mutate({ ...data, parentId: currentFolderId }))}>
                        <div className="space-y-4">
                          <FormField
                            control={addFolderForm.control}
                            name="name"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Name</FormLabel>
                                <FormControl>
                                  <Input {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <div className="text-sm text-muted-foreground">
                            Creating folder in: {currentFolderId ? folderPath[folderPath.length - 1]?.name : 'Root'}
                          </div>
                        </div>
                        <Button type="submit" className="mt-4">Create</Button>
                      </form>
                    </Form>
                  </DialogContent>
                </Dialog>

                <ScrollArea className="h-[calc(100vh-300px)] mt-4">
                  <div className="space-y-1">
                    <div className="flex items-center mb-4 px-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setCurrentFolderId(folderPath[folderPath.length - 2]?.id || null)}
                        disabled={!currentFolderId}
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <div className="flex items-center mx-2 text-sm text-muted-foreground">
                        {currentFolderId ? folderPath.map((folder, i) => (
                          <div key={folder.id} className="flex items-center">
                            {i > 0 && <ChevronRight className="h-4 w-4 mx-1" />}
                            <span 
                              className="hover:underline cursor-pointer" 
                              onClick={() => setCurrentFolderId(folder.id)}
                            >
                              {folder.name}
                            </span>
                          </div>
                        )) : 'Home'}
                      </div>
                    </div>
                    <div className="grid grid-cols-1 gap-2">
                      {folders.map((folder) => (
                        <div
                          key={folder.id}
                          className={`flex items-center p-2 hover:bg-muted rounded-md cursor-pointer ${folder.parentId ? 'ml-4 border-l-2 pl-2' : ''}`}
                          onClick={() => setCurrentFolderId(folder.id)}
                        >
                          <FolderIcon className="h-4 w-4 mr-2 text-yellow-500" />
                          {folder.name}
                        </div>
                      ))}
                      {links.map((link) => (
                        <a
                          key={link.id}
                          href={link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center p-2 hover:bg-muted rounded-md"
                        >
                          {link.favicon ? (
                            <img src={link.favicon} className="h-4 w-4 mr-2" alt="" />
                          ) : (
                            <LinkIcon className="h-4 w-4 mr-2" />
                          )}
                          {link.title}
                        </a>
                      ))}
                    </div>
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Tags</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {tags.map((tag) => (
                    <Button key={tag.id} variant="outline" size="sm">
                      <TagIcon className="h-3 w-3 mr-1" />
                      {tag.name}
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
        <div className="flex-1 p-6"> {/* Added to create the right-hand panel */}
          <div className="space-y-4">
            <div className="flex items-center justify-between"> {/* Adjusted to justify-between */}
              <div className="flex items-center gap-2">
                {currentFolderId && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setCurrentFolderId(folderPath[folderPath.length - 2]?.id || null)}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                )}
                <div className="flex items-center gap-2">
                  {folderPath.map((folder, index) => (
                    <div key={folder.id} className="flex items-center">
                      {index > 0 && <ChevronRight className="h-4 w-4 mx-1" />}
                      <Button
                        variant="ghost"
                        onClick={() => setCurrentFolderId(folder.id)}
                      >
                        {folder.name}
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
              <Dialog> {/* Moved Add Link button to the right */}
                <DialogTrigger asChild>
                  <Button>
                    <LinkIcon className="h-4 w-4 mr-2" />
                    Add Link
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add Link</DialogTitle>
                  </DialogHeader>
                  <Form {...addLinkForm}>
                    <form onSubmit={addLinkForm.handleSubmit((data) => addLinkMutation.mutate(data))}>
                      <div className="space-y-4">
                        <FormField
                          control={addLinkForm.control}
                          name="url"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>URL</FormLabel>
                              <FormControl>
                                <Input {...field} placeholder="https://example.com" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={addLinkForm.control}
                          name="notes"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Notes (optional)</FormLabel>
                              <FormControl>
                                <Input {...field} placeholder="Add any notes about this link" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <Button
                          type="submit"
                          disabled={addLinkMutation.isPending}
                        >
                          {addLinkMutation.isPending ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Adding...
                            </>
                          ) : (
                            'Add Link'
                          )}
                        </Button>
                      </div>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  className="pl-9 w-full"
                  placeholder="Search links..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            <AnimatePresence>
              {links.map((link) => (
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
      </main>
    </div>
  );
}