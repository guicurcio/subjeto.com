import { ChevronRight, ChevronDown } from 'lucide-react'
import { useState } from 'react'
import { Button } from "@/components/ui/button"

interface SchemaField {
  name: string
  type: string
  constraints: string[]
}

interface Schema {
  name: string
  fields: SchemaField[]
}

interface SchemaViewerProps {
  schemas: Schema[]
}

export function SchemaViewer({ schemas }: SchemaViewerProps) {
  const [expandedSchemas, setExpandedSchemas] = useState<string[]>([])

  const toggleSchema = (schemaName: string) => {
    setExpandedSchemas(prev =>
      prev.includes(schemaName)
        ? prev.filter(name => name !== schemaName)
        : [...prev, schemaName]
    )
  }

  return (
    <div className="p-4">
      <h2 className="text-lg font-semibold mb-4">Database Schemas</h2>
      {schemas.map(schema => (
        <div key={schema.name} className="mb-4">
          <Button
            variant="ghost"
            className="w-full justify-start"
            onClick={() => toggleSchema(schema.name)}
          >
            {expandedSchemas.includes(schema.name) ? (
              <ChevronDown className="mr-2 h-4 w-4" />
            ) : (
              <ChevronRight className="mr-2 h-4 w-4" />
            )}
            {schema.name}
          </Button>
          {expandedSchemas.includes(schema.name) && (
            <div className="ml-6 mt-2">
              {schema.fields.map(field => (
                <div key={field.name} className="mb-2">
                  <span className="font-medium">{field.name}</span>:{' '}
                  <span className="text-zinc-400">{field.type}</span>
                  {field.constraints.length > 0 && (
                    <span className="text-zinc-500 text-sm ml-2">
                      ({field.constraints.join(', ')})
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

