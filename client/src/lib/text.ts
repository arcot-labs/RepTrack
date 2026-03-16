export const capitalizeWords = (str: string) =>
    str.replace(/\b\w/g, (char) => char.toUpperCase())

export const formatIdentifier = (str: string) =>
    capitalizeWords(
        str
            // split camelCase
            .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
            // replace underscores & hyphens with spaces
            .replace(/[_-]+/g, ' ')
            .trim()
    )
