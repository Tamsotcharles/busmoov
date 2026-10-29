import type { ImageSeo } from '@/lib/blog'

/** Image de contenu pleine largeur, dimensions fixées pour éviter le décalage de mise en page. */
export function ImageContenu({ image }: { image: ImageSeo }) {
  return (
    <img
      src={image.src}
      alt={image.alt}
      width={image.width}
      height={image.height}
      decoding="async"
      className="w-full h-auto rounded-2xl shadow-md"
    />
  )
}
