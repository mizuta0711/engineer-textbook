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

// カスタムソート関数
// 注意: sortFnとmapFnはクライアントサイドで文字列から関数に変換されるため、
// 外部の関数を参照できない。すべてのロジックを関数内に含める必要がある。
const explorerOptions = {
  folderDefaultState: "open" as const,
  sortFn: (a: any, b: any) => {
    const aName = a.slugSegment || ""
    const bName = b.slugSegment || ""
    
    // 「第X部」のパターンをチェック
    const aBuMatch = aName.match(/^第(\d+)部/)
    const bBuMatch = bName.match(/^第(\d+)部/)
    const aIsBu = aBuMatch !== null
    const bIsBu = bBuMatch !== null
    const aIsAppendix = aName.startsWith("付録")
    const bIsAppendix = bName.startsWith("付録")
    
    // 「第X章」のパターンをチェック
    const aShoMatch = aName.match(/^第(\d+)章/)
    const bShoMatch = bName.match(/^第(\d+)章/)
    const aIsSho = aShoMatch !== null
    const bIsSho = bShoMatch !== null
    
    // 「XXX_」のパターンをチェック
    const aNumMatch = aName.match(/^(\d+)_/)
    const bNumMatch = bName.match(/^(\d+)_/)
    const aIsFile = aNumMatch !== null
    const bIsFile = bNumMatch !== null
    
    // 両方とも「第X部」または「付録」の場合
    if ((aIsBu || aIsAppendix) && (bIsBu || bIsAppendix)) {
      const aNum = aIsAppendix ? 999 : parseInt(aBuMatch![1], 10)
      const bNum = bIsAppendix ? 999 : parseInt(bBuMatch![1], 10)
      return aNum - bNum
    }
    // aが「第X部」または「付録」でbがそれ以外
    if ((aIsBu || aIsAppendix) && !(bIsBu || bIsAppendix)) {
      return -1
    }
    // bが「第X部」または「付録」でaがそれ以外
    if (!(aIsBu || aIsAppendix) && (bIsBu || bIsAppendix)) {
      return 1
    }

    // 両方とも「第X章」の場合
    if (aIsSho && bIsSho) {
      return parseInt(aShoMatch![1], 10) - parseInt(bShoMatch![1], 10)
    }
    // aが「第X章」でbがファイル
    if (aIsSho && bIsFile) {
      return -1
    }
    // bが「第X章」でaがファイル
    if (aIsFile && bIsSho) {
      return 1
    }

    // 両方とも数字ファイル（XXX_...）の場合
    if (aIsFile && bIsFile) {
      return parseInt(aNumMatch![1], 10) - parseInt(bNumMatch![1], 10)
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
