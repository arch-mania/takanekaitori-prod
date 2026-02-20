import contentfulManagement from 'contentful-management';
const { createClient } = contentfulManagement;

const isExecuteMode = process.argv.includes('--execute');
const isDryRun = !isExecuteMode;

if (isExecuteMode && process.env.CONFIRM_CONTENTFUL_WRITE !== 'true') {
  console.error('Set CONFIRM_CONTENTFUL_WRITE=true with --execute to run this write script.');
  process.exit(1);
}

if (!process.env.CONTENTFUL_ACCESS_TOKEN) {
  console.error('CONTENTFUL_ACCESS_TOKEN is required.');
  process.exit(1);
}

const client = createClient({
  accessToken: process.env.CONTENTFUL_ACCESS_TOKEN
});

const BATCH_SIZE = 50;
const DELAY_BETWEEN_BATCHES = 5000;
const MAX_RETRIES = 3;

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function retryOperation(operation, retries = MAX_RETRIES) {
  try {
    return await operation();
  } catch (error) {
    if (retries > 0 && (error.response?.status === 400 || error.response?.status === 429)) {
      console.log(`Operation failed. Retrying... (${retries} attempts left)`);
      await delay(1000);
      return retryOperation(operation, retries - 1);
    }
    throw error;
  }
}

async function publishAllEntries() {
  try {
    console.log(`[MODE] ${isDryRun ? 'DRY-RUN' : 'EXECUTE'}`);
    if (isDryRun) {
      console.log('No write operations will be executed. Use --execute to apply changes.');
    }

    const space = await client.getSpace('c5ll46t87s6s');
    const environment = await space.getEnvironment('master');

    let skip = 0;
    let allEntries = [];
    
    // ページネーションで全エントリーを取得
    while (true) {
      const response = await environment.getEntries({
        content_type: 'property',
        limit: 100,
        skip: skip,
      });
      
      allEntries = [...allEntries, ...response.items];
      if (response.items.length < 100) break;
      skip += response.items.length;
    }

    // 未公開のエントリーのみをフィルタリング
    const unpublishedEntries = allEntries.filter(entry => {
      const isPublished = entry.sys.publishedVersion && entry.sys.publishedVersion >= entry.sys.version - 1;
      return !isPublished;
    });

    console.log(`Found ${unpublishedEntries.length} unpublished entries out of ${allEntries.length} total entries`);

    // 未公開エントリーのバッチ処理
    for (let i = 0; i < unpublishedEntries.length; i += BATCH_SIZE) {
      const batch = unpublishedEntries.slice(i, i + BATCH_SIZE);
      console.log(
        `Processing batch ${Math.floor(i / BATCH_SIZE) + 1} of ${Math.ceil(unpublishedEntries.length / BATCH_SIZE)}`
      );

      for (const entry of batch) {
        try {
          if (isDryRun) {
            console.log(`[DRY-RUN] Would publish entry ${entry.sys.id}`);
            continue;
          }
          await retryOperation(async () => {
            await entry.publish();
            console.log(`Published entry ${entry.sys.id}`);
          });
        } catch (error) {
          console.error(`Failed to publish entry ${entry.sys.id}:`, error.message);
          if (error.details?.errors) {
            console.error('Validation errors:', JSON.stringify(error.details.errors, null, 2));
          }
        }
      }

      if (i + BATCH_SIZE < unpublishedEntries.length) {
        console.log(`Waiting ${DELAY_BETWEEN_BATCHES / 1000} seconds before next batch...`);
        await delay(DELAY_BETWEEN_BATCHES);
      }
    }

    console.log('All unpublished entries have been processed');

  } catch (error) {
    console.error('Error:', error.message);
    if (error.details?.errors) {
      console.error('Validation errors:', JSON.stringify(error.details.errors, null, 2));
    }
  }
}

publishAllEntries();
