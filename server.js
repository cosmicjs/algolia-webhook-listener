const express = require('express');
const bodyParser = require('body-parser');
const corser = require('corser');
const algoliasearch = require('algoliasearch');
const cosmic = require('cosmicjs');
const convertCosmicObjToAlgoliaObj = require('./utils/convertCosmicObjToAlgoliaObj');

const Cosmic = cosmic();
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

    const searchBucket = Cosmic.bucket({ slug: 'algolia-search' });

    await searchBucket.addObject({
      content: slug,
      slug: id,
      title: id,
      type_slug: 'bucket-slugs',
    });

    return res.status(200).send();
  } catch (e) {
    console.error(e); // eslint-disable-line no-console
    return res.status(400).json({ error: e.message });
  }
});

server.post('/api/removeBucketSlug/:id', async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) {
      throw new Error('No id provided');
    }

    const searchBucket = Cosmic.bucket({ slug: 'algolia-search' });
    await searchBucket.deleteObject({ slug: id }).catch(() => undefined);
    return res.status(200).send();
  } catch (e) {
    console.error(e); // eslint-disable-line no-console
    return res.status(400).json({ error: e.message });
  }
});

server.post('/api/create', async (req, res) => {
  try {
    const { data } = req.body;
    const { read_key } = req.query;
    const { bucket, type_slug } = data;

    const algoliaObject = convertCosmicObjToAlgoliaObj(data);
    const searchBucket = Cosmic.bucket({ slug: 'algolia-search' });
    const bucketSlugRes = await searchBucket.getObject({ slug: bucket });
    const projectBucketSlug = bucketSlugRes.object.content;

    // Fetch algolia application id & admin api key
    const projectBucket = Cosmic.bucket({ slug: projectBucketSlug, read_key: read_key });
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

server.post('/api/edit', async (req, res) => {
  try {
    const { data } = req.body;
    const { read_key } = req.query;
    const { bucket, type_slug } = data;

    const algoliaObject = convertCosmicObjToAlgoliaObj(data);
    const searchBucket = Cosmic.bucket({ slug: 'algolia-search' });
    const bucketSlugRes = await searchBucket.getObject({ slug: bucket });
    const projectBucketSlug = bucketSlugRes.object.content;

    // Fetch algolia application id & admin api key
    const projectBucket = Cosmic.bucket({
      slug: projectBucketSlug,
      read_key: read_key
    });
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

server.post('/api/delete', async (req, res) => {
  try {
    const { data } = req.body;

    const {
      _id,
      bucket,
      type_slug,
    } = data;

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
    const addRes = await index.deleteObject(_id);
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
