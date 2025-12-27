import { PageLayout, SharedLayout } from "./quartz/cfg"
import * as Component from "./quartz/components"

// カスタムソート関数：各部のインデックスページを先頭に表示
const customSortFn = (a: any, b: any) => {
  // フォルダを先に表示
  if (a.isFolder && !b.isFolder) return -1
  if (!a.isFolder && b.isFolder) return 1

  // フォルダ内では、フォルダ名と同じファイル（インデックス）を先頭に
  if (!a.isFolder && !b.isFolder) {
    const aName = a.name
    const bName = b.name

    // 「第X部_」で始まるファイルを先頭に
    const aIsIndex = aName.startsWith("第") && aName.includes("部_")
    const bIsIndex = bName.startsWith("第") && bName.includes("部_")
    if (aIsIndex && !bIsIndex) return -1
    if (!aIsIndex && bIsIndex) return 1

    // 「付録」を先頭に
    if (aName === "付録" && bName !== "付録") return -1
    if (aName !== "付録" && bName === "付録") return 1
  }

  // それ以外は名前順
  return a.name.localeCompare(b.name, "ja")
}

// components shared across all pages
export const sharedPageComponents: SharedLayout = {
  head: Component.Head(),
  header: [],
  afterBody: [],
  footer: Component.Footer({
    links: {
      GitHub: "https://github.com/jackyzha0/quartz",
      "Discord Community": "https://discord.gg/cRFFHYye7t",
    },
  }),
}

// components for pages that display a single page (e.g. a single note)
export const defaultContentPageLayout: PageLayout = {
  beforeBody: [
    Component.ConditionalRender({
      component: Component.Breadcrumbs(),
      condition: (page) => page.fileData.slug !== "index",
    }),
    Component.ArticleTitle(),
    Component.ContentMeta(),
    Component.TagList(),
  ],
  left: [
    Component.PageTitle(),
    Component.MobileOnly(Component.Spacer()),
    Component.Flex({
      components: [
        {
          Component: Component.Search(),
          grow: true,
        },
        { Component: Component.Darkmode() },
        { Component: Component.ReaderMode() },
      ],
    }),
    Component.Explorer({ sortFn: customSortFn }),
  ],
  right: [
    Component.Graph(),
    Component.DesktopOnly(Component.TableOfContents()),
    Component.Backlinks(),
  ],
}

// components for pages that display lists of pages  (e.g. tags or folders)
export const defaultListPageLayout: PageLayout = {
  beforeBody: [Component.Breadcrumbs(), Component.ArticleTitle(), Component.ContentMeta()],
  left: [
    Component.PageTitle(),
    Component.MobileOnly(Component.Spacer()),
    Component.Flex({
      components: [
        {
          Component: Component.Search(),
          grow: true,
        },
        { Component: Component.Darkmode() },
      ],
    }),
    Component.Explorer({ sortFn: customSortFn }),
  ],
  right: [],
}
