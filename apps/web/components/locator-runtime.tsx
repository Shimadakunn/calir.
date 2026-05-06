"use client"

import { useEffect } from "react"

const LOCATOR_OPTIONS_KEY = "LOCATOR_OPTIONS"
const LOCATOR_OPTIONS_UPDATED_EVENT = "LOCATOR_EXTENSION_UPDATED_OPTIONS"
const ZED_LINK_TEMPLATE =
  "zed://file${projectPath}${filePath}:${line}:${column}"
const WEB_APP_PATH_MARKER = "/apps/web/"

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
}

function getPathTransform() {
  const locatorPath = document.documentElement.dataset.locatorjs
  const markerIndex = locatorPath?.indexOf(WEB_APP_PATH_MARKER) ?? -1

  if (!locatorPath || markerIndex === -1) return undefined

  const projectRoot = locatorPath.slice(0, markerIndex)

  return {
    from: `${escapeRegExp(projectRoot)}${escapeRegExp(
      WEB_APP_PATH_MARKER.slice(0, -1)
    )}${escapeRegExp(projectRoot)}`,
    to: projectRoot,
  }
}

export function LocatorRuntime() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "development") return

    document.documentElement.dataset.locatorTarget = ZED_LINK_TEMPLATE

    const locatorOptions = {
      templateOrTemplateId: ZED_LINK_TEMPLATE,
      hrefTarget: "_self" as const,
      replacePath: getPathTransform(),
      welcomeScreenDismissed: true,
    }

    try {
      const currentOptions = JSON.parse(
        localStorage.getItem(LOCATOR_OPTIONS_KEY) || "{}"
      )

      localStorage.setItem(
        LOCATOR_OPTIONS_KEY,
        JSON.stringify({
          ...currentOptions,
          ...locatorOptions,
        })
      )
    } catch {
      localStorage.setItem(LOCATOR_OPTIONS_KEY, JSON.stringify(locatorOptions))
    }

    window.postMessage(
      { type: LOCATOR_OPTIONS_UPDATED_EVENT },
      window.location.origin
    )

    void (async () => {
      const { default: setupLocator } = await import("@locator/runtime")

      setupLocator({
        adapter: "jsx",
        showIntro: false,
      })
    })()
  }, [])

  return null
}
