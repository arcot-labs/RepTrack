export function shouldTruncate(textElement: HTMLElement | null): boolean {
    if (!textElement) return false
    return textElement.offsetWidth < textElement.scrollWidth
}
