"use client";

import React, { useState, useEffect, useCallback } from "react";
import { motion } from "motion/react";
import {
  FileText, Plus, Pencil, Trash2, Search, ToggleLeft, ToggleRight,
  X, Save, Eye, Calendar, User
} from "lucide-react";

interface BlogPostItem {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  author: string;
  authorBio: string | null;
  authorImage: string | null;
  publishedAt: string | null;
  tags: string;
  featuredImage: string | null;
  seoTitle: string | null;
  seoDescription: string | null;
  status: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface BlogForm {
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  author: string;
  authorBio: string;
  authorImage: string;
  tags: string;
  featuredImage: string;
  seoTitle: string;
  seoDescription: string;
  status: string;
}

const EMPTY_FORM: BlogForm = {
  title: "",
  slug: "",
  content: "",
  excerpt: "",
  author: "GoRASA Team",
  authorBio: "",
  authorImage: "",
  tags: "[]",
  featuredImage: "",
  seoTitle: "",
  seoDescription: "",
  status: "DRAFT",
};

export default function AdminBlogPage() {
  const [posts, setPosts] = useState<BlogPostItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<BlogForm>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const fetchPosts = useCallback(async () => {
    try {
      const res = await fetch("/api/blog?limit=100");
      const data = await res.json();
      setPosts(data.posts || []);
    } catch {
      setPosts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchPosts(); }, [fetchPosts]);

  const filtered = search.trim()
    ? posts.filter((p) =>
        p.title.toLowerCase().includes(search.toLowerCase()) ||
        p.slug.toLowerCase().includes(search.toLowerCase()) ||
        p.author.toLowerCase().includes(search.toLowerCase())
      )
    : posts;

  const openCreate = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setShowForm(true);
  };

  const openEdit = (post: BlogPostItem) => {
    setEditingId(post.id);
    setForm({
      title: post.title,
      slug: post.slug,
      content: "",
      excerpt: post.excerpt || "",
      author: post.author,
      authorBio: post.authorBio || "",
      authorImage: post.authorImage || "",
      tags: post.tags,
      featuredImage: post.featuredImage || "",
      seoTitle: post.seoTitle || "",
      seoDescription: post.seoDescription || "",
      status: post.status,
    });
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.title || !form.slug) return;
    setSaving(true);
    try {
      const url = editingId ? `/api/blog/${form.slug}` : "/api/blog";
      const method = editingId ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        setShowForm(false);
        fetchPosts();
      }
    } finally {
      setSaving(false);
    }
  };

  const toggleStatus = async (post: BlogPostItem) => {
    const newStatus = post.status === "PUBLISHED" ? "DRAFT" : "PUBLISHED";
    await fetch(`/api/blog/${post.slug}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    fetchPosts();
  };

  const handleDelete = async (post: BlogPostItem) => {
    if (!confirm(`Delete "${post.title}"?`)) return;
    await fetch(`/api/blog/${post.slug}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: false }),
    });
    fetchPosts();
  };

  const generateSlug = (title: string) => {
    return title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-saffron" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-brand-charcoal">Blog Posts</h1>
          <p className="text-sm text-brand-charcoal/50">{posts.length} total posts</p>
        </div>
        <button onClick={openCreate} className="px-4 py-2 bg-brand-antique-gold text-white rounded-lg font-semibold hover:bg-brand-dark-gold transition-colors flex items-center gap-2">
          <Plus size={16} /> New Post
        </button>
      </div>

      <div className="relative">
        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search posts..."
          className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-antique-gold outline-none"
        />
      </div>

      <div className="grid gap-4">
        {filtered.map((post) => (
          <motion.div
            key={post.id}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl border border-slate-100 p-4 flex items-center gap-4"
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-semibold text-brand-charcoal truncate">{post.title}</h3>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${post.status === "PUBLISHED" ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"}`}>
                  {post.status}
                </span>
              </div>
              <div className="flex items-center gap-3 text-xs text-brand-charcoal/50">
                <span>/blog/{post.slug}</span>
                <span className="flex items-center gap-1"><User size={10} /> {post.author}</span>
                {post.publishedAt && (
                  <span className="flex items-center gap-1">
                    <Calendar size={10} />
                    {new Date(post.publishedAt).toLocaleDateString("en-IN")}
                  </span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => toggleStatus(post)}
                className="p-2 rounded-lg hover:bg-brand-ivory transition-colors"
                title={post.status === "PUBLISHED" ? "Unpublish" : "Publish"}
              >
                {post.status === "PUBLISHED" ? <ToggleRight size={20} className="text-green-600" /> : <ToggleLeft size={20} className="text-slate-600" />}
              </button>
              <button onClick={() => openEdit(post)} className="p-2 rounded-lg hover:bg-brand-ivory transition-colors" title="Edit">
                <Pencil size={16} className="text-brand-charcoal/60" />
              </button>
              <a href={`/blog/${post.slug}`} target="_blank" rel="noopener noreferrer" className="p-2 rounded-lg hover:bg-brand-ivory transition-colors" title="View">
                <Eye size={16} className="text-brand-charcoal/60" />
              </a>
              <button onClick={() => handleDelete(post)} className="p-2 rounded-lg hover:bg-red-50 transition-colors" title="Delete">
                <Trash2 size={16} className="text-red-500" />
              </button>
            </div>
          </motion.div>
        ))}
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto p-6"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-brand-charcoal">
                {editingId ? "Edit Blog Post" : "New Blog Post"}
              </h2>
              <button onClick={() => setShowForm(false)} className="p-2 rounded-lg hover:bg-brand-ivory">
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-brand-charcoal mb-1">Title *</label>
                  <input
                    type="text"
                    value={form.title}
                    onChange={(e) => {
                      setForm({ ...form, title: e.target.value, slug: editingId ? form.slug : generateSlug(e.target.value) });
                    }}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-brand-antique-gold outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-brand-charcoal mb-1">Slug *</label>
                  <input
                    type="text"
                    value={form.slug}
                    onChange={(e) => setForm({ ...form, slug: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-brand-antique-gold outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-brand-charcoal mb-1">Excerpt</label>
                <textarea
                  value={form.excerpt}
                  onChange={(e) => setForm({ ...form, excerpt: e.target.value })}
                  rows={2}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-brand-antique-gold outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-brand-charcoal mb-1">Content (HTML) *</label>
                <textarea
                  value={form.content}
                  onChange={(e) => setForm({ ...form, content: e.target.value })}
                  rows={10}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm font-mono focus:ring-2 focus:ring-brand-antique-gold outline-none"
                />
              </div>

              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-brand-charcoal mb-1">Author</label>
                  <input type="text" value={form.author} onChange={(e) => setForm({ ...form, author: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-brand-charcoal mb-1">Author Bio</label>
                  <input type="text" value={form.authorBio} onChange={(e) => setForm({ ...form, authorBio: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-brand-charcoal mb-1">Author Image URL</label>
                  <input type="text" value={form.authorImage} onChange={(e) => setForm({ ...form, authorImage: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-brand-charcoal mb-1">Featured Image URL</label>
                  <input type="text" value={form.featuredImage} onChange={(e) => setForm({ ...form, featuredImage: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-brand-charcoal mb-1">Tags (JSON array)</label>
                  <input type="text" value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm font-mono" />
                </div>
              </div>

              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-brand-charcoal mb-1">SEO Title</label>
                  <input type="text" value={form.seoTitle} onChange={(e) => setForm({ ...form, seoTitle: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-brand-charcoal mb-1">SEO Description</label>
                  <input type="text" value={form.seoDescription} onChange={(e) => setForm({ ...form, seoDescription: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-brand-charcoal mb-1">Status</label>
                  <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm">
                    <option value="DRAFT">Draft</option>
                    <option value="PUBLISHED">Published</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-100">
              <button onClick={() => setShowForm(false)} className="px-4 py-2 border border-slate-200 rounded-lg text-sm hover:bg-brand-ivory transition-colors">
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving || !form.title || !form.slug}
                className="px-6 py-2 bg-brand-antique-gold text-white rounded-lg font-semibold hover:bg-brand-dark-gold transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                <Save size={16} /> {saving ? "Saving..." : "Save"}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
