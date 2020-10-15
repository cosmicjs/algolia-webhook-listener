const parseDate = require('./parseDate');
const parseFile = require('./parseFile');
const parseHtmlTextArea = require('./parseHtmlTextArea');
const parseObject = require('./parseObject');
const parseObjects = require('./parseObjects');
const parseRadioButtons = require('./parseRadioButtons');
const parseSelectDropdown = require('./parseSelectDropdown');
const parsePlainTextArea = require('./parsePlainTextArea');
const parseText = require('./parseText');
const parseSwitch = require('./parseSwitch');
const parseNumber = require('./parseNumber');
const parseCheckBoxes = require('./parseCheckBoxes');
const parseMarkdown = require('./parseMarkdown');

module.exports = (cosmicObject) => {
  const {
    _id,
    content,
    created_at,
    metafields,
    published_at,
    slug,
    title,
    type_slug,
  } = cosmicObject;
  const algoliaObject = {
    objectID: _id,
    content,
    created_at: new Date(created_at).valueOf(),
    published_at: new Date(published_at).valueOf(),
    slug,
    title,
    type_slug,
  };

  metafields.forEach((metafield) => {
    switch (metafield.type) {
      case 'date':
        algoliaObject[metafield.key] = parseDate(metafield);
        break;
      case 'file':
        algoliaObject[metafield.key] = parseFile(metafield);
        break;
      case 'html-textarea':
        algoliaObject[metafield.key] = parseHtmlTextArea(metafield);
        break;
      case 'radio-buttons':
        algoliaObject[metafield.key] = parseRadioButtons(metafield);
        break;
      case 'select-dropdown':
        algoliaObject[metafield.key] = parseSelectDropdown(metafield);
        break;
      case 'text':
        algoliaObject[metafield.key] = parseText(metafield);
        break;
      case 'textarea':
        algoliaObject[metafield.key] = parsePlainTextArea(metafield);
        break;
      case 'object':
        algoliaObject[metafield.key] = parseObject(metafield);
        break;
      case 'objects':
        algoliaObject[metafield.key] = parseObjects(metafield);
        break;
      case 'switch':
        algoliaObject[metafield.key] = parseSwitch(metafield);
        break;
      case 'number':
        algoliaObject[metafield.key] = parseNumber(metafield);
        break;
      case 'check-boxes':
        algoliaObject[metafield.key] = parseCheckBoxes(metafield);
        break;
      case 'markdown':
        algoliaObject[metafield.key] = parseMarkdown(metafield);
        break;
      default:
        if (process.env.NODE_ENV !== 'production') {
          // eslint-disable-next-line no-console
          console.log(`Metafield type, ${metafield.type}, not implemented yet.`);
        }
    }
  });

  return algoliaObject;
};
