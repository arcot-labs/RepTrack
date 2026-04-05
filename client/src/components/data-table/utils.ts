export function isTruncatedText(textElement: HTMLElement | null): boolean {
    if (!textElement) return false
    return textElement.offsetWidth < textElement.scrollWidth
}
