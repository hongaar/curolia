/** Build a Flickr static CDN URL for a known server/id/secret triple. */
export function flickrStaticPhotoUrl(args: {
  server: string;
  id: string;
  secret: string;
  size?: string;
}): string {
  const size = args.size ?? "z";
  return `https://live.staticflickr.com/${args.server}/${args.id}_${args.secret}_${size}.jpg`;
}
