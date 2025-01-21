export interface Tab {
  id: string
  title: string
  type: 'text' | 'code' | 'draw' | 'database' | 'graphql'
  content: string
}

export interface SidebarSection {
  name: string
  items: {
    id: string
    name: string
    icon?: string
  }[]
}

export interface File {
  id: string
  name: string
  content: string
  type: 'text' | 'code' | 'draw' | 'database' | 'graphql'
}

export interface SchemaField {
  name: string
  type: string
  constraints: string[]
}

export interface Schema {
  name: string
  fields: SchemaField[]
}

export interface FileNode {
  id: string
  name: string
  type: 'file' | 'folder'
  children?: FileNode[]
}

export interface GraphQLType {
  name: string
  kind: 'OBJECT' | 'SCALAR' | 'ENUM' | 'INPUT_OBJECT' | 'INTERFACE' | 'UNION'
  fields?: { name: string; type: string }[]
  enumValues?: string[]
}

