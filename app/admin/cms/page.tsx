'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Plus, ExternalLink, Edit, Trash2, RefreshCw } from 'lucide-react'
import { useBlogPosts, usePages, useProducts } from '@/hooks/use-strapi'
import { formatDistanceToNow } from 'date-fns'

export default function CMSManagementPage() {
  const [activeTab, setActiveTab] = useState('blog-posts')

  const { data: blogPosts, isLoading: blogLoading, refetch: refetchBlog } = useBlogPosts()
  const { data: pages, isLoading: pagesLoading, refetch: refetchPages } = usePages()
  const { data: products, isLoading: productsLoading, refetch: refetchProducts } = useProducts()

  const handleRefresh = () => {
    switch (activeTab) {
      case 'blog-posts':
        refetchBlog()
        break
      case 'pages':
        refetchPages()
        break
      case 'products':
        refetchProducts()
        break
    }
  }

  const openStrapiAdmin = () => {
    window.open(process.env.NEXT_PUBLIC_STRAPI_URL + '/admin', '_blank')
  }

  return (
    <div className="container mx-auto p-6 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">CMS Management</h1>
          <p className="text-muted-foreground">
            Manage your Strapi content from within your admin panel
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleRefresh} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={openStrapiAdmin} size="sm">
            <ExternalLink className="h-4 w-4 mr-2" />
            Open Strapi Admin
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Content Overview</CardTitle>
          <CardDescription>
            Quick stats from your Strapi CMS
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-blue-600">
                {Array.isArray(blogPosts?.data) ? blogPosts.data.length : 0}
              </div>
              <div className="text-sm text-muted-foreground">Blog Posts</div>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {Array.isArray(pages?.data) ? pages.data.length : 0}
              </div>
              <div className="text-sm text-muted-foreground">Pages</div>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-purple-600">
                {Array.isArray(products?.data) ? products.data.length : 0}
              </div>
              <div className="text-sm text-muted-foreground">Products</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="blog-posts">Blog Posts</TabsTrigger>
          <TabsTrigger value="pages">Pages</TabsTrigger>
          <TabsTrigger value="products">Products</TabsTrigger>
        </TabsList>

        <TabsContent value="blog-posts" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Blog Posts</h2>
            <Button onClick={openStrapiAdmin} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add New Post
            </Button>
          </div>

          {blogLoading ? (
            <div className="text-center py-8">Loading blog posts...</div>
          ) : (
            <div className="grid gap-4">
              {Array.isArray(blogPosts?.data) && blogPosts.data.length > 0 ? (
                blogPosts.data.map((post) => (
                  <Card key={post.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h3 className="font-medium">{post.title}</h3>
                          <p className="text-sm text-muted-foreground">
                            {post.excerpt || 'No excerpt available'}
                          </p>
                          <div className="flex items-center gap-2 mt-2">
                            <Badge variant="secondary">
                              {post.publishedAt ? 'Published' : 'Draft'}
                            </Badge>
                            {post.publishedAt && (
                              <span className="text-xs text-muted-foreground">
                                {formatDistanceToNow(new Date(post.publishedAt), { addSuffix: true })}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" onClick={openStrapiAdmin}>
                            <Edit className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <Card>
                  <CardContent className="p-8 text-center">
                    <p className="text-muted-foreground">No blog posts found.</p>
                    <Button onClick={openStrapiAdmin} className="mt-4">
                      Create Your First Post
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </TabsContent>

        <TabsContent value="pages" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Pages</h2>
            <Button onClick={openStrapiAdmin} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add New Page
            </Button>
          </div>

          {pagesLoading ? (
            <div className="text-center py-8">Loading pages...</div>
          ) : (
            <div className="grid gap-4">
              {Array.isArray(pages?.data) && pages.data.length > 0 ? (
                pages.data.map((page) => (
                  <Card key={page.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h3 className="font-medium">{page.title}</h3>
                          <p className="text-sm text-muted-foreground">/{page.slug}</p>
                          <div className="flex items-center gap-2 mt-2">
                            <Badge variant="secondary">
                              {page.publishedAt ? 'Published' : 'Draft'}
                            </Badge>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" onClick={openStrapiAdmin}>
                            <Edit className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <Card>
                  <CardContent className="p-8 text-center">
                    <p className="text-muted-foreground">No pages found.</p>
                    <Button onClick={openStrapiAdmin} className="mt-4">
                      Create Your First Page
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </TabsContent>

        <TabsContent value="products" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Products</h2>
            <Button onClick={openStrapiAdmin} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add New Product
            </Button>
          </div>

          {productsLoading ? (
            <div className="text-center py-8">Loading products...</div>
          ) : (
            <div className="grid gap-4">
              {Array.isArray(products?.data) && products.data.length > 0 ? (
                products.data.map((product) => (
                  <Card key={product.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h3 className="font-medium">{product.name}</h3>
                          <p className="text-sm text-muted-foreground">
                            {product.description}
                          </p>
                          <div className="flex items-center gap-2 mt-2">
                            <Badge variant="secondary">
                              ${product.price}
                            </Badge>
                            <Badge variant={product.inStock ? "default" : "destructive"}>
                              {product.inStock ? 'In Stock' : 'Out of Stock'}
                            </Badge>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" onClick={openStrapiAdmin}>
                            <Edit className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <Card>
                  <CardContent className="p-8 text-center">
                    <p className="text-muted-foreground">No products found.</p>
                    <Button onClick={openStrapiAdmin} className="mt-4">
                      Create Your First Product
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}