export function toSimpleSelector(element: HTMLElement): string {
  if (element.id) {
    return `#${element.id}`;
  }

  const classList = Array.from(element.classList).slice(0, 3);
  if (classList.length > 0) {
    return `${element.tagName.toLowerCase()}.${classList.join('.')}`;
  }

  return element.tagName.toLowerCase();
}
