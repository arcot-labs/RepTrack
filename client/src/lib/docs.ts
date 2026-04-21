type DocRegistry = Record<string, string>

const docs = import.meta.glob<string>('../docs/*.md', {
    eager: true,
    query: '?raw',
    import: 'default',
})

export function getDoc(slug: string, registry: DocRegistry = docs) {
    return registry[`../docs/${slug}.md`]
}

const h1Regex = /^#\s+(.+)$/m

export function getAllDocs(registry: DocRegistry = docs) {
    return Object.entries(registry)
        .map(([path, content]) => {
            const match = h1Regex.exec(content)
            const slug = path.split('/').pop()?.replace('.md', '')
            if (!slug) throw Error(`Skipping doc with invalid path: ${path}`)

            const title = match?.[1] ?? slug.replace(/-/g, ' ')
            return { slug, title }
        })
        .sort((a, b) =>
            a.title.localeCompare(b.title, undefined, {
                sensitivity: 'base',
            })
        )
}
