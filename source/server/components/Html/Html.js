/* @flow */

import React from 'react'
import { renderToString } from 'react-dom/server'
import { HelmetProvider } from 'react-helmet-async'
import { StaticRouter } from 'react-router-dom'
import { createGlobalStyle, ServerStyleSheet } from 'styled-components'
import { normalize } from 'polished'
import { Capture } from 'react-loadable'
import { getBundles } from 'react-loadable/webpack'

import faviconUrl from 'server/components/Html/images/favicon.ico'

const GlobalNormalizeStyle = createGlobalStyle`${normalize()}`

const GlobalSizeStyle = createGlobalStyle`
  html, body, #${process.env.REACT_CONTAINER_ID} {
    height: 100%;
    background-color: black important;

    margin: 0;

    padding: 0;

    width: 100%;
  }
`
console.log(GlobalNormalizeStyle)

export const Html = ({
  App,
  clientStats,
  helmetContext,
  location,
  reactLoadableModules,
  reactLoadableStats,
  routerContext,
}: {
  App?: React$ComponentType<*>,
  clientStats?: *,
  helmetContext?: {
    helmet?: *,
  },
  location?: string,
  reactLoadableModules?: *,
  reactLoadableStats?: *,
  routerContext?: *,
  styleSheet?: *,
}) => {
  const styleSheet = new ServerStyleSheet()
  try {
    if (App == undefined) return null
    if (clientStats == undefined) return null
    if (helmetContext == undefined) return null
    if (location == undefined) return null
    if (reactLoadableModules == undefined) return null
    if (reactLoadableStats == undefined) return null
    if (routerContext == undefined) return null
    
    const __html = renderToString(
      styleSheet.collectStyles(
        <Capture report={m => reactLoadableModules.push(m)}>
          <HelmetProvider context={helmetContext}>
            <StaticRouter context={routerContext} location={location}>
              <App />
            </StaticRouter>
          </HelmetProvider>
        </Capture>,
      ),
    )

    const { helmet } = helmetContext

    if (helmet == undefined) return null

    const htmlAttributes = helmet.htmlAttributes.toComponent()
    const bodyAttributes = helmet.bodyAttributes.toComponent()

    const base = helmet.base.toComponent()
    const link = helmet.link.toComponent()
    const meta = helmet.meta.toComponent()
    const noscript = helmet.noscript.toComponent()
    const script = helmet.script.toComponent()
    const style = helmet.style.toComponent()
    const title = helmet.title.toComponent()

    /* webpack bundles */
    const { assetsByChunkName } = clientStats

    if (assetsByChunkName == undefined) return null

    const { bootstrap, vendor, main } = assetsByChunkName

    const bootstrapFile = Array.isArray(bootstrap) ? bootstrap[0] : bootstrap
    const vendorFile = Array.isArray(vendor) ? vendor[0] : vendor
    const mainFile = Array.isArray(main) ? main[0] : main

    /* react-loadable bundles */

    const bundles = getBundles(reactLoadableStats, reactLoadableModules)

    const styles = bundles.filter(bundle => bundle.file.endsWith('.css'))
    const scripts = bundles.filter(bundle => bundle.file.endsWith('.js'))

    return (
      <html {...htmlAttributes}>
        <head>
          {base}
          {link}
          {meta}
          {noscript}
          {script}
          {style}
          {title}
          <link rel={'shortcut icon'} href={faviconUrl} />
          {styleSheet.getStyleElement()}
          {styles.map(({ file }) => (
            <link key={file} href={`/${file}`} rel={'stylesheet'} />
          ))}
        </head>
        <body {...bodyAttributes}>
          <GlobalNormalizeStyle/>
          <GlobalSizeStyle/>
          <div
            id={process.env.REACT_CONTAINER_ID}
            dangerouslySetInnerHTML={{ __html }}
          />
          <script src={`/${bootstrapFile}`} />
          <script src={`/${vendorFile}`} />
          {scripts.map(({ file }) => <script key={file} src={`/${file}`} />)}
          <script src={`/${mainFile}`} />
        </body>
      </html>
    )
  } catch (error) {
    console.log(error)
    return null
  } finally {
    styleSheet.seal()
  }
}

export default Html
