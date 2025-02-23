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
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  FolderPlus, 
  Link as LinkIcon, 
  Search, 
  Share2, 
  Tag as TagIcon,
  LogOut 
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/hooks/use-toast";

export default function HomePage() {
  const { user, logoutMutation } = useAuth();
  const { toast } = useToast();

  const { data: folders = [] } = useQuery<Folder[]>({
    queryKey: ["/api/folders"]
  });

  const { data: links = [] } = useQuery<Link[]>({
    queryKey: ["/api/links"]
  });

  const { data: tags = [] } = useQuery<Tag[]>({
    queryKey: ["/api/tags"]
  });

  const addLinkForm = useForm({
    resolver: zodResolver(z.object({
      url: z.string().url(),
      folderId: z.number(),
      notes: z.string().optional()
    }))
  });

  const addFolderForm = useForm({
    resolver: zodResolver(z.object({
      name: z.string().min(1)
    }))
  });

  const addLinkMutation = useMutation({
    mutationFn: async (data: z.infer<typeof addLinkForm.formState.resolver>) => {
      const res = await apiRequest("POST", "/api/links", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/links"] });
      toast({ title: "Link added successfully" });
    }
  });

  const addFolderMutation = useMutation({
    mutationFn: async (data: z.infer<typeof addFolderForm.formState.resolver>) => {
      const res = await apiRequest("POST", "/api/folders", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/folders"] });
      toast({ title: "Folder created successfully" });
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
            <span className="text-muted-foreground">{user?.username}</span>
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
                      <form onSubmit={addFolderForm.handleSubmit((data) => addFolderMutation.mutate(data))}>
                        <FormField
                          control={addFolderForm.control}
                          name="name"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Name</FormLabel>
                              <FormControl>
                                <Input {...field} />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                        <Button type="submit" className="mt-4">Create</Button>
                      </form>
                    </Form>
                  </DialogContent>
                </Dialog>

                <ScrollArea className="h-[300px] mt-4">
                  <div className="space-y-2">
                    {folders.map((folder) => (
                      <Button
                        key={folder.id}
                        variant="ghost"
                        className="w-full justify-start"
                      >
                        {folder.name}
                      </Button>
                    ))}
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

          <div className="space-y-4">
            <div className="flex gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input className="pl-9" placeholder="Search links..." />
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
                                <Input {...field} />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={addLinkForm.control}
                          name="folderId"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Folder</FormLabel>
                              <FormControl>
                                <select 
                                  className="w-full p-2 rounded-md border"
                                  {...field}
                                  onChange={(e) => field.onChange(Number(e.target.value))}
                                >
                                  {folders.map((folder) => (
                                    <option key={folder.id} value={folder.id}>
                                      {folder.name}
                                    </option>
                                  ))}
                                </select>
                              </FormControl>
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={addLinkForm.control}
                          name="notes"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Notes</FormLabel>
                              <FormControl>
                                <Input {...field} />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                        <Button type="submit">Add Link</Button>
                      </div>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
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
