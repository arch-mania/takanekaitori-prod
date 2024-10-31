import contentfulManagement from 'contentful-management'
const { createClient } = contentfulManagement

const client = createClient({
  accessToken: process.env.CONTENTFUL_ACCESS_TOKEN
})

const BATCH_SIZE = 50
const DELAY_BETWEEN_BATCHES = 5000
const MAX_RETRIES = 3

const TARGET_AREA_IDS = ['shikoku', 'tohoku', 'chugoku', 'kyushu']

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function retryOperation(operation, retries = MAX_RETRIES) {
  try {
    return await operation()
  } catch (error) {
    if (retries > 0 && 
        (error.response?.status === 400 || error.response?.status === 429)) {
      console.log(`Operation failed. Retrying... (${retries} attempts left)`)
      await delay(1000)
      return retryOperation(operation, retries - 1)
    }
    throw error
  }
}

async function deleteStationsInSpecificAreas() {
  try {
    const space = await client.getSpace('c5ll46t87s6s')
    const environment = await space.getEnvironment('master')

    // Get all station entries with pagination
    let skip = 0
    let allEntries = []
    let total = 0

    do {
      const response = await environment.getEntries({
        content_type: 'station',
        limit: 100,
        skip: skip
      })
      
      total = response.total
      allEntries = [...allEntries, ...response.items]
      skip += response.items.length

      console.log(`Fetched ${allEntries.length} of ${total} entries`)
    } while (skip < total)

    console.log(`Total entries found: ${allEntries.length}`)

    // Filter entries by area with detailed logging
    const entriesToDelete = allEntries.filter(entry => {
      const areaLink = entry.fields.area?.ja?.sys
      if (!areaLink) {
        console.log(`Entry ${entry.sys.id} has no area field`)
        return false
      }
      const shouldDelete = TARGET_AREA_IDS.includes(areaLink.id)
      if (shouldDelete) {
        console.log(`Will delete entry ${entry.sys.id} from area ${areaLink.id}`)
      }
      return shouldDelete
    })

    console.log(`Found ${entriesToDelete.length} stations to delete`)

    // Delete filtered entries in batches
    for (let i = 0; i < entriesToDelete.length; i += BATCH_SIZE) {
      const batch = entriesToDelete.slice(i, i + BATCH_SIZE)
      console.log(`Processing batch ${Math.floor(i/BATCH_SIZE) + 1} of ${Math.ceil(entriesToDelete.length/BATCH_SIZE)}`)
      
      for (const entry of batch) {
        try {
          await retryOperation(async () => {
            if (entry.sys.publishedVersion) {
              console.log(`Unpublishing entry ${entry.sys.id}...`)
              await entry.unpublish()
            }
            console.log(`Deleting entry ${entry.sys.id}...`)
            await entry.delete()
            console.log(`Successfully deleted station entry ${entry.sys.id} from area ${entry.fields.area.ja.sys.id}`)
          })
        } catch (error) {
          console.error(`Failed to delete entry ${entry.sys.id}:`, error.message)
        }
      }
      
      if (i + BATCH_SIZE < entriesToDelete.length) {
        console.log(`Waiting ${DELAY_BETWEEN_BATCHES / 1000} seconds before next batch...`)
        await delay(DELAY_BETWEEN_BATCHES)
      }
    }

    console.log('Finished deleting specified stations')

  } catch (error) {
    console.error('Error:', error.message)
    if (error.response) {
      console.error('Response details:', error.response.data)
    }
  }
}

deleteStationsInSpecificAreas()