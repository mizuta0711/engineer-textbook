import { PageLayout, SharedLayout } from "./quartz/cfg"
import * as Component from "./quartz/components"

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

// ソート用のヘルパー関数
// 「第X部」「第X章」から数字を抽出、「付録」は999として扱う
function extractOrder(name: string): { type: string; num: number } | null {
  // 「第X部_...」のパターン
  const buMatch = name.match(/^第(\d+)部/)
  if (buMatch) {
    return { type: "bu", num: parseInt(buMatch[1], 10) }
  }
  // 「第X章_...」のパターン
  const shoMatch = name.match(/^第(\d+)章/)
  if (shoMatch) {
    return { type: "sho", num: parseInt(shoMatch[1], 10) }
  }
  // 「付録」のパターン
  if (name.startsWith("付録")) {
    return { type: "bu", num: 999 }
  }
  // 「XXX_...」（数字3桁で始まる）のパターン
  const numMatch = name.match(/^(\d+)_/)
  if (numMatch) {
    return { type: "file", num: parseInt(numMatch[1], 10) }
  }
  return null
}

// カスタムソート関数
const explorerOptions = {
  folderDefaultState: "open" as const,
  sortFn: (a: any, b: any) => {
    const aName = a.slugSegment || ""
    const bName = b.slugSegment || ""
    const aOrder = extractOrder(aName)
    const bOrder = extractOrder(bName)

    // 両方とも「第X部」または「付録」の場合
    if (aOrder?.type === "bu" && bOrder?.type === "bu") {
      return aOrder.num - bOrder.num
    }
    // aが「第X部」でbがそれ以外
    if (aOrder?.type === "bu" && bOrder?.type !== "bu") {
      return -1
    }
    // bが「第X部」でaがそれ以外
    if (aOrder?.type !== "bu" && bOrder?.type === "bu") {
      return 1
    }

    // 両方とも「第X章」の場合
    if (aOrder?.type === "sho" && bOrder?.type === "sho") {
      return aOrder.num - bOrder.num
    }
    // aが「第X章」でbがファイル
    if (aOrder?.type === "sho" && bOrder?.type === "file") {
      return -1
    }
    // bが「第X章」でaがファイル
    if (aOrder?.type === "file" && bOrder?.type === "sho") {
      return 1
    }

    // 両方とも数字ファイル（XXX_...）の場合
    if (aOrder?.type === "file" && bOrder?.type === "file") {
      return aOrder.num - bOrder.num
    }

    // その他はアルファベット順
    return aName.localeCompare(bName, undefined, {
      numeric: true,
      sensitivity: "base",
    })
  },
  mapFn: (node: any) => {
    if (node.slugSegment) {
      // 先頭の「XXX_」（数字+アンダースコア）を削除して表示
      // 例: "000_本書の構成" → "本書の構成"
      const cleaned = node.slugSegment.replace(/^\d+_/, "")
      node.displayName = cleaned
    }
  },
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
    Component.Explorer(explorerOptions),
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
    Component.Explorer(explorerOptions),
  ],
  right: [],
}
