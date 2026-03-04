import { StructureBuilder } from 'sanity/structure';
import {
  DocumentIcon,
  CogIcon,
  HomeIcon,
  TagIcon,
  ComponentIcon,
  BookIcon,
  UsersIcon,
} from '@sanity/icons';

// Marketing-friendly structure for the Studio sidebar
export const structure = (S: StructureBuilder) =>
  S.list()
    .title('Content')
    .items([
      // Homepage - Singleton
      S.listItem()
        .title('Homepage')
        .icon(HomeIcon)
        .child(
          S.document()
            .schemaType('homepage')
            .documentId('homepage')
            .title('Homepage')
        ),

      S.divider(),

      // Pages
      S.listItem()
        .title('Pages')
        .icon(DocumentIcon)
        .child(
          S.documentTypeList('page')
            .title('All Pages')
        ),

      // Products
      S.listItem()
        .title('Products')
        .icon(TagIcon)
        .child(
          S.documentTypeList('productPage')
            .title('Product Pages')
        ),

      // Services
      S.listItem()
        .title('Services')
        .icon(ComponentIcon)
        .child(
          S.documentTypeList('servicePage')
            .title('Service Pages')
        ),

      // Resources
      S.listItem()
        .title('Resources')
        .icon(BookIcon)
        .child(
          S.documentTypeList('resourcePage')
            .title('Resource Pages')
        ),

      S.divider(),

      // Testimonials
      S.listItem()
        .title('Testimonials')
        .icon(UsersIcon)
        .child(
          S.documentTypeList('testimonial')
            .title('Customer Testimonials')
        ),

      S.divider(),

      // Settings - Singleton
      S.listItem()
        .title('Site Settings')
        .icon(CogIcon)
        .child(
          S.document()
            .schemaType('siteSettings')
            .documentId('siteSettings')
            .title('Site Settings')
        ),
    ]);
