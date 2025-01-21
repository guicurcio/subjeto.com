import { useState } from 'react'
import { ChevronRight, ChevronDown } from 'lucide-react'
import { Button } from "@/components/ui/button"

interface GraphQLType {
  name: string
  kind: 'OBJECT' | 'SCALAR' | 'ENUM' | 'INPUT_OBJECT' | 'INTERFACE' | 'UNION'
  fields?: { name: string; type: string }[]
  enumValues?: string[]
}

interface GraphQLSchemaViewerProps {
  schema: GraphQLType[]
}

export function GraphQLSchemaViewer({ schema }: GraphQLSchemaViewerProps) {
  const [expandedTypes, setExpandedTypes] = useState<string[]>([])

  const toggleType = (typeName: string) => {
    setExpandedTypes(prev =>
      prev.includes(typeName)
        ? prev.filter(name => name !== typeName)
        : [...prev, typeName]
    )
  }

  return (
    <div className="p-4">
      <h2 className="text-lg font-semibold mb-4">GraphQL Schema</h2>
      {schema.map(type => (
        <div key={type.name} className="mb-4">
          <Button
            variant="ghost"
            className="w-full justify-start"
            onClick={() => toggleType(type.name)}
          >
            {expandedTypes.includes(type.name) ? (
              <ChevronDown className="mr-2 h-4 w-4" />
            ) : (
              <ChevronRight className="mr-2 h-4 w-4" />
            )}
            {type.name} <span className="ml-2 text-zinc-500">({type.kind})</span>
          </Button>
          {expandedTypes.includes(type.name) && (
            <div className="ml-6 mt-2">
              {type.fields && type.fields.map(field => (
                <div key={field.name} className="mb-2">
                  <span className="font-medium">{field.name}</span>:{' '}
                  <span className="text-zinc-400">{field.type}</span>
                </div>
              ))}
              {type.enumValues && (
                <div className="mb-2">
                  <span className="font-medium">Enum Values:</span>{' '}
                  <span className="text-zinc-400">{type.enumValues.join(', ')}</span>
                </div>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

