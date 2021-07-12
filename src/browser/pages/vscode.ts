import { getOptions, Options } from "../../common/util"
import "../register"

const options = getOptions()

// TODO: Add proper types.
/* eslint-disable @typescript-eslint/no-explicit-any */

// NOTE@jsjoeio
// This lives here ../../../lib/vscode/src/vs/base/common/platform.ts#L106
export const nlsConfigElementId = "vscode-remote-nls-configuration"

type NlsConfiguration = {
  locale: string
  availableLanguages: { [key: string]: string } | {}
  _languagePackId?: string
  _translationsConfigFile?: string
  _cacheRoot?: string
  _resolvedLanguagePackCoreLocation?: string
  _corruptedFile?: string
  _languagePackSupport?: boolean
  loadBundle?: any
}

/**
 * A helper function to get the NLS Configuration settings.
 *
 * This is used by VSCode for localizations (i.e. changing
 * the display language).
 *
 * Make sure to wrap this in a try/catch block when you call it.
 **/
export function getNlsConfiguration(document: Document) {
  const errorMsgPrefix = "[vscode]"
  const nlsConfigElement = document?.getElementById(nlsConfigElementId)
  const nlsConfig = nlsConfigElement?.getAttribute("data-settings")

  if (!document) {
    throw new Error(`${errorMsgPrefix} Could not parse NLS configuration. document is undefined.`)
  }

  if (!nlsConfigElement) {
    throw new Error(
      `${errorMsgPrefix} Could not parse NLS configuration. Could not find nlsConfigElement with id: ${nlsConfigElementId}`,
    )
  }

  if (!nlsConfig) {
    throw new Error(
      `${errorMsgPrefix} Could not parse NLS configuration. Found nlsConfigElement but missing data-settings attribute.`,
    )
  }

  return JSON.parse(nlsConfig) as NlsConfiguration
}

type RegisterRequireOnSelfType = {
  // NOTE@jsjoeio
  // We get the self type by looking at window.self.
  self: Window & typeof globalThis
  origin: string
  nlsConfig: NlsConfiguration
  options: Options
}

type RequireOnSelfType = {
  baseUrl: string
  recordStats: boolean
  paths: {
    [key: string]: string
  }
  "vs/nls": NlsConfiguration
}

/**
 * A helper function to register the require on self.
 *
 * The require property is used by VSCode/code-server
 * to load files.
 *
 * We extracted the logic into a function so that
 * it's easier to test.
 **/
export function registerRequireOnSelf({ self, origin, nlsConfig, options }: RegisterRequireOnSelfType) {
  const errorMsgPrefix = "[vscode]"

  if (!self) {
    throw new Error(`${errorMsgPrefix} Could not register require on self. self is undefined.`)
  }

  if (!origin) {
    throw new Error(`${errorMsgPrefix} Could not register require on self. origin is undefined or missing.`)
  }

  if (!options || !options.csStaticBase) {
    throw new Error(
      `${errorMsgPrefix} Could not register require on self. options or options.csStaticBase is undefined or missing.`,
    )
  }

  if (!nlsConfig) {
    throw new Error(`${errorMsgPrefix} Could not register require on self. nlsConfig is undefined.`)
  }

  const requireOnSelf: RequireOnSelfType = {
    // Without the full URL VS Code will try to load file://.
    baseUrl: `${origin}${options.csStaticBase}/lib/vscode/out`,
    recordStats: true,
    paths: {
      "vscode-textmate": `../node_modules/vscode-textmate/release/main`,
      "vscode-oniguruma": `../node_modules/vscode-oniguruma/release/main`,
      xterm: `../node_modules/xterm/lib/xterm.js`,
      "xterm-addon-search": `../node_modules/xterm-addon-search/lib/xterm-addon-search.js`,
      "xterm-addon-unicode11": `../node_modules/xterm-addon-unicode11/lib/xterm-addon-unicode11.js`,
      "xterm-addon-webgl": `../node_modules/xterm-addon-webgl/lib/xterm-addon-webgl.js`,
      "tas-client-umd": `../node_modules/tas-client-umd/lib/tas-client-umd.js`,
      "iconv-lite-umd": `../node_modules/iconv-lite-umd/lib/iconv-lite-umd.js`,
      jschardet: `../node_modules/jschardet/dist/jschardet.min.js`,
    },
    "vs/nls": nlsConfig,
  }

  // TODO@jsjoeio
  // I'm not sure how to properly type cast this
  // This might be our best bet
  // Source: https://stackoverflow.com/a/30740935
  type FixMeLater = any
  ;(self.require as FixMeLater) = requireOnSelf
}

try {
  const nlsConfig = getNlsConfiguration(document)
  if (nlsConfig._resolvedLanguagePackCoreLocation) {
    const bundles = Object.create(null)
    nlsConfig.loadBundle = (bundle: any, _language: any, cb: any): void => {
      const result = bundles[bundle]
      if (result) {
        return cb(undefined, result)
      }
      // FIXME: Only works if path separators are /.
      const path = nlsConfig._resolvedLanguagePackCoreLocation + "/" + bundle.replace(/\//g, "!") + ".nls.json"
      fetch(`${options.base}/vscode/resource/?path=${encodeURIComponent(path)}`)
        .then((response) => response.json())
        .then((json) => {
          bundles[bundle] = json
          cb(undefined, json)
        })
        .catch(cb)
    }
  }
  registerRequireOnSelf({
    self,
    nlsConfig,
    options,
    origin: window.location.origin,
  })
} catch (error) {
  console.error(error)
}

export function setBodyBackgroundToThemeBackgroundColor(document: Document, localStorage: Storage) {
  const errorMsgPrefix = "[vscode]"

  if (!document) {
    throw new Error(`${errorMsgPrefix} Could not set body background to theme background color. Document is undefined.`)
  }

  if (!localStorage) {
    throw new Error(
      `${errorMsgPrefix} Could not set body background to theme background color. localStorage is undefined.`,
    )
  }

  const colorThemeData = localStorage.getItem("colorThemeData")

  if (!colorThemeData) {
    throw new Error(
      `${errorMsgPrefix} Could not set body background to theme background color. Could not find colorThemeData in localStorage.`,
    )
  }

  let _colorThemeData
  try {
    // We wrap this JSON.parse logic in a try/catch
    // because it can throw if the JSON is invalid.
    // and instead of throwing a random error
    // we can throw our own error, which will be more helpful
    // to the end user.
    _colorThemeData = JSON.parse(colorThemeData)
  } catch {
    throw new Error(
      `${errorMsgPrefix} Could not set body background to theme background color. Could not parse colorThemeData from localStorage.`,
    )
  }

  const hasColorMapProperty = Object.prototype.hasOwnProperty.call(_colorThemeData, "colorMap")
  if (!hasColorMapProperty) {
    throw new Error(
      `${errorMsgPrefix} Could not set body background to theme background color. colorThemeData is missing colorMap.`,
    )
  }

  const editorBgColor = _colorThemeData.colorMap["editor.background"]

  if (!editorBgColor) {
    throw new Error(
      `${errorMsgPrefix} Could not set body background to theme background color. colorThemeData.colorMap["editor.background"] is undefined.`,
    )
  }

  document.body.style.background = editorBgColor

  return null
}

try {
  setBodyBackgroundToThemeBackgroundColor(document, localStorage)
} catch (error) {
  console.error("Something went wrong setting the body background to the theme background color.")
  console.error(error)
}
