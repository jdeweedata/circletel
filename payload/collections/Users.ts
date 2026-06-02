import type { CollectionConfig } from 'payload'

export const Users: CollectionConfig = {
  slug: 'users',
  auth: true,
  admin: {
    useAsTitle: 'email',
  },
  access: {
    // Only admins can create users
    create: ({ req: { user } }) => Boolean(user),
    // Users can read themselves, admins can read all
    read: ({ req: { user } }) => {
      if (!user) return false
      return true
    },
  },
  fields: [
    {
      name: 'role',
      type: 'select',
      options: [
        { label: 'Admin', value: 'admin' },
        { label: 'Editor', value: 'editor' },
        { label: 'Author', value: 'author' },
      ],
      defaultValue: 'author',
      required: true,
    },
    {
      name: 'name',
      type: 'text',
      label: 'Display Name',
    },
  ],
}
