import { PageLayout, SharedLayout } from "./quartz/cfg"
import * as Component from "./quartz/components"

// ファイル名からorder値を計算（00, 01, ... 3A, 3B, 3Z などを数値に変換）
function getOrderFromSlug(slug: string): number {
  // インデックスページ（第X部_xxxや付録）は0
  if (slug.startsWith("第") || slug === "付録") {
    return 0
  }

  // ファイル名から番号部分を取得（例: "30_設計書" → "30"）
  const match = slug.match(/^([0-9a-z]{2})[-_]/i)
  if (!match) return 999

  const code = match[1].toUpperCase()
  const first = code[0]
  const second = code[1]

  // 16進数風の変換: 0-9はそのまま、A=10, B=11, ..., Z=35
  function charToNum(c: string): number {
    if (c >= "0" && c <= "9") return parseInt(c)
    return c.charCodeAt(0) - "A".charCodeAt(0) + 10
  }

  // 部番号 * 100 + ページ番号 + 1
  return charToNum(first) * 100 + charToNum(second) + 1
}

// ファイル名から章内の連番を取得（例: 30→1, 31→2, 3A→11, 3Z→理解度チェック）
function getChapterNumber(slug: string): string {
  const match = slug.match(/^([0-9a-z]{2})[-_]/i)
  if (!match) return ""

  const code = match[1].toUpperCase()
  const second = code[1]

  // Zは「理解度チェック」なので番号なし
  if (second === "Z") return ""

  // 0-9は1-10、A-Yは11-35
  if (second >= "0" && second <= "9") {
    return (parseInt(second) + 1).toString()
  }
  return (second.charCodeAt(0) - "A".charCodeAt(0) + 11).toString()
}

// 表示名を加工（番号プレフィックスを削除し、連番を付与）
const customMapFn = (node: any) => {
  const slug = node.slugSegment || ""

  // フォルダ名から番号プレフィックスを削除（第X部_心構え → 第X部：心構え）
  if (node.isFolder && slug.match(/^第[0-9]部_/)) {
    node.displayName = slug.replace(/_/, "：")
    return
  }

  // ファイル名から番号プレフィックスを削除
  const match = slug.match(/^[0-9a-z]{2}[-_](.+)$/i)
  if (match) {
    const baseName = match[1]
    const chapterNum = getChapterNumber(slug)
    // 連番があれば付与、なければそのまま
    node.displayName = chapterNum ? `${chapterNum}. ${baseName}` : baseName
  }
}

// カスタムソート関数：order値でソート
const customSortFn = (a: any, b: any) => {
  // フォルダを先に表示
  if (a.isFolder && !b.isFolder) return -1
  if (!a.isFolder && b.isFolder) return 1

  // slugSegmentからorder値を取得してソート
  const aSlug = a.slugSegment || a.displayName
  const bSlug = b.slugSegment || b.displayName

  const aOrder = getOrderFromSlug(aSlug)
  const bOrder = getOrderFromSlug(bSlug)

  if (aOrder !== bOrder) {
    return aOrder - bOrder
  }

  // order値が同じ場合は名前順
  return a.displayName.localeCompare(b.displayName, undefined, {
    numeric: true,
    sensitivity: "base",
  })
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
    Component.Explorer({ sortFn: customSortFn, mapFn: customMapFn }),
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
    Component.Explorer({ sortFn: customSortFn, mapFn: customMapFn }),
  ],
  right: [],
}
