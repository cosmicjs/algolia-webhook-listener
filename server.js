require('dotenv').config({ path: './.env' });
const express = require('express');
const bodyParser = require('body-parser');
const corser = require('corser');
const algoliasearch = require('algoliasearch');
const cosmic = require('cosmicjs');
const convertCosmicObjToAlgoliaObj = require('./utils/convertCosmicObjToAlgoliaObj');

const Cosmic = cosmic();
const searchBucket = Cosmic.bucket({ slug: process.env.COSMIC_BUCKET });

const port = parseInt(process.env.PORT, 10) || 3000;

const server = express();

server.use(corser.create());
server.use(bodyParser.json());

server.post('/api/addBucketSlug', async (req, res) => {
  try {
    const { id, slug } = req.body;
    if (!id || !slug) {
      throw new Error('Must provide bucket id and slug');
    }

    await searchBucket.addObject({
      content: slug,
      slug: id,
      title: 'Bucket Slug',
      type_slug: 'bucket-slug',
    });

    return res.status(200).send();
  } catch (e) {
    return res.status(400).json({ error: e.message });
  }
});

server.post('/api/create', async (req, res) => {
  try {
    const { data } = req.body;
    const { bucket, type_slug } = data;

    const algoliaObject = convertCosmicObjToAlgoliaObj(data);
    const bucketSlugRes = await searchBucket.getObject({ slug: bucket });
    const projectBucketSlug = bucketSlugRes.object.content;

    // Fetch algolia application id & admin api key
    const projectBucket = Cosmic.bucket({ slug: projectBucketSlug });
    const getKeysRes = await Promise.all([
      projectBucket.getObject({ slug: 'algolia-info-application-id' }).catch(() => undefined),
      projectBucket.getObject({ slug: 'algolia-info-admin-api-key' }).catch(() => undefined),
    ]);

    const applicationId = getKeysRes[0] && getKeysRes[0].object && getKeysRes[0].object.content;
    const adminApiKey = getKeysRes[1] && getKeysRes[1].object && getKeysRes[1].object.content;

    const client = algoliasearch(applicationId, adminApiKey);
    const index = client.initIndex(type_slug);
    const addRes = await index.addObject(algoliaObject);
    const { taskID } = addRes;
    await index.waitTask(taskID);
    res.status(200).send();
  } catch (e) {
    console.error(e); // eslint-disable-line no-console
    res.status(200).send();
  }
});

server.listen(port, (err) => {
  if (err) throw err;
  // eslint-disable-next-line no-console
  console.log(`√ Ready at http://localhost:${port}`);
});
