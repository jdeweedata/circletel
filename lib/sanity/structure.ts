// lib/sanity/structure.ts
import { StructureBuilder } from 'sanity/structure'

export const structure = (S: StructureBuilder) =>
  S.list()
    .title('Content')
    .items([
      // Singletons first
      S.listItem()
        .title('Site Settings')
        .id('siteSettings')
        .child(
          S.document()
            .schemaType('siteSettings')
            .documentId('siteSettings')
        ),
      S.listItem()
        .title('Homepage')
        .id('homepage')
        .child(
          S.document()
            .schemaType('homepage')
            .documentId('homepage')
        ),
      S.divider(),

      // Pages
      S.documentTypeListItem('page').title('Pages'),
      S.documentTypeListItem('productPage').title('Product Pages'),
      S.divider(),

      // Blog
      S.documentTypeListItem('post').title('Blog Posts'),
      S.documentTypeListItem('category').title('Categories'),
      S.divider(),

      // Marketing
      S.documentTypeListItem('campaign').title('Campaigns'),
      S.documentTypeListItem('resource').title('Resources'),
      S.divider(),

      // People
      S.documentTypeListItem('teamMember').title('Team'),
      S.documentTypeListItem('testimonial').title('Testimonials'),
    ])
