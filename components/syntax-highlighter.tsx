'use client'

import { useEffect } from 'react'
import Prism from 'prismjs'
import 'prismjs/themes/prism-tomorrow.css'
import 'prismjs/components/prism-javascript'
import 'prismjs/components/prism-jsx'
import 'prismjs/components/prism-typescript'
import 'prismjs/components/prism-tsx'
import 'prismjs/components/prism-graphql'
import 'prismjs/components/prism-json'
import 'prismjs/components/prism-markdown'
import 'prismjs/components/prism-sql'

interface SyntaxHighlighterProps {
  code: string
  language: string
}

export function SyntaxHighlighter({ code, language }: SyntaxHighlighterProps) {
  useEffect(() => {
    Prism.highlightAll()
  }, [code, language])

  const getLanguageClass = (lang: string) => {
    switch (lang) {
      case 'graphql':
        return 'language-graphql'
      case 'json':
        return 'language-json'
      case 'md':
      case 'markdown':
        return 'language-markdown'
      case 'sql':
        return 'language-sql'
      default:
        return 'language-jsx'
    }
  }

  return (
    <pre className="rounded-md">
      <code className={getLanguageClass(language)}>{code}</code>
    </pre>
  )
}

