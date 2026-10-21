import { Inject, Injectable } from "@angular/core"
import { DOCUMENT } from "@angular/common"
import { Meta, Title } from "@angular/platform-browser"

export interface SeoData {
  title: string
  description: string
  path: string 
  image?: string
  noindex?: boolean
}

@Injectable({ providedIn: "root" })
export class SeoService {
  private readonly siteUrl = "https://beerhub.es"
  private readonly siteName = "BeerHub"
  private readonly defaultImage =
    "https://firebasestorage.googleapis.com/v0/b/beer-hub.appspot.com/o/images%2Fmisc%2FBH-logo.webp?alt=media&token=73720b7f-bb1e-444f-82e4-919d064cd7d6"

  constructor(
    private titleService: Title,
    private meta: Meta,
    @Inject(DOCUMENT) private doc: Document,
  ) {}

  update(data: SeoData): void {
    const title = data.title.includes(this.siteName) ? data.title : `${data.title} | ${this.siteName}`
    const description = this.clean(data.description, 155)
    const url = this.siteUrl + data.path
    const image = data.image || this.defaultImage

    this.titleService.setTitle(title)
    this.meta.updateTag({ name: "description", content: description })
    this.meta.updateTag({ name: "robots", content: data.noindex ? "noindex" : "index, follow" })

    this.meta.updateTag({ property: "og:site_name", content: this.siteName })
    this.meta.updateTag({ property: "og:type", content: "website" })
    this.meta.updateTag({ property: "og:title", content: title })
    this.meta.updateTag({ property: "og:description", content: description })
    this.meta.updateTag({ property: "og:url", content: url })
    this.meta.updateTag({ property: "og:image", content: image })

    this.meta.updateTag({ name: "twitter:card", content: "summary_large_image" })
    this.meta.updateTag({ name: "twitter:title", content: title })
    this.meta.updateTag({ name: "twitter:description", content: description })
    this.meta.updateTag({ name: "twitter:image", content: image })

    this.setCanonical(url)
  }

  private setCanonical(url: string): void {
    let link = this.doc.head.querySelector<HTMLLinkElement>('link[rel="canonical"]')
    if (!link) {
      link = this.doc.createElement("link")
      link.setAttribute("rel", "canonical")
      this.doc.head.appendChild(link)
    }
    link.setAttribute("href", url)
  }

  private clean(text: string, max: number): string {
    const flat = (text ?? "").replace(/\s+/g, " ").trim()
    if (flat.length <= max) return flat
    const cut = flat.slice(0, max - 1)
    return cut.slice(0, cut.lastIndexOf(" ")) + "…"
  }
}
