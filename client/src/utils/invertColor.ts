export default (color: string) => (
    '#' + color.slice(1)
        .split('')
        .map(c => (15 - parseInt(c, 16)).toString(16))
        .join('')
)