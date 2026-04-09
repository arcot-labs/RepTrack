import { Mermaid } from '@/components/docs/Mermaid'
import { getDoc } from '@/lib/docs'
import Markdown from 'react-markdown'
import { useParams } from 'react-router-dom'
import rehypeHighlight from 'rehype-highlight'
import remarkGfm from 'remark-gfm'

export function Doc() {
    const { slug } = useParams()
    const content = slug ? getDoc(slug) : undefined

    if (content === undefined)
        return <div className="text-muted-foreground">Document not found</div>
    if (content.length === 0)
        return <div className="text-muted-foreground">No content</div>

    return (
        <article className="prose max-w-none prose-neutral dark:prose-invert prose-code:font-normal prose-code:before:content-none prose-code:after:content-none">
            <Markdown
                remarkPlugins={[remarkGfm]}
                rehypePlugins={[rehypeHighlight]}
                components={{
                    code({ className, children }) {
                        const languageRegex = /language-(\w+)/
                        const match = languageRegex.exec(className ?? '')
                        const language = match?.[1]
                        if (language === 'mermaid')
                            return <Mermaid code={children as string} />
                        return <code className={className}>{children}</code>
                    },
                }}
            >
                {content}
            </Markdown>
        </article>
    )
}
