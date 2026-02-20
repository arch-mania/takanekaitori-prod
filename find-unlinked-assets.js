import contentfulManagement from 'contentful-management'
import fs from 'fs'

const { createClient } = contentfulManagement

if (!process.env.CONTENTFUL_ACCESS_TOKEN) {
  console.error('CONTENTFUL_ACCESS_TOKEN is required.')
  process.exit(1)
}

const client = createClient({
  accessToken: process.env.CONTENTFUL_ACCESS_TOKEN
})

const SPACE_ID = 'c5ll46t87s6s'
const ENVIRONMENT_ID = 'master'

async function getAllAssets(environment) {
  let skip = 0
  let allAssets = []
  let total = 0

  do {
    const response = await environment.getAssets({
      limit: 100,
      skip: skip
    })

    total = response.total
    allAssets = [...allAssets, ...response.items]
    skip += response.items.length

    console.log(`Fetched ${allAssets.length} of ${total} assets`)
  } while (skip < total)

  return allAssets
}

async function getAllEntries(environment) {
  let skip = 0
  let allEntries = []
  let total = 0

  do {
    const response = await environment.getEntries({
      limit: 100,
      skip: skip
    })

    total = response.total
    allEntries = [...allEntries, ...response.items]
    skip += response.items.length

    console.log(`Fetched ${allEntries.length} of ${total} entries`)
  } while (skip < total)

  return allEntries
}

function extractAssetIds(obj, assetIds = new Set()) {
  if (!obj || typeof obj !== 'object') return assetIds

  if (obj.sys && obj.sys.type === 'Link' && obj.sys.linkType === 'Asset') {
    assetIds.add(obj.sys.id)
    return assetIds
  }

  for (const value of Object.values(obj)) {
    if (Array.isArray(value)) {
      for (const item of value) {
        extractAssetIds(item, assetIds)
      }
    } else if (typeof value === 'object') {
      extractAssetIds(value, assetIds)
    }
  }

  return assetIds
}

async function findUnlinkedAssets() {
  try {
    console.log('Connecting to Contentful...')
    const space = await client.getSpace(SPACE_ID)
    const environment = await space.getEnvironment(ENVIRONMENT_ID)

    console.log('\nFetching all assets...')
    const allAssets = await getAllAssets(environment)

    console.log('\nFetching all entries...')
    const allEntries = await getAllEntries(environment)

    console.log('\nExtracting asset references from entries...')
    const linkedAssetIds = new Set()
    for (const entry of allEntries) {
      extractAssetIds(entry.fields, linkedAssetIds)
    }

    console.log(`Found ${linkedAssetIds.size} linked assets`)

    const unlinkedAssets = allAssets.filter(asset => !linkedAssetIds.has(asset.sys.id))

    console.log(`Found ${unlinkedAssets.length} unlinked assets`)

    // 日本時間にフォーマット
    const formatJST = (isoString) => {
      const date = new Date(isoString)
      const jst = new Date(date.getTime() + 9 * 60 * 60 * 1000)
      const year = jst.getUTCFullYear()
      const month = String(jst.getUTCMonth() + 1).padStart(2, '0')
      const day = String(jst.getUTCDate()).padStart(2, '0')
      const hours = String(jst.getUTCHours()).padStart(2, '0')
      const minutes = String(jst.getUTCMinutes()).padStart(2, '0')
      return `${year}/${month}/${day} ${hours}:${minutes}`
    }

    // CSV output
    const csvHeader = 'ID,タイトル,ファイル名,URL,作成日時,更新日時'
    const csvRows = unlinkedAssets.map(asset => {
      const id = asset.sys.id
      const title = (asset.fields.title?.ja || asset.fields.title?.['en-US'] || '').replace(/,/g, ';').replace(/\n/g, ' ')
      const file = asset.fields.file?.ja || asset.fields.file?.['en-US'] || {}
      const filename = (file.fileName || '').replace(/,/g, ';')
      const rawUrl = file.url || ''
      const url = rawUrl ? `https:${rawUrl}` : ''
      const createdAt = formatJST(asset.sys.createdAt)
      const updatedAt = formatJST(asset.sys.updatedAt)

      return `${id},"${title}","${filename}",${url},${createdAt},${updatedAt}`
    })

    const csvContent = [csvHeader, ...csvRows].join('\n')
    const outputPath = './unlinked-assets.csv'
    fs.writeFileSync(outputPath, csvContent)

    console.log(`\nCSV file created: ${outputPath}`)
    console.log(`Total unlinked assets: ${unlinkedAssets.length}`)

  } catch (error) {
    console.error('Error:', error.message)
    if (error.response) {
      console.error('Response details:', error.response.data)
    }
  }
}

findUnlinkedAssets()
