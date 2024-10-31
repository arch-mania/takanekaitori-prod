import contentfulManagement from 'contentful-management'
const { createClient } = contentfulManagement

const client = createClient({
  accessToken: process.env.CONTENTFUL_ACCESS_TOKEN
})

const BATCH_SIZE = 50 // Number of entries to process in each batch
const DELAY_BETWEEN_BATCHES = 5000 // Delay in milliseconds between batches
const MAX_RETRIES = 3 // Maximum number of retries for each operation

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function retryOperation(operation, retries = MAX_RETRIES) {
  try {
    return await operation()
  } catch (error) {
    if (retries > 0 && error.response && error.response.status === 400) {
      console.log(`Operation failed. Retrying... (${retries} attempts left)`)
      await delay(1000) // Wait for 1 second before retrying
      return retryOperation(operation, retries - 1)
    }
    throw error
  }
}

async function deleteContentTypeAndEntries() {
  try {
    const space = await client.getSpace('c5ll46t87s6s')
    const environment = await space.getEnvironment('master')

    // Get all entries of the 'property' content type
    const entries = await environment.getEntries({
      content_type: 'property',
      limit: 1000 // Adjust this value based on your needs
    })

    // Delete entries in batches
    for (let i = 0; i < entries.items.length; i += BATCH_SIZE) {
      const batch = entries.items.slice(i, i + BATCH_SIZE)
      for (const entry of batch) {
        await retryOperation(async () => {
          if (entry.sys.publishedVersion) {
            await entry.unpublish()
          }
          await entry.delete()
          console.log(`Deleted entry ${entry.sys.id}`)
        })
      }
      if (i + BATCH_SIZE < entries.items.length) {
        console.log(`Waiting ${DELAY_BETWEEN_BATCHES / 1000} seconds before next batch...`)
        await delay(DELAY_BETWEEN_BATCHES)
      }
    }

    // Delete the content type
    await retryOperation(async () => {
      const contentType = await environment.getContentType('property')
      if (contentType.sys.publishedVersion) {
        await contentType.unpublish()
      }
      await contentType.delete()
      console.log('Deleted property content type')
    })

  } catch (error) {
    console.error('Error:', error)
  }
}

deleteContentTypeAndEntries()