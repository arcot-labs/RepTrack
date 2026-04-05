import mermaid from 'mermaid'
import { useEffect, useId, useRef } from 'react'

mermaid.initialize({
    startOnLoad: false,
    theme: 'forest',
})

export function Mermaid({ code }: { code: string }) {
    const ref = useRef<HTMLDivElement>(null)
    const id = useId()

    useEffect(() => {
        void mermaid.render(id, code).then(({ svg }) => {
            if (ref.current) ref.current.innerHTML = svg
        })
    }, [code, id])

    return <div ref={ref} className="my-4 flex justify-center" />
}
