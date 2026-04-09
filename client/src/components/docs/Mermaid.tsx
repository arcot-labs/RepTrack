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
        let isMounted = true
        void mermaid
            .render(id, code.trim())
            .then(({ svg }) => {
                if (isMounted && ref.current) ref.current.innerHTML = svg
            })
            .catch(() => {
                if (isMounted && ref.current) ref.current.innerHTML = ''
            })
        return () => {
            isMounted = false
        }
    }, [code, id])

    return (
        <div
            ref={ref}
            className="my-4 flex justify-center overflow-x-auto rounded-md bg-black p-3"
        />
    )
}
