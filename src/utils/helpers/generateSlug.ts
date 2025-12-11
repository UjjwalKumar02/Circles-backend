export default function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[\s\_]+/g, "-")       // replace spaces/underscores with hyphens
    .replace(/[^a-z0-9\-]/g, "")    // remove invalid characters
    .replace(/-+/g, "-");           // collapse multiple hyphens
}
