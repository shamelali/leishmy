"use client";

import { useState, useEffect } from "react";
import { Image as ImageIcon, Calendar, FileText, Tag, ExternalLink, Trash2, Eye } from "lucide-react";
import { DashboardLoading } from "@/components/DashboardLoading";

interface Service {
  id: string;
  name: string;
  price: string;
  category: string;
  duration: string;
  artistName: string;
}

interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  icon: string;
}

interface Event {
  id: string;
  title: string;
  date: string;
  location: string;
  category: string;
  status: string;
}

interface BlogPost {
  id: string;
  title: string;
  author: string;
  tags: string[];
  status: string;
  publishedAt: string;
}

export default function ContentPage() {
  const [activeTab, setActiveTab] = useState<"services" | "categories" | "events" | "blog">("services");
  const [loading, setLoading] = useState(true);

  const [services, setServices] = useState<Service[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [blogPosts, setBlogPosts] = useState<BlogPost[]>([]);

  useEffect(() => {
    async function fetchAll() {
      setLoading(true);
      try {
        const [artistRes, eventRes, blogRes, catRes] = await Promise.allSettled([
          fetch("/api/admin?action=artists&page=1&pageSize=100"),
          fetch("/api/events?admin=true"),
          fetch("/api/blog"),
          fetch("/api/categories"),
        ]);

        if (artistRes.status === "fulfilled" && artistRes.value.ok) {
          const data = await artistRes.value.json();
          const allServices: Service[] = [];
          const artists = data.artists || [];
          for (const artist of artists) {
            if (artist.services && Array.isArray(artist.services)) {
              for (const svc of artist.services) {
                allServices.push({
                  id: svc.id || `${artist.id}-${svc.name}`,
                  name: svc.name || "Untitled",
                  price: svc.price || "—",
                  category: svc.category || "—",
                  duration: svc.duration || "—",
                  artistName: artist.name || "Unknown",
                });
              }
            }
          }
          setServices(allServices);
        }

        if (eventRes.status === "fulfilled" && eventRes.value.ok) {
          const data = await eventRes.value.json();
          setEvents(data.events || data || []);
        }

        if (blogRes.status === "fulfilled" && blogRes.value.ok) {
          const data = await blogRes.value.json();
          setBlogPosts(data.posts || data || []);
        }

        if (catRes.status === "fulfilled" && catRes.value.ok) {
          const data = await catRes.value.json();
          setCategories(data.categories || data || []);
        }
      } catch {
        // silent
      } finally {
        setLoading(false);
      }
    }
    fetchAll();
  }, []);

  if (loading) return <DashboardLoading fullPage />;

  const tabs = [
    { id: "services" as const, label: "Services", icon: ImageIcon, count: services.length },
    { id: "categories" as const, label: "Categories", icon: Tag, count: categories.length },
    { id: "events" as const, label: "Events", icon: Calendar, count: events.length },
    { id: "blog" as const, label: "Blog Posts", icon: FileText, count: blogPosts.length },
  ];

  return (
    <div className="min-h-screen bg-gray-50/50 dark:bg-neutral-950">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <ImageIcon className="w-7 h-7 text-rose-500" />
          <div className="mt-1">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Listings & Content</h1>
            <p className="text-sm text-gray-500">Manage services, categories, events, and blog posts</p>
          </div>
        </div>

        <div className="flex gap-2 mb-6 border-b border-gray-200 dark:border-neutral-700">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors flex items-center gap-1.5 ${
                activeTab === tab.id
                  ? "bg-rose-500 text-white"
                  : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-neutral-800"
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
              <span className={`ml-1 text-xs px-1.5 py-0.5 rounded-full ${
                activeTab === tab.id ? "bg-white/20" : "bg-gray-200 dark:bg-neutral-700"
              }`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {activeTab === "services" && (
          <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-gray-100 dark:border-neutral-800 overflow-hidden">
            {services.length === 0 ? (
              <div className="text-center py-16">
                <ImageIcon className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">No services found</h3>
                <p className="text-sm text-gray-500">Services will appear here once artists add them.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 dark:border-neutral-800 text-left text-gray-500 dark:text-gray-400">
                      <th className="px-4 py-3 font-medium">Service Name</th>
                      <th className="px-4 py-3 font-medium">Artist/Studio</th>
                      <th className="px-4 py-3 font-medium">Price</th>
                      <th className="px-4 py-3 font-medium">Category</th>
                      <th className="px-4 py-3 font-medium">Duration</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-neutral-800">
                    {services.map((svc) => (
                      <tr key={svc.id} className="hover:bg-gray-50 dark:hover:bg-neutral-800/50 transition-colors">
                        <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">{svc.name}</td>
                        <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{svc.artistName}</td>
                        <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{svc.price}</td>
                        <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{svc.category}</td>
                        <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{svc.duration}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {activeTab === "categories" && (
          <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-gray-100 dark:border-neutral-800 overflow-hidden">
            {categories.length === 0 ? (
              <div className="text-center py-16">
                <Tag className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">No categories found</h3>
                <p className="text-sm text-gray-500">Categories will appear here once configured.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 dark:border-neutral-800 text-left text-gray-500 dark:text-gray-400">
                      <th className="px-4 py-3 font-medium">Name</th>
                      <th className="px-4 py-3 font-medium">Slug</th>
                      <th className="px-4 py-3 font-medium">Description</th>
                      <th className="px-4 py-3 font-medium">Icon</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-neutral-800">
                    {categories.map((cat) => (
                      <tr key={cat.id} className="hover:bg-gray-50 dark:hover:bg-neutral-800/50 transition-colors">
                        <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">{cat.name}</td>
                        <td className="px-4 py-3 text-gray-600 dark:text-gray-400 font-mono text-xs">{cat.slug}</td>
                        <td className="px-4 py-3 text-gray-600 dark:text-gray-400 max-w-xs truncate">{cat.description || "—"}</td>
                        <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{cat.icon || "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {activeTab === "events" && (
          <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-gray-100 dark:border-neutral-800 overflow-hidden">
            {events.length === 0 ? (
              <div className="text-center py-16">
                <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">No events found</h3>
                <p className="text-sm text-gray-500">Events will appear here once created.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 dark:border-neutral-800 text-left text-gray-500 dark:text-gray-400">
                      <th className="px-4 py-3 font-medium">Title</th>
                      <th className="px-4 py-3 font-medium">Date</th>
                      <th className="px-4 py-3 font-medium">Location</th>
                      <th className="px-4 py-3 font-medium">Category</th>
                      <th className="px-4 py-3 font-medium">Status</th>
                      <th className="px-4 py-3 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-neutral-800">
                    {events.map((evt) => (
                      <tr key={evt.id} className="hover:bg-gray-50 dark:hover:bg-neutral-800/50 transition-colors">
                        <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">{evt.title}</td>
                        <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                          {evt.date ? new Date(evt.date).toLocaleDateString("en-MY", { day: "numeric", month: "short", year: "numeric" }) : "—"}
                        </td>
                        <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{evt.location || "—"}</td>
                        <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{evt.category || "—"}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                            evt.status === "published" || evt.status === "Published"
                              ? "bg-green-50 text-green-600 dark:bg-green-950/30 dark:text-green-400"
                              : "bg-gray-100 text-gray-600 dark:bg-neutral-800 dark:text-gray-400"
                          }`}>
                            {evt.status || "Draft"}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1">
                            <button className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-neutral-800 transition-colors">
                              <Eye className="w-4 h-4" />
                            </button>
                            <button className="p-1.5 text-gray-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {activeTab === "blog" && (
          <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-gray-100 dark:border-neutral-800 overflow-hidden">
            {blogPosts.length === 0 ? (
              <div className="text-center py-16">
                <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">No blog posts found</h3>
                <p className="text-sm text-gray-500">Blog posts will appear here once published.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 dark:border-neutral-800 text-left text-gray-500 dark:text-gray-400">
                      <th className="px-4 py-3 font-medium">Title</th>
                      <th className="px-4 py-3 font-medium">Author</th>
                      <th className="px-4 py-3 font-medium">Tags</th>
                      <th className="px-4 py-3 font-medium">Status</th>
                      <th className="px-4 py-3 font-medium">Published Date</th>
                      <th className="px-4 py-3 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-neutral-800">
                    {blogPosts.map((post) => (
                      <tr key={post.id} className="hover:bg-gray-50 dark:hover:bg-neutral-800/50 transition-colors">
                        <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">{post.title}</td>
                        <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{post.author || "—"}</td>
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap gap-1">
                            {(post.tags || []).slice(0, 3).map((tag) => (
                              <span key={tag} className="inline-flex items-center px-1.5 py-0.5 rounded text-xs bg-gray-100 dark:bg-neutral-800 text-gray-600 dark:text-gray-400">
                                {tag}
                              </span>
                            ))}
                            {(post.tags || []).length > 3 && (
                              <span className="text-xs text-gray-400">+{post.tags.length - 3}</span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                            post.status === "published" || post.status === "Published"
                              ? "bg-green-50 text-green-600 dark:bg-green-950/30 dark:text-green-400"
                              : "bg-gray-100 text-gray-600 dark:bg-neutral-800 dark:text-gray-400"
                          }`}>
                            {post.status || "Draft"}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                          {post.publishedAt
                            ? new Date(post.publishedAt).toLocaleDateString("en-MY", { day: "numeric", month: "short", year: "numeric" })
                            : "—"}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1">
                            <button className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-neutral-800 transition-colors">
                              <Eye className="w-4 h-4" />
                            </button>
                            <button className="p-1.5 text-gray-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
